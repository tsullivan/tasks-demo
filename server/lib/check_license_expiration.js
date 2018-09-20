import { nextRun } from './next_run';

/* WIP */
export function checkLicenseExpiration({ taskInstance }) {
  console.log(taskInstance);
  return {
    state: {
      lastRan: null
    },
    runAt: nextRun(),
  };
}
