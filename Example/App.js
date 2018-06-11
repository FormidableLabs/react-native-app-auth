import React, { Component } from 'react';
import { UIManager, LayoutAnimation, Alert } from 'react-native';
import { authorize, refresh, revoke } from 'react-native-app-auth';
import { Page, Button, ButtonContainer, Form, Heading } from './components';
import {clientId, ISSUER, B2C_POLICY_PLACEHOLDER} from './config';

UIManager.setLayoutAnimationEnabledExperimental &&
  UIManager.setLayoutAnimationEnabledExperimental(true);

type State = {
  hasLoggedInOnce: boolean,
  accessToken: ?string,
  accessTokenExpirationDate: ?string,
  refreshToken: ?string
};

const policyName = 'B2C_1A_fail_test';
const issuerRoot = ISSUER.replace(B2C_POLICY_PLACEHOLDER, policyName);
const redirectUrl = 'io.identityserver.demo://oauthredirect';

const config = {
  // issuer: 'https://demo.identityserver.io',
  clientId,
  redirectUrl,
  additionalParameters: {},
  scopes: ['openid', 'offline_access'],

  serviceConfiguration: {
    authorizationEndpoint: `${issuerRoot}authorize`,
    tokenEndpoint: `${issuerRoot}token`,
    revocationEndpoint: `${issuerRoot}logout?post_logout_redirect_uri=${redirectUrl}`,
  }
};

export default class App extends Component<{}, State> {
  state = {
    hasLoggedInOnce: false,
    accessToken: '',
    accessTokenExpirationDate: '',
    refreshToken: ''
  };

  animateState(nextState: $Shape<State>, delay: number = 0) {
    setTimeout(() => {
      this.setState(() => {
        LayoutAnimation.easeInEaseOut();
        return nextState;
      });
    }, delay);
  }

  authorize = async () => {
    try {
      const authState = await authorize(config);

      this.animateState(
        {
          hasLoggedInOnce: true,
          accessToken: authState.accessToken,
          accessTokenExpirationDate: authState.accessTokenExpirationDate,
          refreshToken: authState.refreshToken
        },
        400
      );
    } catch (error) {
      console.log({ error })

      if (error.code === 'RNAppAuth Error') {
        const msg = error.message;
        if (msg === 'User cancelled flow') {
          Alert.alert('Failed to log in', 'The login screen was closed');
        } else if(msg.includes('AADB2C'))  {
          Alert.alert('Authentication server error', msg);
        } else {
          Alert.alert('Authentication error', msg);
        }
      } else {
        Alert.alert('Unknown error', error.message);
      }
    }
  };

  refresh = async () => {
    try {
      const authState = await refresh(config, {
        refreshToken: this.state.refreshToken
      });

      this.animateState({
        accessToken: authState.accessToken || this.state.accessToken,
        accessTokenExpirationDate:
          authState.accessTokenExpirationDate || this.state.accessTokenExpirationDate,
        refreshToken: authState.refreshToken || this.state.refreshToken
      });
    } catch (error) {
      Alert.alert('Failed to refresh token', error.message);
    }
  };

  revoke = async () => {
    try {
      await revoke(config, {
        tokenToRevoke: this.state.accessToken,
        sendClientId: true
      });
      this.animateState({
        accessToken: '',
        accessTokenExpirationDate: '',
        refreshToken: ''
      });
    } catch (error) {
      Alert.alert('Failed to revoke token', error.message);
    }
  };

  logout = async () => {
    try {
      const logoutConfig = {...config, serviceConfiguration: { 
          authorizationEndpoint: config.revocationEndpoint, 
          ...config.serviceConfiguration 
        }
      }
      const authState = await authorize(logoutConfig);

      this.animateState(
        {
          hasLoggedInOnce: false,
          accessToken: '',
          accessTokenExpirationDate: '',
          refreshToken: ''
        }
      );
    } catch (error) {
      Alert.alert('Failed to log out', error.message);
    }
  };

  render() {
    const { state } = this;
    return (
      <Page>
        {!!state.accessToken ? (
          <Form>
            <Form.Label>accessToken</Form.Label>
            <Form.Value>{state.accessToken}</Form.Value>
            <Form.Label>accessTokenExpirationDate</Form.Label>
            <Form.Value>{state.accessTokenExpirationDate}</Form.Value>
            <Form.Label>refreshToken</Form.Label>
            <Form.Value>{state.refreshToken}</Form.Value>
          </Form>
        ) : (
          <Heading>{state.hasLoggedInOnce ? 'Goodbye.' : 'Hello, stranger.'}</Heading>
        )}

        <ButtonContainer>
          {!state.accessToken && (
            <Button onPress={this.authorize} text="Authorize" color="#DA2536" />
          )}
          {!!state.refreshToken && <Button onPress={this.refresh} text="Refresh" color="#24C2CB" />}
          {!!state.refreshToken && <Button onPress={this.logout} text="Logout" color="green" />}
          {!!state.accessToken && <Button onPress={this.revoke} text="Revoke" color="#EF525B" />}
        </ButtonContainer>
      </Page>
    );
  }
}
