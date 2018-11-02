import { ALERTS_INDEX_NAME, ALERTS_INDEX_TYPE } from '../../constants';

export async function sendAlert(server, hits, params /*, state*/) {
  const { callWithInternalUser } = server.plugins.elasticsearch.getCluster('data');
  try {
    const alertDoc = await callWithInternalUser('index', {
      index: ALERTS_INDEX_NAME,
      type: ALERTS_INDEX_TYPE,
      body: {
        timestamp: new Date(),
        query: params.query,
        threshold: params.threshold,
        hits: {
          total: hits.total
        },
      },
    });
  } catch (err) {
    throw new Error('Storing alert document failed!!!');
  }

  return true;
}
