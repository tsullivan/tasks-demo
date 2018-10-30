import moment from 'moment';
import Boom from 'boom';
import { FORM_SCHEDULER, PLUGIN_NAME } from '../../constants';

export function scheduleDemoTaskRoute(server, taskManager) {
  server.route({
    path: '/api/tasks-demo/schedule_demo_task',
    method: 'POST',
    async handler(req) {
      try {
        const { index, query, threshold } = req.payload;

        let runAt;
        if (req.payload.firstRun === '5m' || req.payload.firstRun === '10m') {
          const minutes = req.payload.firstRun === '5m' ? 5 : 10;
          runAt = moment(moment().add(minutes, 'minutes')).format();
        }
        const failMe = req.payload.failMe === true;

        const taskInstance = await taskManager.schedule({
          taskType: FORM_SCHEDULER,
          scope: PLUGIN_NAME + '-ui',
          interval: req.payload.interval,
          runAt: runAt,
          params: {
            index,
            query,
            threshold,
            headers: req.headers, // callWithRequest only cares about request headers
            failMe,
          },
        });

        const data = {
          result: 'ok',
          taskInstance,
        };

        return data;
      } catch (err) {
        return Boom.wrap(err);
      }
    },
  });
}

export function getDemoTasksRoute(server, taskManager) {
  server.route({
    path: '/api/tasks-demo/get_demo_tasks',
    method: 'GET',
    async handler() {
      try {
        const tasks = await taskManager.fetch({
          query: {
            bool: { filter: { term: { 'task.scope': PLUGIN_NAME + '-ui' } } },
          },
        });

        const data = {
          tasks: tasks.docs.map(t => ({
            id: t.id,
            interval: t.interval,
            attempts: t.attempts,
            runAt: t.runAt,
            params: {
              index: t.params.index,
              query: t.params.query,
              threshold: t.params.threshold,
              failMe: t.params.failMe,
            },
            state: t.state,
            status: t.status,
          })),
        };

        return data;
      } catch (err) {
        return err;
      }
    },
  });
}

export function deleteDemoTasksRoute(server, taskManager) {
  server.route({
    path: '/api/tasks-demo/delete_demo_task',
    method: 'POST',
    async handler(req) {
      try {
        const result = await taskManager.remove(req.payload.id);
        const data = { result };

        return data;
      } catch (err) {
        return Boom.wrap(err);
      }
    },
  });
}
