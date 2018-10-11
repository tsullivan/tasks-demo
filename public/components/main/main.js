import React from 'react';
import {
  EuiPage,
  EuiPageHeader,
  EuiTitle,
  EuiForm,
  EuiFormRow,
  EuiFieldText,
  EuiSelect,
  EuiSwitch,
  EuiButton,
  EuiPageBody,
  EuiPageContent,
  EuiPageContentHeader,
  EuiPageContentBody,
  EuiText,
} from '@elastic/eui';

export class Main extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    const { title } = this.props;
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
                <h2>Tasks Demo</h2>
              </EuiTitle>
            </EuiPageContentHeader>
            <EuiPageContentBody>
              <EuiText>
                <h3>Use this form to schedule a demo task</h3>
                <EuiForm>
                  <EuiFormRow label="Index" helpText={'e.g. "logstash-*"'}>
                    <EuiFieldText name="index" />
                  </EuiFormRow>

                  <EuiFormRow
                    label="Query"
                    helpText={'e.g. "NOT response.keyword: 200"'}
                  >
                    <EuiFieldText name="query" />
                  </EuiFormRow>

                  <EuiFormRow label="Metric" helpText="Enter a number for threshold">
                    <EuiFieldText name="index" />
                  </EuiFormRow>

                  <EuiFormRow label="Select Metric Agg">
                    <EuiSelect
                      hasNoInitialSelection
                      options={[{ value: 'count', text: 'Count' }]}
                    />
                  </EuiFormRow>

                  <EuiFormRow label="Check every">
                    <EuiSelect
                      hasNoInitialSelection
                      options={[
                        { value: '1m', text: '1 minute' },
                        { value: '5m', text: '5 minutes' },
                        { value: '10m', text: '10 minutes' },
                      ]}
                    />
                  </EuiFormRow>

                  <EuiFormRow label="Options">
                    <EuiSwitch
                      name="allow_snooze"
                      label="Allow snooze?"
                      checked={this.state.allowSnooze}
                    />
                  </EuiFormRow>

                  <EuiButton type="submit" fill>
                    Schedule task
                  </EuiButton>
                </EuiForm>
              </EuiText>
            </EuiPageContentBody>
          </EuiPageContent>
        </EuiPageBody>
      </EuiPage>
    );
  }
}
