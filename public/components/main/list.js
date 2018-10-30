import React from 'react';
import moment from 'moment';
import { EuiBasicTable, EuiLink, EuiToolTip, EuiIcon } from '@elastic/eui';

export function TaskList(props) {
  if (!props.tasks) {
    return null;
  }

  const trash = id => props.trash(id);
  const columns = [
    {
      field: 'id',
      truncateText: true,
      render: id =>
        props.trash ? (
          <EuiToolTip position="bottom" content="Delete">
            <EuiLink onClick={() => trash(id)}>
              <EuiIcon type="trash" />
            </EuiLink>
          </EuiToolTip>
        ) : null,
    },
    { field: 'id', name: 'ID' },
    { field: 'interval', name: 'Interval' },
    { field: 'attempts', name: 'Failed Attempts' },
    { field: 'runAt', name: 'Run At' },
    {
      field: 'params',
      name: 'Params',
      render: params => (params ? JSON.stringify(params) : '-'),
    },
    {
      field: 'state',
      name: 'State',
      render: state => (state ? JSON.stringify(state) : '-'),
    },
    { field: 'status', name: 'Status' },
  ];

  const items = props.tasks.map(t => ({
    id: t.id,
    attempts: t.attempts,
    interval: t.interval || 'n/a',
    runAt: moment(t.runAt).format('MM/DD h:mm:ss a'),
    params: t.params,
    state: t.state,
    status: t.status,
    scope: t.scope,
    taskType: t.taskType,
  }));

  return <EuiBasicTable items={items} columns={columns} />;
}
