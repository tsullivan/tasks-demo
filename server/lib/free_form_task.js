import { FAIL_EVERY } from './../../constants';
import { sendAlert } from './send_alert';

export function runFreeformTask({ kbnServer, taskInstance }) {
  const { server } = kbnServer;
  const { callWithRequest } = server.plugins.elasticsearch.getCluster('data');

  const { notificationService } = server.plugins.notifications;
  const loggerAction = notificationService.getActionForId('xpack-notifications-logger');

  return async () => {
    const { params, state } = taskInstance;
    const { index, query, headers, threshold, failMe } = params;
    const runs = state.runs || 0;

    const nextRuns = runs + 1;
    if (failMe && nextRuns % 3 === 0) {
      throw new Error(`Failing "${taskInstance.id}": it is configured to fail!`);
    }

    try {
      // FIXME this uses credentials stored in plaintext lol
      const results = await callWithRequest({ headers }, 'search', {
        index,
        body: { query: { query_string: { query } } },
      });
      const hits = results.hits;

      if (hits.total >= threshold) {
        await loggerAction.performAction({
          message: `${taskInstance.id} hit its threshold! Hits: ${
            hits.total
          } Threshold: ${threshold}`,
        });
        await sendAlert(server, hits, params, state);
      }

      return { state: { ran: true, runs: nextRuns, hits_total: hits.total } };
    } catch (err) {
      return { state: { ran: false, error: err.message } };
    }
  };
}
