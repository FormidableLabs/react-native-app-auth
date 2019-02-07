import React, { Component } from 'react';
import { Text, TouchableOpacity } from 'react-native';
import styled from 'styled-components/native';
import { Advanced, Authenticate, Page } from './components';

const Toggle = styled.View`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  justify-content: center;
  align-items: center;
`;

type State = {
  isAdvanced: boolean
};

export default class App extends Component<{}, State> {
  state = {
    isAdvanced: false
  };

  toggleAdvanced = () => {
    this.setState({ isAdvanced: !this.state.isAdvanced });
  };

  render() {
    const { state } = this;
    return (
      <Page>
        {state.isAdvanced ? <Advanced /> : <Authenticate />}
        <Toggle>
          <TouchableOpacity onPress={this.toggleAdvanced}>
            <Text>{state.isAdvanced ? 'Back' : 'Advanced options'}</Text>
          </TouchableOpacity>
        </Toggle>
      </Page>
    );
  }
}
