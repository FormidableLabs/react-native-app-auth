import { NativeModules, Platform } from 'react-native';
import { register, refresh, logout } from './';

jest.mock('react-native', () => ({
  NativeModules: { RNAppAuth: { register: jest.fn(), refresh: jest.fn(), logout: jest.fn() } },
  Platform: { OS: 'ios' },
}));
jest.mock('react-native-base64', () => ({ encode: jest.fn() }));

const config = {
  issuer: 'https://fixture.example',
  clientId: 'fixture-client',
  redirectUrl: 'com.fixture:/callback',
};
const operations = [
  ['register', () => register({ ...config, redirectUrls: [config.redirectUrl] })],
  ['refresh', () => refresh(config, { refreshToken: 'fixture-refresh-token' })],
  [
    'logout',
    () =>
      logout(config, { idToken: 'fixture-id-token', postLogoutRedirectUrl: config.redirectUrl }),
  ],
];

describe.each(['ios', 'android'])('native authentication errors on %s', platform => {
  beforeEach(() => {
    Platform.OS = platform;
    jest.clearAllMocks();
  });

  describe.each(operations)('%s', (method, invoke) => {
    it('preserves the original error, code and message while exposing native details', async () => {
      const error = new Error('Fixture authentication failure');
      error.code = 'fixture_auth_error';
      error.userInfo = { nativeError: 'Fixture native detail' };
      NativeModules.RNAppAuth[method].mockRejectedValueOnce(error);
      await expect(invoke()).rejects.toBe(error);
      expect(error).toMatchObject({
        code: 'fixture_auth_error',
        message: 'Fixture authentication failure',
        nativeError: 'Fixture native detail',
      });
    });

    it('preserves native details already exposed at the top level', async () => {
      const error = {
        code: 'fixture_auth_error',
        nativeError: 'Original detail',
        userInfo: { nativeError: 'Other detail' },
      };
      NativeModules.RNAppAuth[method].mockRejectedValueOnce(error);
      await expect(invoke()).rejects.toBe(error);
      expect(error.nativeError).toBe('Original detail');
    });

    it('preserves ordinary errors without adding native details', async () => {
      const error = new Error('Fixture failure without native metadata');
      NativeModules.RNAppAuth[method].mockRejectedValueOnce(error);
      await expect(invoke()).rejects.toBe(error);
      expect(error).not.toHaveProperty('nativeError');
    });
  });
});
