import { routes } from './server/routes';
import {
  checkClusterStatusTask,
  checkLicenseStatusTask,
  runFreeformTask,
} from './server/lib';

import {
  PLUGIN_NAME,
  FORM_SCHEDULER,
  TASK_CHECK_CLUSTER,
  TASK_CHECK_LICENSE,
  TASK_CHECK_CLUSTER_ID,
  TASK_CHECK_LICENSE_ID,
} from './constants';

export default function monitoringAlerter(kibana) {
  return new kibana.Plugin({
    require: ['elasticsearch', 'task_manager', 'monitoring', 'notifications'],
    name: PLUGIN_NAME,
    uiExports: {
      app: {
        title: 'Monitoring Alerter',
        description: 'Alerter for Monitoring Alerts in Monitoring',
        main: 'plugins/monitoring_alerter/app',
        styleSheetPath: require('path').resolve(__dirname, 'public/app.scss'),
      },
    },

    config(Joi) {
      return Joi.object({
        enabled: Joi.boolean().default(true),
      }).default();
    },

    init(server) {
      const { taskManager } = server;
      taskManager.registerTaskDefinitions({
        [FORM_SCHEDULER]: {
          type: PLUGIN_NAME,
          title: `Tasks scheduled through the demo UI`,
          createTaskRunner(context) {
            return {
              run: runFreeformTask(context),
            };
          },
        },
        [TASK_CHECK_CLUSTER]: {
          type: PLUGIN_NAME,
          title: `Check monitoring indices and see if there's a yellow or red cluster`,
          createTaskRunner(context) {
            return {
              run: checkClusterStatusTask(context),
            };
          },
        },
        [TASK_CHECK_LICENSE]: {
          type: PLUGIN_NAME,
          title: `Check monitoring indices and see if there's an xpack license about to expire`,
          createTaskRunner(context) {
            return {
              run: checkLicenseStatusTask(context),
            };
          },
        },
      });

      this.status.yellow('Waiting for task manager service');

      this.kbnServer.afterPluginsInit(async () => {
        this.status.yellow('Adding tasks');

        let taskCheckClusterId;
        let taskCheckLicenseId;
        try {
          ({ id: taskCheckClusterId } = await taskManager.schedule({
            id: TASK_CHECK_CLUSTER_ID,
            taskType: TASK_CHECK_CLUSTER,
            scope: PLUGIN_NAME + '-builtin',
          }));
          server.log(
            ['info', PLUGIN_NAME],
            `${TASK_CHECK_CLUSTER} task: [${taskCheckClusterId}] scheduled`
          );

          ({ id: taskCheckLicenseId } = await taskManager.schedule({
            id: TASK_CHECK_LICENSE_ID,
            taskType: TASK_CHECK_LICENSE,
            scope: PLUGIN_NAME + '-builtin',
          }));
          server.log(
            ['info', PLUGIN_NAME],
            `${TASK_CHECK_LICENSE} task: [${taskCheckLicenseId}] scheduled`
          );

          this.status.green('Ready');
        } catch (err) {
          server.log(
            ['error', PLUGIN_NAME],
            `Tasks could not be configured: ${err.message}`
          );
          if (taskCheckClusterId && taskCheckLicenseId) {
            await taskManager.remove(taskCheckClusterId);
            await taskManager.remove(taskCheckLicenseId);
          }
          this.status.red(err.message);
        }
      });

      routes(server);
    },
  });
}
