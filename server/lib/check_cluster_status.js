import { get } from 'lodash';
import { nextRun } from './next_run';

export async function checkClusterStatus(callWithInternalUser) {
  const params = {
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

export function checkClusterStatusTask({ kbnServer /*, taskInstance*/ }) {
  const { server } = kbnServer;
  const { callWithInternalUser } = server.plugins.elasticsearch.getCluster(
    'monitoring'
  );

  return async () => {
    const runStart = Date.now();
    const state = await checkClusterStatus(callWithInternalUser);
    return {
      state: {
        lastRan: runStart,
        lastState: state,
      },
      runAt: nextRun(),
    };
  };
}
