import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { compileModsAsync, withMod } from '@expo/config-plugins';
import plist from '@expo/plist';
import {
  MIN_EXPO_SDK_MAJOR_VERSION,
  assertSupportedExpoSdk,
  isSupportedExpoSdk,
} from './plugin/src/expo-version';
import withAppAuth, { getRedirectUrlScheme } from './plugin/src/index';
import { applyAppAuthRedirectSchemeManifestPlaceholder } from './plugin/src/android/app-build-gradle';
import { applyAppAuthActivityResultPatch } from './plugin/src/android/main-activity';
import { addUrlScheme, withUrlSchemes } from './plugin/src/ios/info-plist';

const countOccurrences = (source: string, pattern: string): number =>
  source.split(pattern).length - 1;

const writePackageJson = (projectRoot: string, expoVersion: string) => {
  fs.writeFileSync(
    path.join(projectRoot, 'package.json'),
    JSON.stringify({
      dependencies: {
        expo: expoVersion,
      },
    })
  );
};

describe('Expo config plugin fixture coverage', () => {
  it('forwards Android authorization results before React Native handles them', () => {
    const source = `package com.example
import com.facebook.react.ReactActivity
class MainActivity : ReactActivity() {
  override fun getMainComponentName(): String = "main"
}
`;
    const patched = applyAppAuthActivityResultPatch(source);
    expect(patched).toContain('import android.content.Intent');
    expect(patched).toContain('import com.rnappauth.RNAppAuthModule');
    expect(patched.indexOf('stashAuthorizationResult(data)')).toBeLessThan(patched.indexOf('super.onActivityResult'));
    expect(applyAppAuthActivityResultPatch(patched)).toBe(patched);
  });

  it.each([
    'fun onActivityResult',
    'fun  onActivityResult',
    'fun\tonActivityResult',
    'fun\nonActivityResult',
    'fun /* existing handler */ onActivityResult',
    'fun /* outer /* nested */ comment */ onActivityResult',
    'fun `onActivityResult`',
  ])('requires explicit integration for an existing callback: %s', declaration => {
    expect(() => applyAppAuthActivityResultPatch(`package com.example
class MainActivity : ReactActivity() {
  override ${declaration}(requestCode: Int, resultCode: Int, data: Intent?) {}
}
`)).toThrow('existing onActivityResult');
  });

  it.each([
    '// fun onActivityResult(...) {}',
    '/* fun onActivityResult(...) {} */',
    '/* outer /* nested */ fun onActivityResult(...) {} */',
    'val example = "fun onActivityResult(...) {}"',
    'val example = """fun onActivityResult(...) {}"""',
    '// RNAppAuthModule.stashAuthorizationResult(data)',
    '/* RNAppAuthModule.stashAuthorizationResult(data) */',
    'val example = "RNAppAuthModule.stashAuthorizationResult(data)"',
    'val example = """RNAppAuthModule.stashAuthorizationResult(data)"""',
  ])('ignores Kotlin comments and strings when detecting result handling: %s', snippet => {
    const source = `package com.example
import com.facebook.react.ReactActivity
class MainActivity : ReactActivity() {
  ${snippet}
}
`;
    const patched = applyAppAuthActivityResultPatch(source);
    expect(patched).toContain(snippet);
    expect(patched).toContain('override fun onActivityResult(requestCode: Int');
    expect(applyAppAuthActivityResultPatch(patched)).toBe(patched);
  });

  it.each([
    'RNAppAuthModule . stashAuthorizationResult ( data )',
    'RNAppAuthModule\n. stashAuthorizationResult(\ndata\n)',
    'RNAppAuthModule/* preserve */.stashAuthorizationResult(data)',
  ])('preserves an already integrated callback with formatted forwarding: %s', forwarding => {
    const source = `package com.example
class MainActivity : ReactActivity() {
  override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
    if (requestCode == RNAppAuthModule.AUTHORIZATION_REQUEST_CODE) {
      ${forwarding}
    }
    super.onActivityResult(requestCode, resultCode, data)
  }
}
`;
    expect(applyAppAuthActivityResultPatch(source)).toBe(source);
  });

  it('does not treat commented-out forwarding as an integrated callback', () => {
    expect(() => applyAppAuthActivityResultPatch(`package com.example
class MainActivity : ReactActivity() {
  override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
    // RNAppAuthModule.stashAuthorizationResult(data)
    super.onActivityResult(requestCode, resultCode, data)
  }
}
`)).toThrow('existing onActivityResult');
  });

  it.each([
    'import android.content.Intent',
    'import com.rnappauth.RNAppAuthModule',
    'import android.content.Intent\nimport com.rnappauth.RNAppAuthModule',
    'import android.content.Intent // Used by onNewIntent\nimport com.rnappauth.RNAppAuthModule;',
  ])('preserves existing Kotlin imports: %s', imports => {
    const source = `package com.example
${imports}
import com.facebook.react.ReactActivity
class MainActivity : ReactActivity() {
  override fun onNewIntent(intent: android.content.Intent) { super.onNewIntent(intent) }
}
`;
    const patched = applyAppAuthActivityResultPatch(source);
    expect(countOccurrences(patched, 'import android.content.Intent')).toBe(1);
    expect(countOccurrences(patched, 'import com.rnappauth.RNAppAuthModule')).toBe(1);
    expect(patched).toContain('override fun onNewIntent');
    expect(patched).toContain('override fun onActivityResult');
    expect(applyAppAuthActivityResultPatch(patched)).toBe(patched);
  });
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rnaa-plugin-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('branches on Expo SDK 57 and later, including package dependency inference', () => {
    expect(MIN_EXPO_SDK_MAJOR_VERSION).toBe(57);
    expect(isSupportedExpoSdk({ sdkVersion: '56.0.0' })).toBe(false);
    expect(isSupportedExpoSdk({ sdkVersion: '57.0.0' })).toBe(true);
    expect(isSupportedExpoSdk({ sdkVersion: '58.0.0' })).toBe(true);
    expect(isSupportedExpoSdk({})).toBe(false);

    writePackageJson(tempDir, '~57.0.24');
    expect(isSupportedExpoSdk({}, tempDir)).toBe(true);

    writePackageJson(tempDir, '~58.0.19');
    expect(isSupportedExpoSdk({}, tempDir)).toBe(true);

    writePackageJson(tempDir, '~56.0.0');
    expect(isSupportedExpoSdk({}, tempDir)).toBe(false);
    expect(() => assertSupportedExpoSdk({}, tempDir)).toThrow(
      'react-native-app-auth config plugin requires Expo SDK 57 or later'
    );
  });

  it('extracts URL schemes from OAuth redirects with one or two slashes', () => {
    expect(getRedirectUrlScheme('com.example:/oauthredirect')).toBe('com.example');
    expect(getRedirectUrlScheme('com.example://oauthredirect')).toBe('com.example');
    expect(getRedirectUrlScheme('com.example')).toBe('com.example');
    expect(getRedirectUrlScheme()).toBeUndefined();
  });

  it('adds iOS URL schemes without duplicating existing entries', () => {
    const infoPlist = addUrlScheme({}, 'com.example');
    addUrlScheme(infoPlist, 'com.example');
    addUrlScheme(infoPlist, 'com.example.secondary');

    expect(infoPlist.CFBundleURLTypes).toEqual([
      {
        CFBundleURLName: '$(PRODUCT_BUNDLE_IDENTIFIER)',
        CFBundleURLSchemes: ['com.example'],
      },
      {
        CFBundleURLName: '$(PRODUCT_BUNDLE_IDENTIFIER)',
        CFBundleURLSchemes: ['com.example.secondary'],
      },
    ]);
  });

  it.each([undefined, { infoPlist: { CFBundleDisplayName: 'Raw config' } }])(
    'adds the OAuth scheme to modResults independently of raw iOS config: %j',
    async ios => {
      const config = withAppAuth({ name: 'Example', slug: 'example', sdkVersion: '57.0.0', ios, _internal: { projectRoot: tempDir } }, {
        redirectUrls: ['com.example.auth:/callback'],
      });
      const nativePlist = {
        CFBundleDisplayName: 'Native app',
        CFBundleURLTypes: [{ CFBundleURLName: 'existing', CFBundleURLSchemes: ['com.example.existing'] }],
      };
      const result = await config.mods!.ios!.infoPlist!({
        ...config,
        modResults: nativePlist,
        modRequest: { projectRoot: tempDir, platformProjectRoot: path.join(tempDir, 'ios'), platform: 'ios', modName: 'infoPlist' },
      } as any);
      expect(result.modResults.CFBundleDisplayName).toBe('Native app');
      expect(result.modResults.CFBundleURLTypes).toEqual([
        { CFBundleURLName: 'existing', CFBundleURLSchemes: ['com.example.existing'] },
        { CFBundleURLName: '$(PRODUCT_BUNDLE_IDENTIFIER)', CFBundleURLSchemes: ['com.example.auth'] },
      ]);
      expect(result.ios!.infoPlist).toBe(result.modResults);
      const repeated = await config.mods!.ios!.infoPlist!(result);
      expect(repeated.modResults.CFBundleURLTypes).toHaveLength(2);
    }
  );

  it('leaves the native plist unchanged when no OAuth URL scheme is configured', async () => {
    const config = withUrlSchemes({ name: 'Example', slug: 'example' }, {});
    const nativePlist = { CFBundleDisplayName: 'Native app' };
    const result = await config.mods!.ios!.infoPlist!({
      ...config,
      modResults: nativePlist,
      modRequest: { projectRoot: tempDir, platformProjectRoot: path.join(tempDir, 'ios'), platform: 'ios', modName: 'infoPlist' },
    } as any);
    expect(result.modResults).toBe(nativePlist);
    expect(result.modResults).toEqual({ CFBundleDisplayName: 'Native app' });
  });

  it.each([false, true])('writes the OAuth scheme to disk when another mod replaces the plist: %s', async replacePlist => {
    const plistPath = path.join(tempDir, 'ios', 'Example', 'Info.plist');
    fs.mkdirSync(path.dirname(plistPath), { recursive: true });
    fs.writeFileSync(plistPath, plist.build({
      CFBundleDisplayName: 'Native app',
      CFBundleURLTypes: [{ CFBundleURLName: 'existing', CFBundleURLSchemes: ['com.example.existing'] }],
    }));
    let config = withUrlSchemes({ name: 'Example', slug: 'example' }, { ios: { urlScheme: 'com.example.auth' } });
    if (replacePlist) {
      // A mod may return a new plist object rather than mutate the provider's object.
      config = withMod(config, {
        platform: 'ios',
        mod: 'infoPlist',
        action: cfg => {
          cfg.modResults = { ...JSON.parse(JSON.stringify(cfg.modResults)), OtherPluginValue: 'preserved' };
          return cfg;
        },
      });
    }
    await compileModsAsync(config, { projectRoot: tempDir, platforms: ['ios'] });
    const first = plist.parse(fs.readFileSync(plistPath, 'utf8')) as any;
    expect(first.CFBundleURLTypes).toEqual([
      { CFBundleURLName: 'existing', CFBundleURLSchemes: ['com.example.existing'] },
      { CFBundleURLName: '$(PRODUCT_BUNDLE_IDENTIFIER)', CFBundleURLSchemes: ['com.example.auth'] },
    ]);
    expect(first.CFBundleDisplayName).toBe('Native app');
    if (replacePlist) expect(first.OtherPluginValue).toBe('preserved');
    await compileModsAsync(withUrlSchemes({ name: 'Example', slug: 'example' }, { ios: { urlScheme: 'com.example.auth' } }), { projectRoot: tempDir, platforms: ['ios'] });
    expect(plist.parse(fs.readFileSync(plistPath, 'utf8'))).toEqual(first);
  });

  it('adds and merges Android manifestPlaceholders idempotently', () => {
    const appBuildGradle = `android {
    defaultConfig {
        applicationId "com.example"
    }
}`;
    const patched = applyAppAuthRedirectSchemeManifestPlaceholder(appBuildGradle, 'com.example');

    expect(patched).toContain("manifestPlaceholders.appAuthRedirectScheme = 'com.example'");
    expect(applyAppAuthRedirectSchemeManifestPlaceholder(patched, 'com.example')).toBe(patched);

    const existingPlaceholders = `android {
    defaultConfig {
        manifestPlaceholders = [
            otherScheme: 'other',
        ]
    }
}`;
    const merged = applyAppAuthRedirectSchemeManifestPlaceholder(
      existingPlaceholders,
      'com.example'
    );

    expect(merged).toContain("otherScheme: 'other'");
    expect(merged).toContain("manifestPlaceholders.appAuthRedirectScheme = 'com.example'");
    expect(countOccurrences(merged, 'appAuthRedirectScheme')).toBe(1);
    expect(applyAppAuthRedirectSchemeManifestPlaceholder(merged, 'com.example')).toBe(merged);
  });

  it.each([
    'manifestPlaceholders = [:]',
    "manifestPlaceholders += [other: 'keep']",
    "manifestPlaceholders = [appAuthRedirectScheme: oldScheme, other: 'keep']",
    'manifestPlaceholders = project.ext.nativeManifestPlaceholders',
    "manifestPlaceholders = [other: 'keep']; manifestPlaceholders += [extra: 'also-keep', appAuthRedirectScheme: oldScheme]",
    'manifestPlaceholders.appAuthRedirectScheme = oldScheme',
  ])('preserves existing Gradle configuration and sets the redirect afterward: %s', declaration => {
    const source = `android {
    defaultConfig {
        ${declaration}
    }
}`;
    const patched = applyAppAuthRedirectSchemeManifestPlaceholder(source, 'new.scheme');
    const assignment = "manifestPlaceholders.appAuthRedirectScheme = 'new.scheme'";

    expect(patched).toContain(declaration);
    expect(patched.indexOf(assignment)).toBeGreaterThan(patched.indexOf(declaration));
    expect(applyAppAuthRedirectSchemeManifestPlaceholder(patched, 'new.scheme')).toBe(patched);
    const updated = applyAppAuthRedirectSchemeManifestPlaceholder(patched, 'newer.scheme');
    expect(updated).toContain(declaration);
    expect(updated).toContain("manifestPlaceholders.appAuthRedirectScheme = 'newer.scheme'");
    expect(countOccurrences(updated, "manifestPlaceholders.appAuthRedirectScheme = 'newer.scheme'")).toBe(1);
  });

  it('preserves an existing map and overrides only its redirect scheme afterward', () => {
    const appBuildGradle = `android {
    defaultConfig {
        manifestPlaceholders = [appAuthRedirectScheme: 'old.scheme', other: 'value']
    }
}`;
    const patched = applyAppAuthRedirectSchemeManifestPlaceholder(appBuildGradle, 'new.scheme');

    expect(patched).toContain("[appAuthRedirectScheme: 'old.scheme', other: 'value']");
    expect(patched).toContain("manifestPlaceholders.appAuthRedirectScheme = 'new.scheme'");
    expect(applyAppAuthRedirectSchemeManifestPlaceholder(patched, 'new.scheme')).toBe(patched);
  });

  it.each(['', "manifestPlaceholders = [other: 'default-value']"])(
    'configures all variants without modifying build-type placeholders: %s',
    defaults => {
      const debugBlock = `buildTypes {
        debug {
            manifestPlaceholders = [debugOnly: 'debug-value']
        }
    }`;
      const source = `android {
    ${debugBlock}
    defaultConfig {
        ${defaults}
    }
}`;
      const patched = applyAppAuthRedirectSchemeManifestPlaceholder(source, 'com.example');
      expect(patched).toContain(debugBlock);
      expect(patched.slice(patched.indexOf('defaultConfig'))).toContain("manifestPlaceholders.appAuthRedirectScheme = 'com.example'");
      if (defaults) expect(patched).toContain("other: 'default-value'");
      expect(applyAppAuthRedirectSchemeManifestPlaceholder(patched, 'com.example')).toBe(patched);
    }
  );

  it.each([
    "otherScheme: 'other' // keep this comment",
    "otherScheme: 'other', // keep this comma and comment",
    "otherScheme: 'other' /* keep this block comment */",
    "otherScheme: 'other'\n            // keep this trailing comment",
    "otherScheme: 'https://fixture.example/path' // keep URL and comment",
    "// comment-only map",
  ])('preserves commented Gradle map entries: %s', entries => {
    const source = `android {
    defaultConfig {
        manifestPlaceholders = [
            ${entries}
        ]
    }
}`;
    const patched = applyAppAuthRedirectSchemeManifestPlaceholder(source, 'com.example');
    expect(patched).toContain(`[\n            ${entries}\n        ]`);
    expect(patched).toContain("manifestPlaceholders.appAuthRedirectScheme = 'com.example'");
    expect(applyAppAuthRedirectSchemeManifestPlaceholder(patched, 'com.example')).toBe(patched);
  });

  it('preserves inline block comments in Gradle map entries', () => {
    const source = "android { defaultConfig { manifestPlaceholders = [other: 'value' /* keep */] } }";
    const patched = applyAppAuthRedirectSchemeManifestPlaceholder(source, 'com.example');
    expect(patched).toContain("[other: 'value' /* keep */]");
    expect(patched).toContain("manifestPlaceholders.appAuthRedirectScheme = 'com.example'");
    expect(applyAppAuthRedirectSchemeManifestPlaceholder(patched, 'com.example')).toBe(patched);
  });

  it.each([
    "// appAuthRedirectScheme: 'old'",
    "/* appAuthRedirectScheme: 'old' */",
    "// manifestPlaceholders = [other: 'value']",
    "/* manifestPlaceholders = [other: 'value'] */",
  ])('ignores commented-out redirect configuration: %s', comment => {
    const source = `android {
    defaultConfig {
        ${comment}
    }
}`;
    const patched = applyAppAuthRedirectSchemeManifestPlaceholder(source, 'com.example');
    expect(patched).toContain(comment);
    expect(patched).toContain("manifestPlaceholders.appAuthRedirectScheme = 'com.example'");
    expect(applyAppAuthRedirectSchemeManifestPlaceholder(patched, 'com.example')).toBe(patched);
  });

  it.each([
    "// appAuthRedirectScheme: 'old'",
    "/* appAuthRedirectScheme: 'old' ] */",
  ])('ignores commented-out keys inside an active placeholder map: %s', comment => {
    const source = `android {
    defaultConfig {
        manifestPlaceholders = [
            ${comment}
            other: 'https://fixture.example/path',
        ]
    }
}`;
    const patched = applyAppAuthRedirectSchemeManifestPlaceholder(source, 'com.example');
    expect(patched).toContain(comment);
    expect(patched).toContain("manifestPlaceholders.appAuthRedirectScheme = 'com.example'");
    expect(patched).toContain("other: 'https://fixture.example/path',");
    expect(applyAppAuthRedirectSchemeManifestPlaceholder(patched, 'com.example')).toBe(patched);
  });

  it('preserves quoted map keys, commented keys and string contents', () => {
    const source = `android {
    defaultConfig {
        // manifestPlaceholders = [appAuthRedirectScheme: 'unused']
        manifestPlaceholders = [
            // appAuthRedirectScheme: 'old-comment'
            "appAuthRedirectScheme": 'old-active',
            other: 'a ] bracket // and /* literal */',
        ]
    }
}`;
    const patched = applyAppAuthRedirectSchemeManifestPlaceholder(source, 'com.example');
    expect(patched).toContain("// manifestPlaceholders = [appAuthRedirectScheme: 'unused']");
    expect(patched).toContain("// appAuthRedirectScheme: 'old-comment'");
    expect(patched).toContain(`"appAuthRedirectScheme": 'old-active'`);
    expect(patched).toContain("manifestPlaceholders.appAuthRedirectScheme = 'com.example'");
    expect(patched).toContain("other: 'a ] bracket // and /* literal */'");
    expect(applyAppAuthRedirectSchemeManifestPlaceholder(patched, 'com.example')).toBe(patched);
  });

  it('updates a final redirect assignment while preserving trailing comments', () => {
    const source = `android {
    defaultConfig {
        manifestPlaceholders += [other: 'keep']
        manifestPlaceholders.appAuthRedirectScheme = "old.scheme"; // keep inline comment
        /* keep trailing comment */
    }
}`;
    const patched = applyAppAuthRedirectSchemeManifestPlaceholder(source, 'new.scheme');

    expect(patched).toContain("manifestPlaceholders += [other: 'keep']");
    expect(patched).toContain("manifestPlaceholders.appAuthRedirectScheme = 'new.scheme'; // keep inline comment");
    expect(patched).toContain('/* keep trailing comment */');
    expect(countOccurrences(patched, 'manifestPlaceholders.appAuthRedirectScheme')).toBe(1);
    expect(applyAppAuthRedirectSchemeManifestPlaceholder(patched, 'new.scheme')).toBe(patched);
  });

  it('places the redirect after an earlier assignment that a later map overrides', () => {
    const declaration = `manifestPlaceholders.appAuthRedirectScheme = 'early.scheme'
        manifestPlaceholders = [other: 'keep']`;
    const source = `android { defaultConfig {
        ${declaration}
    } }`;
    const patched = applyAppAuthRedirectSchemeManifestPlaceholder(source, 'new.scheme');

    expect(patched).toContain(declaration);
    expect(patched.lastIndexOf("manifestPlaceholders.appAuthRedirectScheme = 'new.scheme'"))
      .toBeGreaterThan(patched.indexOf("manifestPlaceholders = [other: 'keep']"));
    expect(applyAppAuthRedirectSchemeManifestPlaceholder(patched, 'new.scheme')).toBe(patched);
  });

  it.each([
    "// manifestPlaceholders.appAuthRedirectScheme = 'unused'",
    "/* manifestPlaceholders.appAuthRedirectScheme = 'unused' */",
    "def example = \"manifestPlaceholders.appAuthRedirectScheme = 'unused'\"",
    "def nested = [manifestPlaceholders: [:]]; nested.manifestPlaceholders.appAuthRedirectScheme = 'unused'",
    "def example = (manifestPlaceholders.appAuthRedirectScheme = 'unused')",
  ])('ignores inactive property assignments: %s', declaration => {
    const source = `android { defaultConfig {\n    ${declaration}\n} }`;
    const patched = applyAppAuthRedirectSchemeManifestPlaceholder(source, 'new.scheme');
    expect(patched).toContain(declaration);
    expect(patched).toContain("manifestPlaceholders.appAuthRedirectScheme = 'new.scheme'");
    expect(applyAppAuthRedirectSchemeManifestPlaceholder(patched, 'new.scheme')).toBe(patched);
  });

  it('preserves Windows line endings when setting the redirect scheme', () => {
    const source = 'android {\r\n    defaultConfig {\r\n        manifestPlaceholders = [:]\r\n    }\r\n}';
    const patched = applyAppAuthRedirectSchemeManifestPlaceholder(source, 'new.scheme');
    expect(patched.replace(/\r\n/g, '')).not.toContain('\n');
    expect(applyAppAuthRedirectSchemeManifestPlaceholder(patched, 'new.scheme')).toBe(patched);
  });
});

