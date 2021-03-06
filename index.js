import { routes } from './server/routes';
import { runFreeformTask } from './server/lib';

import {
  PLUGIN_NAME,
  FORM_SCHEDULER,
  ALERTS_INDEX_NAME,
  ALERTS_INDEX_TYPE,
} from './constants';

const ALERTS_INDEX_SETTINGS = {
  body: {
    mappings: {
      [ALERTS_INDEX_TYPE]: {
        properties: {
          timestamp: { type: 'date' },
          query: { type: 'keyword' },
          threshold: { type: 'float' },
          hits: {
            properties: {
              total: {
                type: 'integer',
              },
            },
          },
        },
      },
    },
    settings: { number_of_shards: 5 },
  },
  index: `${ALERTS_INDEX_NAME}`,
};

function putSettings(server, plugin) {
  return async () => {
    try {
      const { callWithInternalUser } = server.plugins.elasticsearch.getCluster('data');
      await callWithInternalUser('indices.create', ALERTS_INDEX_SETTINGS);
    } catch (err) {
      if (err.status === 400) {
        server.log(
          ['info', PLUGIN_NAME],
          `Did not auto-create an alerts index: ${err.message}`
        );
      } else {
        plugin.status.red('Could not create the alerts index!!!');
        throw new Error(
          `Could not create the alerts index!!!\n${
            err.message
          }\nElasticsearch error: ${err.toString()}`
        );
      }
    }
  };
}

const registerTaskDefinitions = taskManager => {
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
  });
};

export default function tasksDemo(kibana) {
  return new kibana.Plugin({
    require: ['elasticsearch', 'task_manager', 'monitoring', 'notifications'],
    name: PLUGIN_NAME,
    uiExports: {
      app: {
        title: 'Tasks Demo',
        description: 'Demo Task Manager',
        main: 'plugins/tasks-demo/app',
        styleSheetPath: require('path').resolve(__dirname, 'public/app.scss'),
      },
    },

    config(Joi) {
      return Joi.object({
        enabled: Joi.boolean().default(true),
      }).default();
    },

    async init(server) {
      server.plugins.elasticsearch.status.on('green', putSettings(server, this));
      routes(server);
      const { taskManager } = server;
      registerTaskDefinitions(taskManager);
    },
  });
}
