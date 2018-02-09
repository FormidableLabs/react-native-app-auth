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

  const config = {
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
        authorize({ ...config, issuer: () => ({}) });
      }).toThrow('Config error: issuer must be a string');
    });

    it('throws an error when redirectUrl is not a string', () => {
      expect(() => {
        authorize({ ...config, redirectUrl: {} });
      }).toThrow('Config error: redirectUrl must be a string');
    });

    it('throws an error when clientId is not a string', () => {
      expect(() => {
        authorize({ ...config, clientId: 123 });
      }).toThrow('Config error: clientId must be a string');
    });

    it('throws an error when no scopes are passed in', () => {
      expect(() => {
        authorize({ ...config, scopes: undefined });
      }).toThrow('Scope error: please add at least one scope');
    });

    it('throws an error when an empty scope array is passed in', () => {
      expect(() => {
        authorize({ ...config, scopes: [] });
      }).toThrow('Scope error: please add at least one scope');
    });

    it('calls the native wrapper with the correct args', () => {
      authorize(config);
      expect(mockAuthorize).toHaveBeenCalledWith(
        config.issuer,
        config.redirectUrl,
        config.clientId,
        config.scopes,
        config.additionalParameters
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
        authorize({ ...config, issuer: () => ({}) });
      }).toThrow('Config error: issuer must be a string');
    });

    it('throws an error when redirectUrl is not a string', () => {
      expect(() => {
        authorize({ ...config, redirectUrl: {} });
      }).toThrow('Config error: redirectUrl must be a string');
    });

    it('throws an error when clientId is not a string', () => {
      expect(() => {
        authorize({ ...config, clientId: 123 });
      }).toThrow('Config error: clientId must be a string');
    });

    it('throws an error when no refreshToken is passed in', () => {
      expect(() => {
        refresh(config, {});
      }).toThrow('Please pass in a refresh token');
    });

    it('throws an error when no scopes are passed in', () => {
      expect(() => {
        refresh({ ...config, scopes: undefined }, { refreshToken: 'such-token' });
      }).toThrow('Scope error: please add at least one scope');
    });

    it('throws an error when an empty scope array is passed in', () => {
      expect(() => {
        refresh({ ...config, scopes: [] }, { refreshToken: 'such-token' });
      }).toThrow('Scope error: please add at least one scope');
    });

    it('calls the native wrapper with the correct args', () => {
      refresh({ ...config }, { refreshToken: 'such-token' });
      expect(mockRefresh).toHaveBeenCalledWith(
        config.issuer,
        config.redirectUrl,
        config.clientId,
        'such-token',
        config.scopes,
        config.additionalParameters
      );
    });
  });
});
