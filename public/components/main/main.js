import React from 'react';
import {
  EuiPage,
  EuiPageHeader,
  EuiTitle,
  EuiPageBody,
  EuiPageContent,
  EuiPageContentHeader,
  EuiPageContentBody,
  EuiFlexGroup,
  EuiFlexItem,
  EuiText,
} from '@elastic/eui';
import { ScheduleForm } from './form';
import { TaskList } from './list';

export class Main extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      demoTasks: null,
      builtInTasks: null,
      postResult: null,
    };

    this.sendScheduleData = this.sendScheduleData.bind(this);
  }

  componentDidMount() {
    const { httpClient } = this.props;
    setInterval(() => {
      httpClient.get('../api/monitoring-alerter/get_demo_tasks').then(({ data }) => {
        this.setState({ demoTasks: data.tasks });
      });
    }, 1400);
    setInterval(() => {
      httpClient.get('../api/monitoring-alerter/get_builtin_tasks').then(({ data }) => {
        this.setState({ builtInTasks: data.tasks });
      });
    }, 1400);
  }

  sendScheduleData(payload) {
    // send
    const { httpClient } = this.props;
    httpClient
      .post('../api/monitoring-alerter/schedule_demo_task', payload)
      .then(({ data }) => {
        this.setState({ postResult: data.result });
      });
  }

  render() {
    const { title } = this.props;
    const postResult = this.state.postResult ? (
      <pre>{this.state.postResult}</pre>
    ) : null;
    const scheduleForm = <ScheduleForm sendScheduleData={this.sendScheduleData} />;

    return (
      <EuiPage>
        <EuiPageBody>
          <EuiPageHeader>
            <EuiTitle size="l">
              <h1>{title}</h1>
            </EuiTitle>
          </EuiPageHeader>
          <EuiPageContent>
            <EuiPageContentHeader>
              <EuiTitle>
                <h2>Task Scheduling Demo</h2>
              </EuiTitle>
            </EuiPageContentHeader>
            <EuiPageContentBody>
              <EuiFlexGroup component="div">
                <EuiFlexItem component="div">
                  <EuiText>
                    <h3>Schedule a task</h3>
                    {postResult || scheduleForm}
                  </EuiText>
                </EuiFlexItem>

                <EuiFlexItem component="div">
                  <EuiText>
                    <h3>Your tasks</h3>
                    {<TaskList tasks={this.state.demoTasks} />}
                    <h3>Built-in tasks</h3>
                    {<TaskList tasks={this.state.builtInTasks} />}
                  </EuiText>
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiPageContentBody>
          </EuiPageContent>
        </EuiPageBody>
      </EuiPage>
    );
  }
}
