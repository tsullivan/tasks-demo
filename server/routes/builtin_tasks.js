import Boom from 'boom';
import { PLUGIN_NAME } from '../../constants';
import { checkClusterStatus, checkLicenseStatus } from '../lib';

export function clusterStatusRoute(server) {
  server.route({
    path: '/api/tasks-demo/cluster_status',
    method: 'GET',
    async handler(req) {
      try {
        const { server } = req;
        const { callWithInternalUser } = server.plugins.elasticsearch.getCluster(
          'monitoring'
        );
        return checkClusterStatus(callWithInternalUser);
      } catch (err) {
        return Boom.wrap(err);
      }
    },
  });
}

export function checkLicenseStatusRoute(server) {
  server.route({
    path: '/api/tasks-demo/license',
    method: 'GET',
    async handler(req) {
      try {
        const { server } = req;
        const { callWithInternalUser } = server.plugins.elasticsearch.getCluster(
          'monitoring'
        );
        return checkLicenseStatus(callWithInternalUser);
      } catch (err) {
        return Boom.wrap(err);
      }
    },
  });
}

export function getBuiltinTasksRoute(server, taskManager) {
  server.route({
    path: '/api/tasks-demo/get_builtin_tasks',
    method: 'GET',
    async handler() {
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

        return data;
      } catch (err) {
        return Boom.wrap(err);
      }
    },
  });
}
