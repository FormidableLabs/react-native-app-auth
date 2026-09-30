import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  MIN_EXPO_SDK_MAJOR_VERSION,
  assertSupportedExpoSdk,
  isSupportedExpoSdk,
} from './plugin/src/expo-version';
import { getRedirectUrlScheme } from './plugin/src/index';
import { applyAppAuthRedirectSchemeManifestPlaceholder } from './plugin/src/android/app-build-gradle';
import { applyAppAuthActivityResultPatch } from './plugin/src/android/main-activity';
import { applyExpoAppDelegatePatch } from './plugin/src/ios/app-delegate';
import {
  createXcodeBridgingHeaderBuildSetting,
  ensureBridgingHeaderImport,
  ensureXcodeBridgingHeaderBuildSetting,
  findBridgingHeader,
} from './plugin/src/ios/bridging-header';
import { addUrlScheme } from './plugin/src/ios/info-plist';
import { insertProtocolDeclaration } from './plugin/src/ios/utils/insert-protocol-declaration';

const createExpoAppDelegateFixture = (classDeclaration = 'class AppDelegate: ExpoAppDelegate') =>
  `import Expo
import React
import ReactAppDependencyProvider

${classDeclaration} {
  var window: UIWindow?
  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  public override func application(
    _ app: UIApplication,
    open url: URL,
    options: [UIApplication.OpenURLOptionsKey: Any] = [:]
  ) -> Bool {
    return super.application(app, open: url, options: options) || RCTLinkingManager.application(app, open: url, options: options)
  }

  public override func application(
    _ application: UIApplication,
    continue userActivity: NSUserActivity,
    restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void
  ) -> Bool {
    let result = RCTLinkingManager.application(application, continue: userActivity, restorationHandler: restorationHandler)
    return super.application(application, continue: userActivity, restorationHandler: restorationHandler) || result
  }
}`;

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

  it('requires explicit integration when an activity already overrides result handling', () => {
    expect(() => applyAppAuthActivityResultPatch(`package com.example
class MainActivity : ReactActivity() {
  override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {}
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

  it('patches supported Expo Swift AppDelegate class declarations idempotently', () => {
    [
      'class AppDelegate: ExpoAppDelegate',
      'public class AppDelegate: ExpoAppDelegate',
      'public class AppDelegate : ExpoAppDelegate',
    ].forEach(classDeclaration => {
      const patched = applyExpoAppDelegatePatch(createExpoAppDelegateFixture(classDeclaration));

      expect(patched).toMatch(
        /class AppDelegate\s*:\s*ExpoAppDelegate,\s*RNAppAuthAuthorizationFlowManager/
      );
      expect(patched).toContain(
        'public weak var authorizationFlowManagerDelegate: RNAppAuthAuthorizationFlowManagerDelegate?'
      );
      expect(patched).toContain(
        'authorizationFlowManagerDelegate.resumeExternalUserAgentFlow(with: url)'
      );
      expect(patched).toContain(
        'authorizationFlowManagerDelegate.resumeExternalUserAgentFlow(with: webpageURL)'
      );
      expect(applyExpoAppDelegatePatch(patched)).toBe(patched);
      expect(countOccurrences(patched, 'RNAppAuthAuthorizationFlowManager')).toBe(2);
      expect(countOccurrences(patched, 'resumeExternalUserAgentFlow(with: url)')).toBe(1);
    });
  });

  it('fails when the Expo AppDelegate has no universal-link callback to resume', () => {
    const withoutUserActivity = createExpoAppDelegateFixture().replace(
      /public override func application\(\s*_ application: UIApplication,\s*continue userActivity:[\s\S]*$/,
      '}'
    );

    expect(() => applyExpoAppDelegatePatch(withoutUserActivity)).toThrow(
      'application(_:continue:restorationHandler:)'
    );
  });

  it('patches a scene-enabled Expo AppDelegate without dropping factory provider conformance', () => {
    const sceneDelegate = createExpoAppDelegateFixture(
      'class AppDelegate: ExpoAppDelegate, ExpoReactNativeFactoryProvider'
    );
    const patched = applyExpoAppDelegatePatch(sceneDelegate);

    expect(patched).toContain(
      'class AppDelegate: ExpoAppDelegate, ExpoReactNativeFactoryProvider, RNAppAuthAuthorizationFlowManager'
    );
    expect(patched).toContain('resumeExternalUserAgentFlow(with: url)');
    expect(applyExpoAppDelegatePatch(patched)).toBe(patched);
  });

  it('inserts AppAuth URL handling before existing custom Swift open URL handling', () => {
    const customOpenUrlFixture = createExpoAppDelegateFixture().replace(
      'return super.application(app, open: url, options: options) || RCTLinkingManager.application(app, open: url, options: options)',
      `if url.scheme == "custom" {
      return true
    }

    return super.application(app, open: url, options: options)`
    );
    const patched = applyExpoAppDelegatePatch(customOpenUrlFixture);

    expect(patched.indexOf('resumeExternalUserAgentFlow(with: url)')).toBeLessThan(
      patched.indexOf('if url.scheme == "custom"')
    );
    expect(applyExpoAppDelegatePatch(patched)).toBe(patched);
  });

  it('adds the ObjC AppDelegate protocol declaration idempotently for legacy helper coverage', () => {
    const source = '@interface AppDelegate : EXAppDelegateWrapper <UIApplicationDelegate>';
    const patched = insertProtocolDeclaration({
      source,
      interfaceName: 'AppDelegate',
      protocolName: 'RNAppAuthAuthorizationFlowManager',
      baseClassName: 'EXAppDelegateWrapper',
    });

    expect(patched).toBe(
      '@interface AppDelegate : EXAppDelegateWrapper <UIApplicationDelegate,RNAppAuthAuthorizationFlowManager>'
    );
    expect(
      insertProtocolDeclaration({
        source: patched,
        interfaceName: 'AppDelegate',
        protocolName: 'RNAppAuthAuthorizationFlowManager',
        baseClassName: 'EXAppDelegateWrapper',
      })
    ).toBe(patched);
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

  it('adds and merges Android manifestPlaceholders idempotently', () => {
    const appBuildGradle = `android {
    defaultConfig {
        applicationId "com.example"
    }
}`;
    const patched = applyAppAuthRedirectSchemeManifestPlaceholder(appBuildGradle, 'com.example');

    expect(patched).toContain("appAuthRedirectScheme: 'com.example'");
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
    expect(merged).toContain("appAuthRedirectScheme: 'com.example'");
    expect(countOccurrences(merged, 'appAuthRedirectScheme')).toBe(1);
    expect(applyAppAuthRedirectSchemeManifestPlaceholder(merged, 'com.example')).toBe(merged);
  });

  it('updates an existing Android appAuthRedirectScheme placeholder instead of duplicating it', () => {
    const appBuildGradle = `android {
    defaultConfig {
        manifestPlaceholders = [appAuthRedirectScheme: 'old.scheme', other: 'value']
    }
}`;
    const patched = applyAppAuthRedirectSchemeManifestPlaceholder(appBuildGradle, 'new.scheme');

    expect(patched).toContain("appAuthRedirectScheme: 'new.scheme'");
    expect(patched).not.toContain('old.scheme');
    expect(countOccurrences(patched, 'appAuthRedirectScheme')).toBe(1);
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
      expect(patched.slice(patched.indexOf('defaultConfig'))).toContain("appAuthRedirectScheme: 'com.example'");
      if (defaults) expect(patched).toContain(defaults.slice(0, -1));
      expect(applyAppAuthRedirectSchemeManifestPlaceholder(patched, 'com.example')).toBe(patched);
    }
  );

  it('discovers existing Swift bridging headers recursively without choosing arbitrary headers', () => {
    const iosRoot = path.join(tempDir, 'ios');
    const appDir = path.join(iosRoot, 'ExpoCng');
    fs.mkdirSync(appDir, { recursive: true });
    fs.writeFileSync(path.join(iosRoot, 'AppDelegate.h'), '@interface AppDelegate\n');
    const bridgingHeaderPath = path.join(appDir, 'ExpoCng-Bridging-Header.h');
    fs.writeFileSync(bridgingHeaderPath, '#import "Existing.h"\n');

    expect(findBridgingHeader(iosRoot)).toBe(bridgingHeaderPath);
  });

  it('adds the bridging header import idempotently', () => {
    const contents = '#import "Existing.h"\n';
    const patched = ensureBridgingHeaderImport(contents);

    expect(patched).toBe('#import "RNAppAuthAuthorizationFlowManager.h"\n#import "Existing.h"\n');
    expect(ensureBridgingHeaderImport(patched)).toBe(patched);
  });

  it('sets the Xcode bridging header build setting only when missing', () => {
    const addedBuildSettings: Record<string, string> = {};
    const project = {
      getBuildProperty: (name: string, target: string) => addedBuildSettings[`${target}:${name}`],
      addBuildProperty: (name: string, value: string, target: string) => {
        addedBuildSettings[`${target}:${name}`] = value;
      },
    };

    expect(createXcodeBridgingHeaderBuildSetting('ExpoCng/ExpoCng-Bridging-Header.h')).toBe(
      '$(SRCROOT)/ExpoCng/ExpoCng-Bridging-Header.h'
    );
    expect(
      ensureXcodeBridgingHeaderBuildSetting(
        project,
        'TARGET',
        'ExpoCng/ExpoCng-Bridging-Header.h'
      )
    ).toBe(true);
    expect(
      ensureXcodeBridgingHeaderBuildSetting(
        project,
        'TARGET',
        'ExpoCng/ExpoCng-Bridging-Header.h'
      )
    ).toBe(false);
    expect(addedBuildSettings['TARGET:SWIFT_OBJC_BRIDGING_HEADER']).toBe(
      '$(SRCROOT)/ExpoCng/ExpoCng-Bridging-Header.h'
    );
  });
});
