import moment from 'moment';

const SEV_CRITICAL = 'critical';
const SEV_MEDIUM = 'medium';

const getSeverity = status => {
  if (status === 'red') {
    return SEV_CRITICAL;
  }
  if (status === 'yellow') {
    return SEV_MEDIUM;
  }
  return null;
};

// eslint-disable-next-line no-unused-vars
export async function alertClusterStatus(server, taskInstance, state) {
  const { notificationService } = server.plugins.notifications;
  const action = notificationService.getActionForId('xpack-notifications-logger');

  for (const clusterUuid of Object.keys(state)) {
    const cluster = state[clusterUuid];
    const severity = getSeverity(cluster.cluster_state.status);

    let result = Promise.resolve({});

    if (severity != null) {
      const { cluster_name: clusterName } = cluster;
      const clusterPre = `Cluster [${clusterName} / ${clusterUuid}] X-Pack license`;
      const expirationPost = `Expiration date: ${cluster.expiry.date}`;

      switch (severity) {
        case SEV_CRITICAL:
          result = action.performAction({
            severity,
            message: `${clusterPre} is expired! ${expirationPost}`,
          });
          break;
        case SEV_MEDIUM:
          result = action.performAction({
            severity,
            message: `${clusterPre} expires in less than 10 days!! ${expirationPost}`,
          });
          break;
      }
    }

    state[clusterUuid].last_severity = severity;

    // save the time a notification action was performed, if one was
    const { error, ok: alertSuccess } = await result;
    if (error) {
      server.log(
        ['warn', 'alert', 'notification'],
        `Failure performing notification alert: ${error}`
      );
    } else if (alertSuccess) {
      state[clusterUuid].last_alerted = moment.utc().format();
    }
  }
}
