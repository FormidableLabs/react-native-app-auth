import * as os from 'os';
import withAppAuth, { getRedirectUrlScheme } from '../index';

describe('getRedirectUrlScheme', () => {
  it('extracts a scheme from single-slash AppAuth redirect URLs', () => {
    expect(getRedirectUrlScheme('io.identityserver.demo:/oauthredirect')).toBe('io.identityserver.demo');
  });

  it('extracts a scheme from double-slash redirect URLs', () => {
    expect(getRedirectUrlScheme('rnaa-demo://oauthredirect')).toBe('rnaa-demo');
  });
});

describe('withAppAuth on iOS', () => {
  it.each(['57.0.0', '58.0.0'])(
    'leaves the AppDelegate and the Xcode project to the Expo AppDelegate subscriber on SDK %s',
    sdkVersion => {
      const config = withAppAuth(
        { name: 'Example', slug: 'example', sdkVersion, _internal: { projectRoot: os.tmpdir() } },
        { redirectUrls: ['com.example:/oauthredirect'] }
      );

      expect(Object.keys(config.mods?.ios ?? {}).sort()).toEqual(['infoPlist']);
    }
  );
});
