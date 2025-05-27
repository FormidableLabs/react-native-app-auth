/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, {useCallback, useMemo, useState} from 'react';
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
    scopes: ['openid', 'profile', 'email', 'offline_access'] as const,

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
    scopes: ['openid', 'profile', 'email', 'offline_access'] as const,

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
}

const Button: React.FC<ButtonProps> = ({title, onPress, color = '#007AFF'}) => (
  <Pressable
    onPress={onPress}
    style={({pressed}) => [
      styles.button,
      {opacity: pressed ? 0.5 : 1, backgroundColor: color},
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
  React.useEffect(() => {
    prefetchConfiguration({
      warmAndPrefetchChrome: true,
      connectionTimeoutSeconds: 5,
      ...configs.auth0,
    });
  }, []);

  const handleAuthorize = useCallback(
    async (provider: keyof typeof configs) => {
      try {
        const config = configs[provider];
        const newAuthState = await authorize({
          ...config,
          connectionTimeoutSeconds: 5,
          iosPrefersEphemeralSession: true,
        });

        setAuthState({
          hasLoggedInOnce: true,
          provider: provider,
          ...newAuthState,
        });
      } catch (error: any) {
        Alert.alert('Failed to log in', error.message);
      }
    },
    [],
  );

  const handleRefresh = useCallback(async () => {
    try {
      const config = configs[authState.provider];
      const newAuthState = await refresh(config, {
        refreshToken: authState.refreshToken,
      });

      setAuthState(current => ({
        ...current,
        ...newAuthState,
        refreshToken: newAuthState.refreshToken || current.refreshToken,
      }));
    } catch (error: any) {
      Alert.alert('Failed to refresh token', error.message);
    }
  }, [authState]);

  const handleRevoke = useCallback(async () => {
    try {
      const config = configs[authState.provider];
      await revoke(config, {
        tokenToRevoke: authState.accessToken,
        sendClientId: true,
      });

      setAuthState({
        hasLoggedInOnce: false,
        provider: '',
        accessToken: '',
        accessTokenExpirationDate: '',
        refreshToken: '',
      });
    } catch (error: any) {
      Alert.alert('Failed to revoke token', error.message);
    }
  }, [authState]);

  const showRevoke = useMemo(() => {
    if (authState.accessToken) {
      const config = configs[authState.provider];
      if (config.issuer || config?.serviceConfiguration?.revocationEndpoint) {
        return true;
      }
    }
    return false;
  }, [authState]);

  return (
    <SafeAreaView>
      <ScrollView>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

        <Header title="React Native App Auth Demo" />

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
            onPress={() => handleAuthorize('auth0')}
          />
          <Button
            title="Login with IdentityServer"
            onPress={() => handleAuthorize('identityserver')}
          />
        </Row>
        <Row>
          {authState.refreshToken ? (
            <Button onPress={handleRefresh} title="Refresh" />
          ) : null}
          {showRevoke ? (
            <Button onPress={handleRevoke} title="Revoke" color="#EF525B" />
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
