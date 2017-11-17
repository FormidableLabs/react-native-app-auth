import AppAuth from './';

jest.mock('react-native', () => ({
  NativeModules: {
    RNAppAuth: {
      authorize: jest.fn(),
      refresh: jest.fn()
    }
  }
}));

describe('AppAuth', () => {
  let mockAuthorize;
  let mockRefresh;

  const config = {
    issuer: 'test-issuer',
    redirectUrl: 'test-redirectUrl',
    clientId: 'test-clientId'
  };

  beforeAll(() => {
    mockAuthorize = require('react-native').NativeModules.RNAppAuth.authorize;
    mockAuthorize.mockReturnValue('AUTHORIZED');

    mockRefresh = require('react-native').NativeModules.RNAppAuth.refresh;
    mockRefresh.mockReturnValue('REFRESHED');
  });

  describe('when initialising a new instance', () => {
    it('saves the config correctly', () => {
      const appAuth = new AppAuth(config);
      expect(appAuth.getConfig()).toEqual(config);
    });

    it('throws an error when issuer is not a string', () => {
      expect(() => {
        new AppAuth({ ...config, issuer: () => ({}) }); // eslint-disable-line no-new
      }).toThrow('Config error: issuer must be a string');
    });

    it('throws an error when redirectUrl is not a string', () => {
      expect(() => {
        new AppAuth({ ...config, redirectUrl: {} }); // eslint-disable-line no-new
      }).toThrow('Config error: redirectUrl must be a string');
    });

    it('throws an error when clientId is not a string', () => {
      expect(() => {
        new AppAuth({ ...config, clientId: 123 }); // eslint-disable-line no-new
      }).toThrow('Config error: clientId must be a string');
    });
  });

  describe('authorize', () => {
    beforeEach(() => {
      mockAuthorize.mockReset();
      mockRefresh.mockReset();
    });

    const scopes = ['my-scope'];

    it('throws an error when no scopes are passed in', () => {
      const appAuth = new AppAuth(config);
      expect(() => {
        appAuth.authorize();
      }).toThrow('Scope error: please add at least one scope');
    });

    it('throws an error when an empty scope array is passed in', () => {
      const appAuth = new AppAuth(config);
      expect(() => {
        appAuth.authorize([]);
      }).toThrow('Scope error: please add at least one scope');
    });

    it('calls the native wrapper with the correct args', () => {
      const appAuth = new AppAuth(config);
      appAuth.authorize(scopes);
      expect(mockAuthorize).toHaveBeenCalledWith(
        config.issuer,
        config.redirectUrl,
        config.clientId,
        scopes
      );
    });
  });

  describe('refresh', () => {
    beforeEach(() => {
      mockAuthorize.mockReset();
      mockRefresh.mockReset();
    });

    const refreshToken = 'my-sample-token';
    const scopes = ['my-scope'];

    it('throws an error when no refreshToken is passed in', () => {
      const appAuth = new AppAuth(config);
      expect(() => {
        appAuth.refresh();
      }).toThrow('Please pass in a refresh token');
    });

    it('throws an error when no scopes are passed in', () => {
      const appAuth = new AppAuth(config);
      expect(() => {
        appAuth.refresh(refreshToken);
      }).toThrow('Scope error: please add at least one scope');
    });

    it('throws an error when an empty scope array is passed in', () => {
      const appAuth = new AppAuth(config);
      expect(() => {
        appAuth.refresh(refreshToken, []);
      }).toThrow('Scope error: please add at least one scope');
    });

    it('calls the native wrapper with the correct args', () => {
      const appAuth = new AppAuth(config);
      appAuth.refresh(refreshToken, scopes);
      expect(mockRefresh).toHaveBeenCalledWith(
        config.issuer,
        config.redirectUrl,
        config.clientId,
        refreshToken,
        scopes
      );
    });
  });
});
