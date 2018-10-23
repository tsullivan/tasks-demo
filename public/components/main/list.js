import React from 'react';
import { EuiBasicTable } from '@elastic/eui';

export function TaskList(props) {
  if (!props.tasks) {
    return null;
  }

  const columns = [
    { field: 'id', name: 'ID', sortable: false },
    { field: 'interval', name: 'Interval', sortable: true },
    { field: 'attempts', name: 'Attempts', sortable: true },
    { field: 'runAt', name: 'Run At', sortable: true },
    { field: 'state', name: 'State', sortable: false },
    { field: 'status', name: 'Status', sortable: true },
  ];

  const items = props.tasks.map(t => ({
    id: t.id.slice(0, 12) + '...',
    attempts: t.attempts,
    interval: t.interval || 'n/a',
    runAt: t.runAt,
    state: t.state,
    status: t.status,
    scope: t.scope,
    taskType: t.taskType,
  }));

  return <EuiBasicTable items={items} columns={columns} />;
}
