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

    it('throws an error when issuer is not defined', () => {
      expect(() => {
        new AppAuth({ ...config, issuer: undefined }); // eslint-disable-line no-new
      }).toThrow('Config error: issuer must be defined');
    });

    it('throws an error when redirect url is not defined', () => {
      expect(() => {
        new AppAuth({ ...config, redirectUrl: undefined }); // eslint-disable-line no-new
      }).toThrow('Config error: redirect url must be defined');
    });

    it('throws an error when client id is not defined', () => {
      expect(() => {
        new AppAuth({ ...config, clientId: undefined }); // eslint-disable-line no-new
      }).toThrow('Config error: client id must be defined');
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

    it('calls the native wrapper with the offline scope when allowOfflineAccess is applied', () => {
      const appAuth = new AppAuth({ ...config, allowOfflineAccess: true });
      appAuth.authorize(scopes);
      expect(mockAuthorize).toHaveBeenCalledWith(
        config.issuer,
        config.redirectUrl,
        config.clientId,
        [...scopes, 'offline_access']
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

    it('calls the native wrapper with the offline scope when allowOfflineAccess is applied', () => {
      const appAuth = new AppAuth({ ...config, allowOfflineAccess: true });
      appAuth.refresh(refreshToken, scopes);
      expect(mockRefresh).toHaveBeenCalledWith(
        config.issuer,
        config.redirectUrl,
        config.clientId,
        refreshToken,
        [...scopes, 'offline_access']
      );
    });
  });
});
