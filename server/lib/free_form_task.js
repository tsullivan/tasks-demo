import { sendAlert } from './send_alert';

export function runFreeformTask({ kbnServer, taskInstance }) {
  const { server } = kbnServer;
  const { callWithRequest } = server.plugins.elasticsearch.getCluster('data');

  return async () => {
    const { params, state } = taskInstance;
    const { index, query, headers, threshold } = params;
    const runs = state.runs || 0;

    try {
      const results = await callWithRequest({ headers }, 'search', {
        index,
        body: { query: { query_string: { query } } },
      });

      const hits = results.hits.total;

      if (hits >= threshold) {
        await sendAlert(server, hits, params, state);
      }

      return { state: { ran: true, runs: runs + 1, hits } };
    } catch (err) {
      return { state: { ran: false, error: err.message } };
    }
  };
}
