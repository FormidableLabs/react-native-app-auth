import { NativeModules, Platform } from 'react-native';
import { resumePendingAuthorize } from './';

jest.mock('react-native', () => ({
  NativeModules: { RNAppAuth: { resumePendingAuthorize: jest.fn() } },
  Platform: { OS: 'android' },
}));

jest.mock('react-native-base64', () => ({
  encode: jest.fn(),
  decode: jest.fn(),
}));

describe('resumePendingAuthorize', () => {
  const nativeResume = NativeModules.RNAppAuth.resumePendingAuthorize;

  beforeEach(() => {
    Platform.OS = 'android';
    nativeResume.mockReset();
    nativeResume.mockResolvedValue(null);
  });

  it('supports an unconditional startup call with the Android defaults', async () => {
    await expect(resumePendingAuthorize()).resolves.toBeNull();
    expect(nativeResume).toHaveBeenCalledWith(undefined, 15000, undefined, false, undefined, 'basic', false);
  });

  it('preserves client authentication, exchange mode and transport options', async () => {
    const parameters = { audience: 'api', prompt: 'login' };
    const headers = { token: { 'X-Client': 'demo' } };
    await resumePendingAuthorize({
      additionalParameters: parameters,
      clientSecret: 'fixture-secret',
      clientAuthMethod: 'post',
      skipCodeExchange: true,
      customHeaders: headers,
      dangerouslyAllowInsecureHttpRequests: true,
      connectionTimeoutSeconds: 5,
    });
    expect(nativeResume).toHaveBeenCalledWith(parameters, 5000, headers, true, 'fixture-secret', 'post', true);
  });

  it('returns a recovered result unchanged', async () => {
    const result = { authorizationCode: 'fixture-code', codeVerifier: 'fixture-verifier' };
    nativeResume.mockResolvedValue(result);
    await expect(resumePendingAuthorize({ skipCodeExchange: true })).resolves.toBe(result);
  });

  it('never calls the Android bridge on iOS', async () => {
    Platform.OS = 'ios';
    await expect(resumePendingAuthorize()).resolves.toBeNull();
    expect(nativeResume).not.toHaveBeenCalled();
  });

  it('validates transport options before claiming the native result', () => {
    expect(() => resumePendingAuthorize({ customHeaders: { unknown: {} } })).toThrow();
    expect(() => resumePendingAuthorize({ connectionTimeoutSeconds: '5' })).toThrow();
    expect(nativeResume).not.toHaveBeenCalled();
  });

  it('preserves the native error normalization used by authorize', async () => {
    const error = { code: 'invalid_grant', userInfo: { nativeError: 'fixture failure' } };
    nativeResume.mockRejectedValue(error);
    await expect(resumePendingAuthorize()).rejects.toMatchObject({
      code: 'invalid_grant', nativeError: 'fixture failure',
    });
  });
});
