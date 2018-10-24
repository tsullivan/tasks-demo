import { checkClusterStatus, checkLicenseStatus } from '../lib';
import { FORM_SCHEDULER, PLUGIN_NAME } from '../../constants';

export function routes(server) {
  const { taskManager } = server;

  server.route({
    path: '/api/tasks-demo/get_demo_tasks',
    method: 'GET',
    async handler(req, reply) {
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
            },
            state: t.state,
            status: t.status,
          })),
        };

        reply(data);
      } catch (err) {
        reply(err);
      }
    },
  });

  server.route({
    path: '/api/tasks-demo/get_builtin_tasks',
    method: 'GET',
    async handler(req, reply) {
      try {
        const tasks = await taskManager.fetch({
          query: {
            bool: { filter: { term: { 'task.scope': PLUGIN_NAME + '-builtin' } } },
          },
        });

        const data = {
          tasks: tasks.docs.map(t => ({
            id: t.id,
            interval: t.interval,
            attempts: t.attempts,
            runAt: t.runAt,
            status: t.status,
          })),
        };

        reply(data);
      } catch (err) {
        reply(err);
      }
    },
  });

  server.route({
    path: '/api/tasks-demo/schedule_demo_task',
    method: 'POST',
    async handler(req, reply) {
      try {
        const { index, query, threshold } = req.payload;

        const taskInstance = await taskManager.schedule({
          taskType: FORM_SCHEDULER,
          scope: PLUGIN_NAME + '-ui',
          interval: req.payload.interval,
          params: {
            index,
            query,
            threshold,
            headers: req.headers, // callWithRequest only cares about request headers
          },
        });

        const data = {
          result: 'ok',
          taskInstance,
        };

        reply(data);
      } catch (err) {
        reply(err);
      }
    },
  });

  server.route({
    path: '/api/tasks-demo/delete_demo_task',
    method: 'POST',
    async handler(req, reply) {
      try {
        const result = await taskManager.remove(req.payload.id);
        const data = { result };

        reply(data);
      } catch (err) {
        reply(err);
      }
    },
  });

  server.route({
    path: '/api/tasks-demo/cluster_status',
    method: 'GET',
    async handler(req, reply) {
      try {
        const { server } = req;
        const { callWithInternalUser } = server.plugins.elasticsearch.getCluster(
          'monitoring'
        );
        reply(checkClusterStatus(callWithInternalUser));
      } catch (err) {
        reply(err);
      }
    },
  });

  server.route({
    path: '/api/tasks-demo/license',
    method: 'GET',
    async handler(req, reply) {
      try {
        const { server } = req;
        const { callWithInternalUser } = server.plugins.elasticsearch.getCluster(
          'monitoring'
        );
        reply(checkLicenseStatus(callWithInternalUser));
      } catch (err) {
        reply(err);
      }
    },
  });
}
