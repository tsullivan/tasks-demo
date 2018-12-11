import { ALERTS_INDEX_NAME, ALERTS_INDEX_TYPE, PLUGIN_NAME } from '../../../constants';
import { get } from 'lodash';

export async function sendAlert(server, hits, params /*, state*/) {
  const { callWithInternalUser } = server.plugins.elasticsearch.getCluster('data');
  try {
    const hitsTotal = get(hits, 'total.value');
    const alertDoc = await callWithInternalUser('index', {
      index: ALERTS_INDEX_NAME,
      type: ALERTS_INDEX_TYPE,
      body: {
        timestamp: new Date(),
        query: params.query,
        threshold: params.threshold,
        hits: {
          total: hitsTotal,
        },
      },
    });
    return alertDoc;
  } catch (err) {
    server.log(['error', PLUGIN_NAME], err ? err.stack : err);
    throw new Error('Storing alert document failed!!!');
  }

  return true;
}
