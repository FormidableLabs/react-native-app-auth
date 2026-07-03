import { getRedirectUrlScheme } from '../index';

describe('getRedirectUrlScheme', () => {
  it('extracts a scheme from single-slash AppAuth redirect URLs', () => {
    expect(getRedirectUrlScheme('io.identityserver.demo:/oauthredirect')).toBe('io.identityserver.demo');
  });

  it('extracts a scheme from double-slash redirect URLs', () => {
    expect(getRedirectUrlScheme('rnaa-demo://oauthredirect')).toBe('rnaa-demo');
  });
});
