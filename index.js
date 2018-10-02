import { routes } from './server/routes';
import { checkClusterStatusTask, checkLicenseStatusTask } from './server/lib';

const PLUGIN_NAME = 'monitoring-alerter-demo';
const TASK_CHECK_CLUSTER = 'check_cluster_status';
const TASK_CHECK_LICENSE = 'check_license_expiration';
const TASK_CHECK_CLUSTER_ID = 'monitoring_alerter_check_cluster_status';
const TASK_CHECK_LICENSE_ID = 'monitoring_alerter_check_xpack_license';

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
      const { client: taskManagerClient } = server.plugins.taskManager;
      taskManagerClient.registerTaskDefinitions({
        [TASK_CHECK_CLUSTER]: {
          type: PLUGIN_NAME,
          title: `check monitoring indices and see if there's a yellow or red cluster`,
          createTaskRunner(context) {
            return {
              run: checkClusterStatusTask(context),
            };
          },
        },
        [TASK_CHECK_LICENSE]: {
          type: PLUGIN_NAME,
          title: `check monitoring indices and see if there's an xpack license about to expire`,
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
          ({ id: taskCheckClusterId } = await taskManagerClient.schedule({
            id: TASK_CHECK_CLUSTER_ID,
            taskType: TASK_CHECK_CLUSTER,
          }));
          server.log(
            ['info', PLUGIN_NAME],
            `${TASK_CHECK_CLUSTER} task: [${taskCheckClusterId}] scheduled`
          );

          ({ id: taskCheckLicenseId } = await taskManagerClient.schedule({
            id: TASK_CHECK_LICENSE_ID,
            taskType: TASK_CHECK_LICENSE,
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
            await taskManagerClient.remove(taskCheckClusterId);
            await taskManagerClient.remove(taskCheckLicenseId);
          }
          this.status.red(err.message);
        }
      });

      routes(server);
    },
  });
}
