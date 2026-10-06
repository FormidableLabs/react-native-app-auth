import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  MIN_EXPO_SDK_MAJOR_VERSION,
  assertSupportedExpoSdk,
  isSupportedExpoSdk,
} from './plugin/src/expo-version';
import withAppAuth, { getRedirectUrlScheme } from './plugin/src/index';
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

const createXcodeProjectFixture = () => {
  const project = require('xcode').project(
    path.join(__dirname, '../../examples/demo/ios/Example.xcodeproj/project.pbxproj')
  );
  project.parseSync();
  project.removeBuildProperty('SWIFT_OBJC_BRIDGING_HEADER');
  return project;
};

const applyBridgingHeaderMod = async (project: any, projectRoot: string) => {
  let config = withAppAuth({
    name: 'Example',
    slug: 'example',
    sdkVersion: '57.0.0',
    _internal: { projectRoot },
  }, {});
  if (config.mods?.ios?.dangerous) {
    config = await config.mods.ios.dangerous({
      ...config,
      modRequest: { projectRoot, platformProjectRoot: path.join(projectRoot, 'ios'), platform: 'ios', modName: 'dangerous' },
    } as any);
  }
  return config.mods!.ios!.xcodeproj!({
    ...config,
    modResults: project,
    modRequest: { projectRoot, platformProjectRoot: path.join(projectRoot, 'ios'), platform: 'ios', modName: 'xcodeproj' },
  } as any);
};

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

  it('sets missing Xcode build settings on the app target without changing project settings', () => {
    const project = createXcodeProjectFixture();
    const target = project.getFirstTarget().uuid;
    const targetList = project.pbxXCConfigurationList()[project.getFirstTarget().firstTarget.buildConfigurationList];
    const projectSettingsBefore = project.getFirstProject().firstProject.buildConfigurationList;
    const globalList = project.pbxXCConfigurationList()[projectSettingsBefore];
    const globalConfigs = globalList.buildConfigurations.map(({ value }: any) => project.pbxXCBuildConfigurationSection()[value]);

    expect(createXcodeBridgingHeaderBuildSetting('Example/CustomBridge.h')).toBe('$(SRCROOT)/Example/CustomBridge.h');
    expect(ensureXcodeBridgingHeaderBuildSetting(project, target, 'Example/CustomBridge.h')).toBe(true);
    for (const { value } of targetList.buildConfigurations) {
      expect(project.pbxXCBuildConfigurationSection()[value].buildSettings.SWIFT_OBJC_BRIDGING_HEADER)
        .toBe('$(SRCROOT)/Example/CustomBridge.h');
    }
    expect(globalConfigs.every((entry: any) => !entry.buildSettings.SWIFT_OBJC_BRIDGING_HEADER)).toBe(true);
    expect(ensureXcodeBridgingHeaderBuildSetting(project, target, 'Example/Other.h')).toBe(false);
    expect(ensureXcodeBridgingHeaderBuildSetting(project, target)).toBe(false);
  });

  it.each([
    'Example/CustomBridge.h',
    '"$(SRCROOT)/Example/CustomBridge.h"',
    '${PROJECT_DIR}/Example/CustomBridge.h',
    '$(PROJECT_NAME)/CustomBridge.h',
    '$(PRODUCT_NAME)/CustomBridge.h',
  ])('patches the configured custom header idempotently: %s', async setting => {
    const project = createXcodeProjectFixture();
    project.addBuildProperty('SWIFT_OBJC_BRIDGING_HEADER', setting);
    const headerPath = path.join(tempDir, 'ios', 'Example', 'CustomBridge.h');
    fs.mkdirSync(path.dirname(headerPath), { recursive: true });
    fs.writeFileSync(headerPath, '#import "Existing.h"\n');
    const unrelatedHeader = path.join(tempDir, 'ios', 'Other-Bridging-Header.h');
    fs.writeFileSync(unrelatedHeader, '// unrelated header\n');
    await applyBridgingHeaderMod(project, tempDir);
    const contents = fs.readFileSync(headerPath, 'utf8');
    expect(contents).toBe('#import "RNAppAuthAuthorizationFlowManager.h"\n#import "Existing.h"\n');
    expect(project.getBuildProperty('SWIFT_OBJC_BRIDGING_HEADER')).toBe(setting);
    expect(fs.readFileSync(unrelatedHeader, 'utf8')).toBe('// unrelated header\n');
    expect(fs.existsSync(path.join(tempDir, 'ios', 'AppDelegate+RNAppAuth.h'))).toBe(false);
    const serialized = project.writeSync();
    await applyBridgingHeaderMod(project, tempDir);
    expect(fs.readFileSync(headerPath, 'utf8')).toBe(contents);
    expect(project.writeSync()).toBe(serialized);
  });

  it('preserves inherited project settings and different headers for Debug and Release', async () => {
    const project = createXcodeProjectFixture();
    const section = project.pbxXCBuildConfigurationSection();
    const targetList = project.pbxXCConfigurationList()[project.getFirstTarget().firstTarget.buildConfigurationList];
    project.addBuildProperty('SWIFT_OBJC_BRIDGING_HEADER', 'Example/DebugBridge.h', 'Debug');
    for (const { value } of targetList.buildConfigurations) {
      const configuration = section[value];
      if (configuration.name === 'Debug') delete configuration.buildSettings.SWIFT_OBJC_BRIDGING_HEADER;
      else configuration.buildSettings.SWIFT_OBJC_BRIDGING_HEADER = 'Example/ReleaseBridge.h';
    }
    const headers = ['DebugBridge.h', 'ReleaseBridge.h'].map(name => path.join(tempDir, 'ios', 'Example', name));
    fs.mkdirSync(path.dirname(headers[0]), { recursive: true });
    for (const header of headers) fs.writeFileSync(header, '// existing content\n');
    const serialized = project.writeSync();
    await applyBridgingHeaderMod(project, tempDir);
    expect(project.writeSync()).toBe(serialized);
    for (const header of headers) {
      expect(fs.readFileSync(header, 'utf8')).toBe('#import "RNAppAuthAuthorizationFlowManager.h"\n// existing content\n');
    }
    await applyBridgingHeaderMod(project, tempDir);
    expect(project.writeSync()).toBe(serialized);
  });

  it.each(['$(inherited)', '"$(inherited)"', '${inherited}'])(
    'falls back when the inherited bridging header expands to empty: %s', async setting => {
      const project = createXcodeProjectFixture();
      const targetList = project.pbxXCConfigurationList()[project.getFirstTarget().firstTarget.buildConfigurationList];
      for (const { value } of targetList.buildConfigurations) {
        project.pbxXCBuildConfigurationSection()[value].buildSettings.SWIFT_OBJC_BRIDGING_HEADER = setting;
      }
      const iosRoot = path.join(tempDir, 'ios');
      fs.mkdirSync(iosRoot, { recursive: true });
      await applyBridgingHeaderMod(project, tempDir);
      const generated = path.join(iosRoot, 'AppDelegate+RNAppAuth.h');
      expect(fs.readFileSync(generated, 'utf8')).toBe('#import "RNAppAuthAuthorizationFlowManager.h"\n');
      expect(project.getBuildProperty('SWIFT_OBJC_BRIDGING_HEADER')).toBe('$(SRCROOT)/AppDelegate+RNAppAuth.h');
      const serialized = project.writeSync();
      await applyBridgingHeaderMod(project, tempDir);
      expect(project.writeSync()).toBe(serialized);
    }
  );

  it('discovers a header when inheritance is empty and preserves valid inherited headers', async () => {
    const project = createXcodeProjectFixture();
    const section = project.pbxXCBuildConfigurationSection();
    const targetList = project.pbxXCConfigurationList()[project.getFirstTarget().firstTarget.buildConfigurationList];
    project.addBuildProperty('SWIFT_OBJC_BRIDGING_HEADER', 'Example/InheritedBridge.h', 'Release');
    for (const { value } of targetList.buildConfigurations) {
      section[value].buildSettings.SWIFT_OBJC_BRIDGING_HEADER = '$(inherited)';
    }
    const inheritedHeader = path.join(tempDir, 'ios', 'Example', 'InheritedBridge.h');
    fs.mkdirSync(path.dirname(inheritedHeader), { recursive: true });
    fs.writeFileSync(inheritedHeader, '// existing header\n');
    await applyBridgingHeaderMod(project, tempDir);
    for (const { value } of targetList.buildConfigurations) {
      const configuration = section[value];
      expect(configuration.buildSettings.SWIFT_OBJC_BRIDGING_HEADER).toBe(
        configuration.name === 'Release' ? '$(inherited)' : '$(SRCROOT)/Example/InheritedBridge.h'
      );
    }
    expect(fs.readFileSync(inheritedHeader, 'utf8')).toContain('#import "RNAppAuthAuthorizationFlowManager.h"');
    expect(fs.existsSync(path.join(tempDir, 'ios', 'AppDelegate+RNAppAuth.h'))).toBe(false);
    const serialized = project.writeSync();
    await applyBridgingHeaderMod(project, tempDir);
    expect(project.writeSync()).toBe(serialized);
  });

  it('uses a discovered header when there is no inherited project header', async () => {
    const project = createXcodeProjectFixture();
    const targetList = project.pbxXCConfigurationList()[project.getFirstTarget().firstTarget.buildConfigurationList];
    for (const { value } of targetList.buildConfigurations) {
      project.pbxXCBuildConfigurationSection()[value].buildSettings.SWIFT_OBJC_BRIDGING_HEADER = '$(inherited)';
    }
    const discovered = path.join(tempDir, 'ios', 'Example-Bridging-Header.h');
    fs.mkdirSync(path.dirname(discovered), { recursive: true });
    fs.writeFileSync(discovered, '// discovered header\n');
    await applyBridgingHeaderMod(project, tempDir);
    expect(project.getBuildProperty('SWIFT_OBJC_BRIDGING_HEADER')).toBe('$(SRCROOT)/Example-Bridging-Header.h');
    expect(fs.readFileSync(discovered, 'utf8')).toContain('#import "RNAppAuthAuthorizationFlowManager.h"');
    expect(fs.existsSync(path.join(tempDir, 'ios', 'AppDelegate+RNAppAuth.h'))).toBe(false);
  });

  it('configures a discovered header or creates one when no header exists', async () => {
    const iosRoot = path.join(tempDir, 'ios');
    fs.mkdirSync(iosRoot, { recursive: true });
    const discovered = path.join(iosRoot, 'Example-Bridging-Header.h');
    fs.writeFileSync(discovered, '// existing header\n');
    const project = createXcodeProjectFixture();
    await applyBridgingHeaderMod(project, tempDir);
    expect(project.getBuildProperty('SWIFT_OBJC_BRIDGING_HEADER')).toBe('$(SRCROOT)/Example-Bridging-Header.h');
    fs.unlinkSync(discovered);
    const emptyProject = createXcodeProjectFixture();
    await applyBridgingHeaderMod(emptyProject, tempDir);
    const generated = path.join(iosRoot, 'AppDelegate+RNAppAuth.h');
    expect(fs.readFileSync(generated, 'utf8')).toBe('#import "RNAppAuthAuthorizationFlowManager.h"\n');
    expect(emptyProject.getBuildProperty('SWIFT_OBJC_BRIDGING_HEADER')).toBe('$(SRCROOT)/AppDelegate+RNAppAuth.h');
    await applyBridgingHeaderMod(emptyProject, tempDir);
    expect(countOccurrences(fs.readFileSync(generated, 'utf8'), 'RNAppAuthAuthorizationFlowManager.h')).toBe(1);
  });
});
