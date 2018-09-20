import { get } from 'lodash';
import { nextRun } from './next_run';

export function checkClusterStatus({ kbnServer/*, taskInstance*/ }) {
  const { callWithInternalUser: callCluster } = kbnServer.server.plugins.elasticsearch.getCluster('monitoring');

  return async () => {
    const runStart = Date.now();

    const params = {
      filterPath: [ 'hits.hits._source.cluster_stats.status' ],
      size: 1,
      body: {
        'query': {
          'bool': {
            'filter': {
              'bool': {
                'must': [
                  {
                    'term': {
                      'type': {
                        'value': 'cluster_stats'
                      }
                    }
                  }
                ],
                'should': [
                  {
                    'term': {
                      'cluster_state.status': {
                        'value': 'yellow'
                      }
                    }
                  },
                  {
                    'term': {
                      'cluster_state.status': {
                        'value': 'red'
                      }
                    }
                  }
                ],
                'minimum_should_match': 1
              }
            }
          }
        },
        'sort': [
          {
            'timestamp': {
              'order': 'desc'
            }
          }
        ]
      }
    };

    const response = await callCluster('search', params);
    const result = get(response, 'hits.hits.0._source.cluster_stats.status');
    if (result === 'yellow' || result === 'red') {
      console.log({ result });
    } else {
      console.log('The monitored clusters are nice and green!');
    }

    return {
      state: {
        lastState: { cluster_status: result },
        lastRan: runStart,
      },
      runAt: nextRun(),
    };
  };
}
