import { authorize, refresh } from './';

jest.mock('react-native', () => ({
  NativeModules: {
    RNAppAuth: {
      authorize: jest.fn(),
      refresh: jest.fn(),
    },
  },
}));

describe('AppAuth', () => {
  let mockAuthorize;
  let mockRefresh;

  beforeAll(() => {
    mockAuthorize = require('react-native').NativeModules.RNAppAuth.authorize;
    mockAuthorize.mockReturnValue('AUTHORIZED');

    mockRefresh = require('react-native').NativeModules.RNAppAuth.refresh;
    mockRefresh.mockReturnValue('REFRESHED');
  });

  const baseConfig = {
    issuer: 'test-issuer',
    redirectUrl: 'test-redirectUrl',
    clientId: 'test-clientId',
    additionalParameters: { hello: 'world' },
    scopes: ['my-scope'],
  };

  describe('authorize', () => {
    beforeEach(() => {
      mockAuthorize.mockReset();
      mockRefresh.mockReset();
    });

    it('throws an error when issuer is not a string', () => {
      expect(() => {
        authorize({ ...baseConfig, issuer: () => ({}) });
      }).toThrow('Config error: issuer must be a string');
    });

    it('throws an error when redirectUrl is not a string', () => {
      expect(() => {
        authorize({ ...baseConfig, redirectUrl: {} });
      }).toThrow('Config error: redirectUrl must be a string');
    });

    it('throws an error when clientId is not a string', () => {
      expect(() => {
        authorize({ ...baseConfig, clientId: 123 });
      }).toThrow('Config error: clientId must be a string');
    });

    it('throws an error when no scopes are passed in', () => {
      expect(() => {
        authorize({ ...baseConfig, scopes: undefined });
      }).toThrow('Scope error: please add at least one scope');
    });

    it('throws an error when an empty scope array is passed in', () => {
      expect(() => {
        authorize({ ...baseConfig, scopes: [] });
      }).toThrow('Scope error: please add at least one scope');
    });

    it('calls the native wrapper with the correct args', () => {
      authorize(baseConfig);
      expect(mockAuthorize).toHaveBeenCalledWith(
        baseConfig.issuer,
        baseConfig.redirectUrl,
        baseConfig.clientId,
        baseConfig.scopes,
        baseConfig.additionalParameters
      );
    });
  });

  describe('refresh', () => {
    beforeEach(() => {
      mockAuthorize.mockReset();
      mockRefresh.mockReset();
    });

    it('throws an error when issuer is not a string', () => {
      expect(() => {
        authorize({ ...baseConfig, issuer: () => ({}) });
      }).toThrow('Config error: issuer must be a string');
    });

    it('throws an error when redirectUrl is not a string', () => {
      expect(() => {
        authorize({ ...baseConfig, redirectUrl: {} });
      }).toThrow('Config error: redirectUrl must be a string');
    });

    it('throws an error when clientId is not a string', () => {
      expect(() => {
        authorize({ ...baseConfig, clientId: 123 });
      }).toThrow('Config error: clientId must be a string');
    });

    it('throws an error when no refreshToken is passed in', () => {
      expect(() => {
        refresh(baseConfig);
      }).toThrow('Please pass in a refresh token');
    });

    it('throws an error when no scopes are passed in', () => {
      expect(() => {
        refresh({ ...baseConfig, refreshToken: 'such-token', scopes: undefined });
      }).toThrow('Scope error: please add at least one scope');
    });

    it('throws an error when an empty scope array is passed in', () => {
      expect(() => {
        refresh({ ...baseConfig, refreshToken: 'such-token', scopes: [] });
      }).toThrow('Scope error: please add at least one scope');
    });

    it('calls the native wrapper with the correct args', () => {
      refresh({ ...baseConfig, refreshToken: 'such-token' });
      expect(mockRefresh).toHaveBeenCalledWith(
        baseConfig.issuer,
        baseConfig.redirectUrl,
        baseConfig.clientId,
        'such-token',
        baseConfig.scopes,
        baseConfig.additionalParameters
      );
    });
  });
});
