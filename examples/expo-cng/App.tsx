import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Button, Alert, ScrollView } from 'react-native';
import {
  authorize,
  refresh,
  revoke,
  logout,
  prefetchConfiguration,
  resumePendingAuthorize,
  AuthConfiguration,
  AuthorizeResult,
} from 'react-native-app-auth';

const duendeConfig: AuthConfiguration = {
  issuer: 'https://demo.duendesoftware.com',
  clientId: 'interactive.public',
  redirectUrl: 'io.identityserver.demo:/oauthredirect',
  additionalParameters: {},
  scopes: ['openid', 'profile', 'email', 'offline_access'],
};

const postLogoutRedirectUrl = 'io.identityserver.demo:/oauthredirect';
let startupRecovery: Promise<AuthorizeResult | null> | undefined;

export default function App() {
  const [authState, setAuthState] = useState<AuthorizeResult | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    // Share the claim across development Strict Mode's effect remounts.
    startupRecovery = startupRecovery || resumePendingAuthorize(duendeConfig);
    startupRecovery.then(result => {
      if (mounted && result) {
        setAuthState(result);
      }
    }).catch(error => {
      if (mounted) {
        Alert.alert('Failed to resume login', (error as Error).message);
      }
    });
    return () => { mounted = false; };
  }, []);

  async function runAction<T>(label: string, action: () => Promise<T>): Promise<T | null> {
    try {
      setLoading(label);
      return await action();
    } catch (error) {
      console.error(`${label} error:`, error);
      Alert.alert(label, (error as Error).message);
      return null;
    } finally {
      setLoading(null);
    }
  }

  async function handlePrefetch(): Promise<void> {
    const result = await runAction('Prefetch', () =>
      prefetchConfiguration({
        ...duendeConfig,
        warmAndPrefetchChrome: true,
        connectionTimeoutSeconds: 5,
      })
    );

    if (result != null) {
      Alert.alert('Prefetch complete', `Result: ${String(result)}`);
    }
  }

  async function handleAuthorize(): Promise<void> {
    const result = await runAction('Authorize', () =>
      authorize({
        ...duendeConfig,
        connectionTimeoutSeconds: 5,
        iosPrefersEphemeralSession: true,
      })
    );

    if (result) {
      setAuthState(result);
      Alert.alert('Authorized', 'Duende authentication completed.');
    }
  }

  async function handleRefresh(): Promise<void> {
    if (!authState?.refreshToken) {
      return;
    }

    const result = await runAction('Refresh', () =>
      refresh(duendeConfig, { refreshToken: authState.refreshToken })
    );

    if (result) {
      setAuthState(current =>
        current
          ? {
              ...current,
              ...result,
              refreshToken: result.refreshToken || current.refreshToken,
            }
          : current
      );
    }
  }

  async function handleRevoke(): Promise<void> {
    if (!authState?.accessToken) {
      return;
    }

    const result = await runAction('Revoke', () =>
      revoke(duendeConfig, {
        tokenToRevoke: authState.accessToken,
        sendClientId: true,
      })
    );

    if (result !== null) {
      setAuthState(null);
      Alert.alert('Revoked', 'Access token was revoked.');
    }
  }

  async function handleLogout(): Promise<void> {
    if (!authState?.idToken) {
      return;
    }

    const result = await runAction('Logout', () =>
      logout(duendeConfig, {
        idToken: authState.idToken,
        postLogoutRedirectUrl,
      })
    );

    if (result) {
      setAuthState(null);
      Alert.alert('Logged out', 'End-session redirect completed.');
    }
  }

  const isBusy = loading != null;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>React Native App Auth - Expo CNG Demo</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Duende Public Smoke Provider</Text>
        <Text style={styles.info}>Issuer: {duendeConfig.issuer}</Text>
        <Text style={styles.info}>Client ID: {duendeConfig.clientId}</Text>
        <Text style={styles.info}>Redirect URL: {duendeConfig.redirectUrl}</Text>
        <Text style={styles.info}>Scopes: {duendeConfig.scopes.join(', ')}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Authentication Status</Text>
        <Text style={styles.status}>
          {authState ? 'Authenticated' : 'Not authenticated'}
        </Text>
        <Text style={styles.info}>Current action: {loading || 'None'}</Text>
      </View>

      <View style={styles.actions}>
        <Button title="Prefetch" onPress={handlePrefetch} disabled={isBusy} />
        <Button title="Authorize" onPress={handleAuthorize} disabled={isBusy} />
        <Button
          title="Refresh"
          onPress={handleRefresh}
          disabled={isBusy || !authState?.refreshToken}
        />
        <Button
          title="Revoke"
          onPress={handleRevoke}
          disabled={isBusy || !authState?.accessToken}
          color="#EF525B"
        />
        <Button
          title="Logout"
          onPress={handleLogout}
          disabled={isBusy || !authState?.idToken}
          color="#525AEF"
        />
      </View>

      {authState ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Token Result</Text>
          <Text style={styles.info}>
            Access Token: {authState.accessToken.substring(0, 24)}...
          </Text>
          <Text style={styles.info}>
            Refresh Token: {authState.refreshToken ? 'Present' : 'N/A'}
          </Text>
          <Text style={styles.info}>
            ID Token: {authState.idToken ? 'Present' : 'N/A'}
          </Text>
          <Text style={styles.info}>Token Type: {authState.tokenType}</Text>
          <Text style={styles.info}>Scopes: {authState.scopes.join(', ')}</Text>
        </View>
      ) : null}

      <StatusBar style="auto" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  section: {
    marginVertical: 12,
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    width: '100%',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  status: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
  },
  info: {
    fontSize: 14,
    marginBottom: 5,
    color: '#666',
  },
  actions: {
    gap: 10,
    marginVertical: 12,
  },
});
