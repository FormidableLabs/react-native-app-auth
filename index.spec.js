import AppAuth from './';

describe('AppAuth', () => {
  describe('when initialising a new instance', () => {
    const config = {
      issuer: 'test-issuer',
      redirectUrl: 'test-redirectUrl',
      clientId: 'test-clientId'
    };

    it('saves the config correctly', () => {
      const appAuth = new AppAuth(config);
      expect(appAuth.getConfig()).toEqual(config);
    });
  });
});
