import { applyExpo53AppDelegatePatch } from '../ios/app-delegate';

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
}`;

const publicAppDelegate = expo56AppDelegate.replace(
  'class AppDelegate: ExpoAppDelegate',
  'public class AppDelegate: ExpoAppDelegate'
);

describe('applyExpo53AppDelegatePatch', () => {
  it('adds AppAuth conformance to Expo 56 Swift AppDelegate templates', () => {
    const result = applyExpo53AppDelegatePatch(expo56AppDelegate);

    expect(result).toContain('class AppDelegate: ExpoAppDelegate, RNAppAuthAuthorizationFlowManager {');
    expect(result).toContain(
      'public weak var authorizationFlowManagerDelegate: RNAppAuthAuthorizationFlowManagerDelegate?'
    );
    expect(result).toContain('authorizationFlowManagerDelegate.resumeExternalUserAgentFlow(with: url)');
  });

  it('preserves older public Swift AppDelegate templates', () => {
    const result = applyExpo53AppDelegatePatch(publicAppDelegate);

    expect(result).toContain('public class AppDelegate: ExpoAppDelegate, RNAppAuthAuthorizationFlowManager {');
  });

  it('preserves existing protocol conformances', () => {
    const result = applyExpo53AppDelegatePatch(
      expo56AppDelegate.replace(
        'class AppDelegate: ExpoAppDelegate',
        'class AppDelegate: ExpoAppDelegate, UIApplicationDelegate'
      )
    );

    expect(result).toContain(
      'class AppDelegate: ExpoAppDelegate, UIApplicationDelegate, RNAppAuthAuthorizationFlowManager {'
    );
  });

  it('does not duplicate an existing multiline AppAuth delegate property', () => {
    const appDelegateWithMultilineProperty = expo56AppDelegate.replace(
      '  var reactNativeFactory: RCTReactNativeFactory?',
      `  var reactNativeFactory: RCTReactNativeFactory?

  public weak var authorizationFlowManagerDelegate:
    RNAppAuthAuthorizationFlowManagerDelegate?`
    );

    const result = applyExpo53AppDelegatePatch(appDelegateWithMultilineProperty);

    expect(result.match(/\bvar\s+authorizationFlowManagerDelegate\b/g)).toHaveLength(1);
  });

  it('is idempotent', () => {
    const once = applyExpo53AppDelegatePatch(expo56AppDelegate);
    const twice = applyExpo53AppDelegatePatch(once);

    expect(twice).toBe(once);
  });
});
