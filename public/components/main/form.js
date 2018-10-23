import React from 'react';
import {
  EuiForm,
  EuiFormRow,
  EuiFieldText,
  EuiSelect,
  EuiSwitch,
  EuiButton,
} from '@elastic/eui';

export class ScheduleForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      index: null,
      query: null,
      threshold: null,
      interval: null,
      allowSnooze: false,
      snoozeTime: null,
      isValid: true,
      validationMessage: null,
    };

    this.onChangeIndex = this.onChangeIndex.bind(this);
    this.onChangeQuery = this.onChangeQuery.bind(this);
    this.onChangeThreshold = this.onChangeThreshold.bind(this);
    this.onChangeInterval = this.onChangeInterval.bind(this);
    this.onChangeAllowSnooze = this.onChangeAllowSnooze.bind(this);
    this.onChangeSnoozeTime = this.onChangeSnoozeTime.bind(this);
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

  onChangeAllowSnooze() {
    const allowSnooze = !this.state.allowSnooze;
    this.setState({ isValid: true, allowSnooze });
  }

  onChangeSnoozeTime(event) {
    const snoozeTime = event.target.value;
    this.setState({ isValid: true, snoozeTime });
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
    if (state.allowSnooze && state.snoozeTime == null) {
      this.setState({
        isValid: false,
        validationMessage: 'Enter a snooze time value, or un-check "allow snooze"',
      });
      ok = false;
    }

    if (ok) {
      const state = this.state;
      const payload = {
        index: state.index,
        query: state.query,
        threshold: state.threshold,
        interval: state.interval,
        allow_snooze: state.allowSnooze,
        snooze_time: state.snoozeTime,
      };
      this.props.sendScheduleData(payload);
    }

    event.preventDefault();
  }

  render() {
    const snoozesFor = this.state.allowSnooze ? (
      <EuiFormRow label="Snooze Time">
        <EuiSelect
          hasNoInitialSelection
          options={[
            { value: '9m', text: '9 minutes' },
            { value: '25m', text: '25 minutes' },
            { value: '60m', text: '1 hour' },
          ]}
          onChange={this.onChangeSnoozeTime}
        />
      </EuiFormRow>
    ) : null;

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

          <EuiFormRow label="Snooze">
            <EuiSwitch
              label="Allow snooze?"
              checked={this.state.allowSnooze}
              onChange={this.onChangeAllowSnooze}
            />
          </EuiFormRow>

          {snoozesFor}

          <EuiButton type="submit" fill>
            Schedule task
          </EuiButton>
        </EuiForm>
      </form>
    );
  }
}
