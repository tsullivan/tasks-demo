import { checkClusterStatus, checkLicenseStatus } from '../lib';

export default function routeExample(server) {
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
