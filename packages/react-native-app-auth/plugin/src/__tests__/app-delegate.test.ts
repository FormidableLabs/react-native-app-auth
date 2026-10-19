import { applyExpoAppDelegatePatch } from '../ios/app-delegate';

const expo56AppDelegate = `internal import Expo
import React
import ReactAppDependencyProvider

@main
class AppDelegate: ExpoAppDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ExpoReactNativeFactoryDelegate?
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
    return super.application(application, continue: userActivity, restorationHandler: restorationHandler)
  }
}`;

const publicAppDelegate = expo56AppDelegate.replace(
  'class AppDelegate: ExpoAppDelegate',
  'public class AppDelegate: ExpoAppDelegate'
);

describe('applyExpoAppDelegatePatch', () => {
  it('adds AppAuth conformance to Expo 56 Swift AppDelegate templates', () => {
    const result = applyExpoAppDelegatePatch(expo56AppDelegate);

    expect(result).toContain('class AppDelegate: ExpoAppDelegate, RNAppAuthAuthorizationFlowManager {');
    expect(result).toContain(
      'public weak var authorizationFlowManagerDelegate: RNAppAuthAuthorizationFlowManagerDelegate?'
    );
    expect(result).toContain('authorizationFlowManagerDelegate.resumeExternalUserAgentFlow(with: url)');
  });

  it('preserves older public Swift AppDelegate templates', () => {
    const result = applyExpoAppDelegatePatch(publicAppDelegate);

    expect(result).toContain('public class AppDelegate: ExpoAppDelegate, RNAppAuthAuthorizationFlowManager {');
  });

  it('preserves existing protocol conformances', () => {
    const result = applyExpoAppDelegatePatch(
      expo56AppDelegate.replace(
        'class AppDelegate: ExpoAppDelegate',
        'class AppDelegate: ExpoAppDelegate, UIApplicationDelegate'
      )
    );

    expect(result).toContain(
      'class AppDelegate: ExpoAppDelegate, UIApplicationDelegate, RNAppAuthAuthorizationFlowManager {'
    );
  });

  it('preserves whitespace before the class opening brace', () => {
    const result = applyExpoAppDelegatePatch(
      expo56AppDelegate.replace(
        'class AppDelegate: ExpoAppDelegate {',
        `class AppDelegate: ExpoAppDelegate,
  UIApplicationDelegate
{`
      )
    );

    expect(result).toContain(`class AppDelegate: ExpoAppDelegate,
  UIApplicationDelegate, RNAppAuthAuthorizationFlowManager
{`);
  });

  it('does not duplicate an existing multiline AppAuth delegate property', () => {
    const appDelegateWithMultilineProperty = expo56AppDelegate.replace(
      '  var reactNativeFactory: RCTReactNativeFactory?',
      `  var reactNativeFactory: RCTReactNativeFactory?

  public weak var authorizationFlowManagerDelegate:
    RNAppAuthAuthorizationFlowManagerDelegate?`
    );

    const result = applyExpoAppDelegatePatch(appDelegateWithMultilineProperty);

    expect(result.match(/\bvar\s+authorizationFlowManagerDelegate\b/g)).toHaveLength(1);
  });

  it('is idempotent', () => {
    const once = applyExpoAppDelegatePatch(expo56AppDelegate);
    const twice = applyExpoAppDelegatePatch(once);

    expect(twice).toBe(once);
  });
});
