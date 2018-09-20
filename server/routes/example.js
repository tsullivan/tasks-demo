export default function routeExample(server) {
  server.route({
    path: '/api/monitoring-alerter/example',
    method: 'GET',
    handler(req, reply) {
      reply({ time: new Date().toISOString() });
    },
  });
}
