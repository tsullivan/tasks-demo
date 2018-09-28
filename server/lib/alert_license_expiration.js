import moment from 'moment';

const SEV_CRITICAL = 'critical';
const SEV_MEDIUM = 'medium';
const SEV_INFO = 'info';

const getSeverity = daysTo => {
  if (daysTo < 0) {
    return SEV_CRITICAL;
  }
  if (daysTo < 10) {
    return SEV_MEDIUM;
  }
  if (daysTo < 40) {
    return SEV_INFO;
  }
};

// eslint-disable-next-line no-unused-vars
export async function alertLicenseExpiration(server, taskInstance, state) {
  /// const { last_state: lastState } = taskInstance.state; // use lastState to throttle alerting down to 1x / hour or something
  const { notificationService } = server.plugins.notifications;
  const action = notificationService.getActionForId('xpack-notifications-logger');

  for (const clusterUuid of Object.keys(state)) {
    const cluster = state[clusterUuid];
    const severity = getSeverity(cluster.expiry.daysTo);

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
        case SEV_INFO:
          result = action.performAction({
            severity,
            message: `${clusterPre} expires in less than 40 days! ${expirationPost}`,
          });
      }
    }

    state[clusterUuid].last_severity = severity;

    // save the time a notification action was performed, if one was
    const { error, ok } = await result;
    if (error) {
      server.log(
        ['warn', 'alert', 'notification'],
        `Failure performing notification alert: ${error}`
      );
    } else if (ok) {
      state[clusterUuid].last_alerted = moment.utc().format();
    }
  }
}
