import moment from 'moment';
import { get } from 'lodash';
import { nextRun } from './next_run';
import { alertLicenseExpiration } from './alert_license_expiration';

export async function checkLicenseStatus(callWithInternalUser) {
  const params = {
    index: '.monitoring-es-*',
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
    const daysTo = Math.ceil(
      moment
        .duration(moment.utc(license.expiry_date_in_millis) - moment.utc())
        .as('days')
    );
    return {
      ...accum,
      [source.cluster_uuid]: {
        cluster_name: source.cluster_name,
        timestamp: source.timestamp,
        license: license.type,
        expiry: {
          millis: license.expiry_date_in_millis,
          date: license.expiry_date,
          days_to: daysTo,
        },
        is_expired: daysTo < 1,
        is_expiring_soon: daysTo > 0 && daysTo < 11,
      },
    };
  }, {});
}

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
      alertLicenseExpiration(server, taskInstance, state);
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
