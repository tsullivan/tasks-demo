import moment from 'moment';
import { get } from 'lodash';
import { nextRun } from './next_run';

export async function checkLicenseStatus(callWithInternalUser) {
  const params = {
    size: 100,
    filterPath: [
      'hits.hits._source.cluster_uuid',
      'hits.hits._source.cluster_name',
      'hits.hits._source.timestamp',
      'hits.hits._source.license',
    ],
    body: {
      query: { term: { type: { value: 'cluster_stats' } } },
      collapse: { field: 'cluster_uuid' },
      sort: { timestamp: { order: 'desc' } },
    },
  };

  const response = await callWithInternalUser('search', params);
  return get(response, 'hits.hits', []).reduce((accum, { _source: source }) => {
    const { license } = source;
    return {
      ...accum,
      [source.cluster_uuid]: {
        cluster_name: source.cluster_name,
        timestamp: source.timestamp,
        license: license.type,
        expiry: {
          millis: license.expiry_date_in_millis,
          date: license.expiry_date,
          daysTo: Math.ceil(
            moment
              .duration(moment.utc(license.expiry_date_in_millis) - moment.utc())
              .as('days')
          ),
        },
      },
    };
  }, {});
}

const SEV_CRITICAL = 'critical';
const SEV_MEDIUM = 'medium';
const SEV_INFO = 'info';

const getSeverity = daysTo => {
  if (daysTo < 0) {
    return SEV_CRITICAL;
  }
  if (daysTo < 10) {
    return SEV_MEDIUM;
  }
  if (daysTo < 40) {
    return SEV_INFO;
  }
};

export function checkLicenseStatusTask({ kbnServer, taskInstance }) {
  const { server } = kbnServer;
  const { callWithInternalUser } = server.plugins.elasticsearch.getCluster(
    'monitoring'
  );

  return async () => {
    const runStart = moment.utc();
    const state = await checkLicenseStatus(callWithInternalUser);

    // perform an alert
    if (server.plugins.notifications) {
      const { last_state: lastState } = taskInstance.state;
      const { notificationService } = server.plugins.notifications;
      const action = notificationService.getActionForId('xpack-notifications-logger');

      for (const clusterUuid of Object.keys(state)) {
        const cluster = state[clusterUuid];
        const severity = getSeverity(cluster.expiry.daysTo);
        state[clusterUuid].last_severity = severity;

        const lastAlerted = lastState[clusterUuid].last_alerted;
        const shouldSilence =
          lastAlerted && moment(moment.utc(lastAlerted) + 60000) >= moment.utc();

        if (shouldSilence) {
          continue;
        }

        let result = Promise.resolve({});

        switch (severity) {
          case SEV_CRITICAL:
            result = action.performAction({
              severity,
              message: `Cluster [${
                cluster.cluster_name
              }] X-Pack license is expired! Expired on: ${cluster.expiry.date}`,
            });
            break;
          case SEV_MEDIUM:
            result = action.performAction({
              severity,
              message: `Cluster [${
                cluster.cluster_name
              }] X-Pack license expires in less than 10 days! Expires on: ${
                cluster.expiry.date
              }`,
            });
            break;
          case SEV_INFO:
            result = action.performAction({
              severity,
              message: `Cluster [${
                cluster.cluster_name
              }] X-Pack license expires in less than 40 days. Expires on: ${
                cluster.expiry.date
              }`,
            });
        }

        // save the time a notification action was performed, if one was
        const { error, ok } = await result;
        if (error) {
          server.log(
            ['warn', 'alert', 'notification'],
            `Failure performing notification alert: ${error}`
          );
        } else if (ok) {
          state[clusterUuid].last_alerted = moment.utc().format();
        }
      }
    }

    return {
      state: {
        last_ran: runStart,
        last_state: state,
      },
      runAt: nextRun(),
    };
  };
}
