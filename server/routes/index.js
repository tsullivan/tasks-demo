import {
  getBuiltinTasksRoute,
  clusterStatusRoute,
  checkLicenseStatusRoute,
} from './builtin_tasks';
import {
  getDemoTasksRoute,
  scheduleDemoTaskRoute,
  deleteDemoTasksRoute,
} from './demo_tasks';

export function routes(server) {
  const { taskManager } = server;

  const routes = [
    getBuiltinTasksRoute,
    clusterStatusRoute,
    checkLicenseStatusRoute,
    getDemoTasksRoute,
    scheduleDemoTaskRoute,
    deleteDemoTasksRoute,
  ];

  routes.forEach(route => {
    route(server, taskManager);
  });
}
