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
    return {
      ...accum,
      [source.cluster_uuid]: {
        cluster_name: source.cluster_name,
        timestamp: source.timestamp,
        license: source.license.type,
        expiry: {
          millis: source.license.expiry_date_in_millis,
          date: source.license.expiry_date,
        },
      },
    };
  }, {});
}

export function checkLicenseStatusTask({ kbnServer }) {
  const { server } = kbnServer;
  const { callWithInternalUser } = server.plugins.elasticsearch.getCluster(
    'monitoring'
  );

  return async () => {
    const runStart = Date.now();
    const state = await checkLicenseStatus(callWithInternalUser);

    return {
      state: {
        lastRan: runStart,
        lastState: state,
      },
      runAt: nextRun(),
    };
  };
}
