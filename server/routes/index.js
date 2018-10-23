import { checkClusterStatus, checkLicenseStatus } from '../lib';
import { FORM_SCHEDULER, PLUGIN_NAME } from '../../constants';

export function routes(server) {
  const { taskManager } = server;

  server.route({
    path: '/api/monitoring-alerter/get_demo_tasks',
    method: 'GET',
    async handler(req, reply) {
      try {
        const tasks = await taskManager.fetch({
          query: {
            bool: { filter: { term: { 'task.scope': PLUGIN_NAME + '-ui' } } },
          },
        });

        const data = {
          tasks: tasks.docs,
        };

        reply(data);
      } catch (err) {
        reply(err);
      }
    },
  });

  server.route({
    path: '/api/monitoring-alerter/get_builtin_tasks',
    method: 'GET',
    async handler(req, reply) {
      try {
        const tasks = await taskManager.fetch({
          query: {
            bool: { filter: { term: { 'task.scope': PLUGIN_NAME + '-builtin' } } },
          },
        });

        const data = {
          tasks: tasks.docs,
        };

        reply(data);
      } catch (err) {
        reply(err);
      }
    },
  });

  server.route({
    path: '/api/monitoring-alerter/schedule_demo_task',
    method: 'POST',
    async handler(req, reply) {
      console.log(JSON.stringify(req.payload));
      try {
        const taskInstance = await taskManager.schedule({
          taskType: FORM_SCHEDULER,
          scope: PLUGIN_NAME + '-ui',
          interval: req.payload.interval,
          params: {
            ...req.payload,
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
    path: '/api/monitoring-alerter/cluster_status',
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
    path: '/api/monitoring-alerter/license',
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
