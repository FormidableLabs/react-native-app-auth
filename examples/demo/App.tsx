/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, {useCallback, useRef, useState} from 'react';
import {
  Alert,
  StatusBar,
  useColorScheme,
  Text,
  SafeAreaView,
  StyleSheet,
  Pressable,
  View,
  ScrollView,
} from 'react-native';
import {
  AuthConfiguration,
  authorize,
  refresh,
  revoke,
  prefetchConfiguration,
} from 'react-native-app-auth';

const configs: Record<string, AuthConfiguration> = {
  identityserver: {
    issuer: 'https://demo.duendesoftware.com',
    clientId: 'interactive.public',
    redirectUrl: 'io.identityserver.demo:/oauthredirect',
    additionalParameters: {},
    scopes: ['openid', 'profile', 'email', 'offline_access'],

    // serviceConfiguration: {
    //   authorizationEndpoint: 'https://demo.duendesoftware.com/connect/authorize',
    //   tokenEndpoint: 'https://demo.duendesoftware.com/connect/token',
    //   revocationEndpoint: 'https://demo.duendesoftware.com/connect/revoke'
    // }
  },
  auth0: {
    issuer: 'https://rnaa-demo.eu.auth0.com',
    clientId: 'VtXdAoGFcYzZ3IJaNy4UIS5RNHhdbKbU',
    redirectUrl: 'rnaa-demo://oauthredirect',
    additionalParameters: {},
    scopes: ['openid', 'profile', 'email', 'offline_access'],

    // serviceConfiguration: {
    //   authorizationEndpoint: 'https://samples.auth0.com/authorize',
    //   tokenEndpoint: 'https://samples.auth0.com/oauth/token',
    //   revocationEndpoint: 'https://samples.auth0.com/oauth/revoke'
    // }
  },
};

type AuthState = {
  hasLoggedInOnce: boolean;
  provider: keyof typeof configs;
  accessToken: string;
  accessTokenExpirationDate: string;
  refreshToken: string;
  scopes?: string[];
};
const defaultAuthState: AuthState = {
  hasLoggedInOnce: false,
  provider: '' as keyof typeof configs,
  accessToken: '',
  accessTokenExpirationDate: '',
  refreshToken: '',
};

interface ButtonProps {
  title: string;
  onPress: () => void;
  color?: string;
  disabled?: boolean;
}

const Button: React.FC<ButtonProps> = ({title, onPress, color = '#007AFF', disabled = false}) => (
  <Pressable
    onPress={onPress}
    accessibilityRole="button"
    accessibilityState={{disabled}}
    disabled={disabled}
    style={({pressed}) => [
      styles.button,
      {opacity: pressed || disabled ? 0.5 : 1, backgroundColor: color},
    ]}>
    <Text style={styles.buttonText}>{title}</Text>
  </Pressable>
);

interface HeaderProps {
  title: string;
}

const Header: React.FC<HeaderProps> = ({title}) => (
  <Text style={styles.header}>{title}</Text>
);

interface KeyValueLabelProps {
  label: string;
  value: string;
}

const KeyValueLabel: React.FC<KeyValueLabelProps> = ({label, value}) => (
  <View style={styles.keyValueContainer}>
    <Text style={styles.label}>{label}:</Text>
    <Text style={styles.value}>{value}</Text>
  </View>
);

interface RowProps {
  children: React.ReactNode;
}

const Row: React.FC<RowProps> = ({children}) => (
  <View style={styles.row}>{children}</View>
);

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  const [authState, setAuthState] = useState(defaultAuthState);
  const [isBusy, setIsBusy] = useState(false);
  const pending = useRef(false);
  const mounted = useRef(false);
  React.useEffect(() => {
    mounted.current = true;
    prefetchConfiguration({
      warmAndPrefetchChrome: true,
      connectionTimeoutSeconds: 5,
      ...configs.auth0,
    }).catch(() => {
      // Prefetch is optional; authorize will retry discovery when needed.
    });
    return () => {
      mounted.current = false;
    };
  }, []);

  const runAuthOperation = useCallback(
    async (errorTitle: string, operation: () => Promise<AuthState>) => {
      if (pending.current || !mounted.current) {
        return;
      }
      pending.current = true;
      setIsBusy(true);
      try {
        const nextState = await operation();
        if (mounted.current) {
          setAuthState(nextState);
        }
      } catch (error: any) {
        if (mounted.current) {
          Alert.alert(errorTitle, error.message);
        }
      } finally {
        pending.current = false;
        if (mounted.current) {
          setIsBusy(false);
        }
      }
    },
    [],
  );

  const handleAuthorize = (provider: keyof typeof configs) =>
    runAuthOperation('Failed to log in', async () => {
      const result = await authorize({
        ...configs[provider],
        connectionTimeoutSeconds: 5,
        iosPrefersEphemeralSession: true,
      });
      return {...result, hasLoggedInOnce: true, provider};
    });

  const handleRefresh = () =>
    runAuthOperation('Failed to refresh token', async () => {
      const result = await refresh(configs[authState.provider], {
        refreshToken: authState.refreshToken,
      });
      return {
        ...authState,
        ...result,
        refreshToken: result.refreshToken || authState.refreshToken,
      };
    });

  const handleRevoke = () =>
    runAuthOperation('Failed to revoke token', async () => {
      await revoke(configs[authState.provider], {
        tokenToRevoke: authState.accessToken,
        sendClientId: true,
      });
      return defaultAuthState;
    });

  const providerConfig = configs[authState.provider];
  const showRevoke = Boolean(
    authState.accessToken &&
      (providerConfig?.issuer ||
        providerConfig?.serviceConfiguration?.revocationEndpoint),
  );

  return (
    <SafeAreaView>
      <ScrollView>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

        <Header title="React Native App Auth Demo" />
        {isBusy ? (
          <Text accessibilityLiveRegion="polite">
            Authentication request in progress…
          </Text>
        ) : null}

        <KeyValueLabel
          label="Access Token"
          value={authState.accessToken || 'N/A'}
        />
        <KeyValueLabel
          label="Access Token Expiration Date"
          value={authState.accessTokenExpirationDate || 'N/A'}
        />
        <KeyValueLabel
          label="Refresh Token"
          value={authState.refreshToken || 'N/A'}
        />
        <KeyValueLabel label="Provider" value={authState.provider || 'N/A'} />
        <KeyValueLabel
          label="Scopes"
          value={authState.scopes?.join(', ') || 'N/A'}
        />
        <Row>
          <Button
            title="Login with Auth0"
            disabled={isBusy}
            onPress={() => handleAuthorize('auth0')}
          />
          <Button
            title="Login with IdentityServer"
            disabled={isBusy}
            onPress={() => handleAuthorize('identityserver')}
          />
        </Row>
        <Row>
          {authState.refreshToken ? (
            <Button onPress={handleRefresh} title="Refresh" disabled={isBusy} />
          ) : null}
          {showRevoke ? (
            <Button onPress={handleRevoke} title="Revoke" color="#EF525B" disabled={isBusy} />
          ) : null}
        </Row>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: 5,
    alignItems: 'center',
    marginVertical: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginVertical: 10,
  },
  keyValueContainer: {
    flexDirection: 'row',
    marginVertical: 5,
    paddingHorizontal: 10,
  },
  label: {
    fontWeight: 'bold',
    marginRight: 5,
  },
  value: {
    flexShrink: 1,
  },
});

export default App;
