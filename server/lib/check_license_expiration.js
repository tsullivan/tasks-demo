import { get } from 'lodash';
import { nextRun } from './next_run';

export function checkLicenseExpiration({ kbnServer }) {
  const {
    callWithInternalUser: callCluster,
  } = kbnServer.server.plugins.elasticsearch.getCluster('monitoring');

  return async () => {
    const runStart = Date.now();

    const params = {
      filterPath: ['hits.hits._source.license'],
      size: 1,
      body: {
        query: {
          bool: {
            filter: {
              bool: {
                must: [{ term: { type: { value: 'cluster_stats' } } }],
              },
            },
          },
        },
        sort: [{ timestamp: { order: 'desc' } }],
      },
    };

    const response = await callCluster('search', params);
    const result = get(response, 'hits.hits.0._source.license.expiry_date_in_millis');
    console.log({ result });

    return {
      state: {
        lastState: { expiry_date_in_millis: result },
        lastRan: runStart,
      },
      runAt: nextRun(),
    };
  };
}
