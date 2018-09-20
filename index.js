import exampleRoute from './server/routes/example';
import { checkClusterStatus, checkLicenseStatus } from './server/lib';

const PLUGIN_NAME = 'monitoring-alerter-demo';
const TASK_CHECK_CLUSTER = 'check_cluster_status';
const TASK_CHECK_LICENSE = 'check_license_expiration';

export default function monitoringAlerter(kibana) {
  return new kibana.Plugin({
    require: ['elasticsearch', 'monitoring', 'notifications'],
    name: PLUGIN_NAME,
    uiExports: {
      app: {
        title: 'Monitoring Alerter',
        description: 'Alerter for Monitoring Alerts in Monitoring',
        main: 'plugins/monitoring_alerter/app',
        styleSheetPath: require('path').resolve(__dirname, 'public/app.scss'),
      },
      taskDefinitions: {
        [TASK_CHECK_CLUSTER]: {
          type: PLUGIN_NAME,
          title: `check monitoring indices and see if there's a yellow or red cluster`,
          createTaskRunner(context) {
            return {
              run: checkClusterStatus(context),
            };
          },
        },
        [TASK_CHECK_LICENSE]: {
          type: PLUGIN_NAME,
          title: `check monitoring indices and see if there's an xpack license about to expire`,
          createTaskRunner(context) {
            return {
              run: checkLicenseStatus(context),
            };
          },
        },
      },
    },

    config(Joi) {
      return Joi.object({
        enabled: Joi.boolean().default(true),
      }).default();
    },

    // eslint-disable-next-line no-unused-vars
    init(server, options) {
      this.status.yellow('Waiting for task manager service');

      // Add server routes and initialize the plugin here
      exampleRoute(server);

      this.kbnServer.afterPluginsInit(async () => {
        this.status.yellow('Checking tasks status');

        try {
          const scheduledTasksCheck = await server.taskManager.fetch({
            query: {
              terms: {
                'task.taskType': [TASK_CHECK_CLUSTER, TASK_CHECK_LICENSE],
              },
            },
          });

          // FIXME: make sure it's not just 2 of the same task
          if (scheduledTasksCheck.docs.length === 2) {
            server.log(
              ['info', PLUGIN_NAME],
              `${PLUGIN_NAME} tasks already scheduled. Skipping.`
            );
          } else {
            let hasClusterStatusCheck = false;
            let hasLicenseStatusCheck = false;
            for (const task of scheduledTasksCheck.docs) {
              console.log({ task });
              switch (task.taskType) {
                case TASK_CHECK_CLUSTER:
                  hasClusterStatusCheck = true;
                  break;
                case TASK_CHECK_LICENSE:
                  hasLicenseStatusCheck = true;
              }
            }

            if (!hasClusterStatusCheck) {
              const { id } = await server.taskManager.schedule({
                taskType: TASK_CHECK_CLUSTER,
              });
              server.log(
                ['info', PLUGIN_NAME],
                `${TASK_CHECK_CLUSTER} task: [${id}] scheduled`
              );
            }
            if (!hasLicenseStatusCheck) {
              const { id } = await server.taskManager.schedule({
                taskType: TASK_CHECK_LICENSE,
              });
              server.log(
                ['info', PLUGIN_NAME],
                `${TASK_CHECK_LICENSE} task: [${id}] scheduled`
              );
            }
          }

          this.status.green('Ready');
        } catch (err) {
          server.log(
            ['error', PLUGIN_NAME],
            `Tasks could not be configured: ${err.message}`
          );
          this.status.green('Unknown state. Check the Kibana logs.');
        }
      });
    },
  });
}
