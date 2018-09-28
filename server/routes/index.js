import { checkClusterStatus, checkLicenseStatus } from '../lib';

export function routes(server) {
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

  server.route({
    path: '/api/monitoring-alerter/clear',
    method: 'POST',
    async handler(req, reply) {
      try {
        const result = [];
        const { docs: tasks } = await server.taskManager.fetch({
          terms: {
            'task.taskType': ['check_cluster_status', 'check_license_expiration'],
          },
        });
        for (const task of tasks) {
          result[result.length] = await server.taskManager.remove(task.id);
        }
        reply(result);
      } catch (err) {
        reply(err);
      }
    },
  });
}
