import React from 'react';
import {
  EuiForm,
  EuiFormRow,
  EuiFieldText,
  EuiSelect,
  EuiButton,
  EuiSwitch,
} from '@elastic/eui';

export class ScheduleForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      index: null,
      query: null,
      threshold: null,
      interval: null,
      firstRun: null,
      failMe: false,
      isValid: true,
      validationMessage: null,
    };

    this.onChangeIndex = this.onChangeIndex.bind(this);
    this.onChangeQuery = this.onChangeQuery.bind(this);
    this.onChangeThreshold = this.onChangeThreshold.bind(this);
    this.onChangeInterval = this.onChangeInterval.bind(this);
    this.onChangeFirstRun = this.onChangeFirstRun.bind(this);
    this.onChangeFailMe = this.onChangeFailMe.bind(this);
    this.validateAndSend = this.validateAndSend.bind(this);
  }

  onChangeIndex(event) {
    const index = event.target.value;
    this.setState({ isValid: true, index });
  }

  onChangeQuery(event) {
    const query = event.target.value;
    this.setState({ isValid: true, query });
  }

  onChangeThreshold(event) {
    const threshold = event.target.value;
    this.setState({ isValid: true, threshold });
  }

  onChangeInterval(event) {
    const interval = event.target.value;
    this.setState({ isValid: true, interval });
  }

  onChangeFirstRun(event) {
    const firstRun = event.target.value;
    this.setState({ isValid: true, firstRun });
  }

  onChangeFailMe() {
    const failMe = !this.state.failMe;
    this.setState({ isValid: true, failMe });
  }

  validateAndSend(event) {
    const state = this.state;

    let ok = true;
    if (state.index == null) {
      this.setState({ isValid: false, validationMessage: 'Enter an index value' });
      ok = false;
    }
    if (state.query == null) {
      this.setState({ isValid: false, validationMessage: 'Enter a query value' });
      ok = false;
    }
    if (state.threshold == null) {
      this.setState({ isValid: false, validationMessage: 'Enter a threshold value' });
      ok = false;
    }
    if (state.interval == null) {
      this.setState({ isValid: false, validationMessage: 'Enter an interval value' });
      ok = false;
    }
    if (state.firstRun == null) {
      this.setState({ isValid: false, validationMessage: 'Enter an first run value' });
      ok = false;
    }

    if (ok) {
      const state = this.state;
      const payload = {
        index: state.index,
        query: state.query,
        threshold: state.threshold,
        interval: state.interval,
        firstRun: state.firstRun,
        failMe: state.failMe,
      };
      this.props.sendScheduleData(payload);
    }

    event.preventDefault();
  }

  render() {
    return (
      <form method="POST" onSubmit={this.validateAndSend}>
        <EuiForm
          isInvalid={this.state.isValid !== true}
          error={this.state.validationMessage}
        >
          <EuiFormRow label="Index" helpText={'e.g. "logstash-*"'}>
            <EuiFieldText onChange={this.onChangeIndex} />
          </EuiFormRow>

          <EuiFormRow label="Query" helpText={'e.g. "NOT response.keyword: 200"'}>
            <EuiFieldText onChange={this.onChangeQuery} />
          </EuiFormRow>

          <EuiFormRow
            label="Threshold"
            helpText="Search result hits count to check against"
          >
            <EuiFieldText onChange={this.onChangeThreshold} />
          </EuiFormRow>

          <EuiFormRow label="Check every">
            <EuiSelect
              hasNoInitialSelection
              options={[
                { value: '1m', text: '1 minute' },
                { value: '5m', text: '5 minutes' },
                { value: '10m', text: '10 minutes' },
              ]}
              onChange={this.onChangeInterval}
            />
          </EuiFormRow>

          <EuiFormRow label="First run">
            <EuiSelect
              hasNoInitialSelection
              options={[
                { value: 'immediately', text: 'immediately' },
                { value: '5m', text: '5 minutes' },
                { value: '10m', text: '10 minutes' },
              ]}
              onChange={this.onChangeFirstRun}
            />
          </EuiFormRow>

          <EuiFormRow>
            <EuiSwitch
              label="Make me fail? Test task failure once every 3rd run"
              checked={this.state.failMe}
              onChange={this.onChangeFailMe}
            />
          </EuiFormRow>

          <EuiButton type="submit" fill>
            Schedule task
          </EuiButton>
        </EuiForm>
      </form>
    );
  }
}
