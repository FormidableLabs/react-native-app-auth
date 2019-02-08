import React, { Component } from 'react';
import { UIManager, LayoutAnimation, Alert, ScrollView } from 'react-native';
import styled from 'styled-components/native';
import {
  authorize,
  refresh,
  revoke,
  onlyAuthorize,
  onlyTokenExchange
} from 'react-native-app-auth';
import { Page, Button, ButtonContainer, Form, Heading } from './';

const Scrollable = styled.ScrollView`
  flex: 1;
  margin-top: 20px;
  margin-bottom: 100px;
`;

UIManager.setLayoutAnimationEnabledExperimental &&
  UIManager.setLayoutAnimationEnabledExperimental(true);

type State = {
  hasLoggedInOnce: boolean,
  accessToken: ?string,
  accessTokenExpirationDate: ?string,
  refreshToken: ?string
};

const config = {
  issuer: 'https://demo.identityserver.io',
  clientId: 'native.code',
  redirectUrl: 'io.identityserver.demo:/oauthredirect',
  additionalParameters: {},
  scopes: ['openid', 'profile', 'email', 'offline_access'],

  serviceConfiguration: {
    authorizationEndpoint: 'https://demo.identityserver.io/connect/authorize',
    tokenEndpoint: 'https://demo.identityserver.io/connect/token',
    revocationEndpoint: 'https://demo.identityserver.io/connect/revoke'
  }
};

export default class App extends Component<{}, State> {
  state = {
    hasLoggedInOnce: false,
    authResult: null,
    tokenResult: null
  };

  animateState(nextState: $Shape<State>, delay: number = 0) {
    setTimeout(() => {
      this.setState(() => {
        LayoutAnimation.easeInEaseOut();
        return nextState;
      });
    }, delay);
  }

  onlyAuthorize = async () => {
    try {
      const authResult = await onlyAuthorize(config);

      this.animateState(
        {
          authResult,
          tokenResult: null
        },
        500
      );

      this.setState({
        authResult,
        tokenResult: null
      });
    } catch (error) {
      Alert.alert('Failed to authorize', error.message);
    }
  };

  onlyTokenExchange = async () => {
    try {
      const tokenResult = await onlyTokenExchange();

      this.animateState(
        {
          tokenResult
        },
        500
      );

      this.setState({
        tokenResult
      });
    } catch (error) {
      Alert.alert('Failed to exchange token', error.message);
    }
  };

  flattenObject = obj => {
    return Object.keys(obj).reduce((acc, curr) => `${acc}, ${curr}: ${obj[curr]}`, '');
  };

  render() {
    const { state } = this;
    return (
      <>
        {!state.authResult ? <Heading>Hello, stranger.</Heading> : null}
        <Scrollable>
          {!!state.authResult ? (
            <Form>
              <Form.Label>authResult: additionalParameters</Form.Label>
              <Form.Value>{this.flattenObject(state.authResult.additionalParameters)}</Form.Value>
              <Form.Label>authResult: scopes</Form.Label>
              <Form.Value>{state.authResult.scopes.join(', ')}</Form.Value>
              <Form.Label>authResult: authorizationCode</Form.Label>
              <Form.Value>{state.authResult.authorizationCode}</Form.Value>
              <Form.Label>authResult: state</Form.Label>
              <Form.Value>{state.authResult.state}</Form.Value>
              {!!state.tokenResult ? (
                <>
                  <Form.Label>tokenResult: accessToken</Form.Label>
                  <Form.Value>{state.tokenResult.accessToken}</Form.Value>
                  <Form.Label>tokenResult: additionalParameters</Form.Label>
                  <Form.Value>
                    {this.flattenObject(state.tokenResult.additionalParameters)}
                  </Form.Value>
                  <Form.Label>tokenResult: idToken</Form.Label>
                  <Form.Value>{state.tokenResult.idToken}</Form.Value>
                  <Form.Label>tokenResult: refreshToken</Form.Label>
                  <Form.Value>{state.tokenResult.refreshToken}</Form.Value>
                  <Form.Label>tokenResult: tokenType</Form.Label>
                  <Form.Value>{state.tokenResult.tokenType}</Form.Value>
                  <Form.Label>tokenResult: accessTokenExpirationTime</Form.Label>
                  <Form.Value>{state.tokenResult.accessTokenExpirationTime}</Form.Value>
                </>
              ) : null}
            </Form>
          ) : null}
        </Scrollable>

        <ButtonContainer>
          <Button onPress={this.onlyAuthorize} text="Only Authorize" color="#00b300" />
          <Button onPress={this.onlyTokenExchange} text="Only Token Exchange" color="#FFA500" />
        </ButtonContainer>
      </>
    );
  }
}
