import exampleRoute from './server/routes/example';
import { checkClusterStatus } from './server/lib';

const PLUGIN_NAME = 'monitoring-alerter-demo';

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
        check_cluster_status: {
          type: PLUGIN_NAME,
          title: `check monitoring indices and see if there's a yellow or red cluster`,
          createTaskRunner(context) {
            return {
              run: checkClusterStatus(context),
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
                'task.taskType': ['check_cluster_status'],
              },
            },
          });

          if (scheduledTasksCheck.docs.length === 0) {
            const clusterStatusCheck = await server.taskManager.schedule({
              taskType: 'check_cluster_status',
            });
            server.log(
              ['info', PLUGIN_NAME],
              `check_cluster_status task: [${clusterStatusCheck.id}] scheduled`
            );
          } else {
            server.log(
              ['info', PLUGIN_NAME],
              `check_cluster_status task already scheduled. skipping.`
            );
          }

          this.status.green('Ready');
        } catch (err) {
          server.log(
            ['error', PLUGIN_NAME],
            `check_cluster_status task could not be configured: ${err.message}`
          );
          this.status.green('Unknown state. Check the Kibana logs.');
        }
      });
    },
  });
}
