import moment from 'moment';
import { get } from 'lodash';
import { nextRun } from '../next_run';
import { alertClusterStatus } from './alert_cluster_status';

export async function checkClusterStatus(callWithInternalUser) {
  const params = {
    index: '.monitoring-es-*',
    size: 100,
    filterPath: [
      'hits.hits._source.cluster_uuid',
      'hits.hits._source.cluster_name',
      'hits.hits._source.timestamp',
      'hits.hits._source.cluster_state.status',
    ],
    body: {
      query: { term: { type: { value: 'cluster_stats' } } },
      collapse: { field: 'cluster_uuid' },
      sort: { timestamp: { order: 'desc' } },
    },
  };

  const response = await callWithInternalUser('search', params);
  return get(response, 'hits.hits', []).reduce((accum, { _source: source }) => {
    const clusterStatus = source.cluster_state.status;
    return {
      ...accum,
      [source.cluster_uuid]: {
        cluster_name: source.cluster_name,
        timestamp: source.timestamp,
        status: clusterStatus,
        isRed: clusterStatus === 'red',
        isYellow: clusterStatus === 'yellow',
      },
    };
  }, {});
}

export function checkClusterStatusTask({ kbnServer, taskInstance }) {
  const { server } = kbnServer;
  const { callWithInternalUser } = server.plugins.elasticsearch.getCluster(
    'monitoring'
  );

  return async () => {
    const runStart = moment.utc();
    const state = await checkClusterStatus(callWithInternalUser);

    // perform an alert
    if (server.plugins.notifications) {
      alertClusterStatus(server, taskInstance, state);
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
