import React
import ReactAppDependencyProvider
import React_RCTAppDelegate
import UIKit

@main
class AppDelegate: UIResponder, UIApplicationDelegate,
  RNAppAuthAuthorizationFlowManager
{
  var window: UIWindow?

  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?
  var launchOptions: [UIApplication.LaunchOptionsKey: Any]?

  // Required by RNAppAuthAuthorizationFlowManager protocol
  public weak var authorizationFlowManagerDelegate:
    RNAppAuthAuthorizationFlowManagerDelegate?

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication
      .LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    let delegate = ReactNativeDelegate()
    let factory = RCTReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory

    self.launchOptions = launchOptions

    return true
  }

  // Handle OAuth redirect URL
  func application(
    _ app: UIApplication,
    open url: URL,
    options: [UIApplication.OpenURLOptionsKey: Any] = [:]
  ) -> Bool {
    if let authorizationFlowManagerDelegate = self
      .authorizationFlowManagerDelegate
    {
      if authorizationFlowManagerDelegate.resumeExternalUserAgentFlow(with: url)
      {
        return true
      }
    }
    return RCTLinkingManager.application(app, open: url, options: options)
  }

  func application(
    _ application: UIApplication,
    continue userActivity: NSUserActivity,
    restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void
  ) -> Bool {

    // Handle Universal-Link–style OAuth redirects first
    if userActivity.activityType == NSUserActivityTypeBrowsingWeb,
      let delegate = authorizationFlowManagerDelegate,
      delegate.resumeExternalUserAgentFlow(with: userActivity.webpageURL)
    {
      return true
    }

    // Fall back to React Native’s own Linking logic
    return RCTLinkingManager.application(
      application,
      continue: userActivity,
      restorationHandler: restorationHandler
    )
  }

}

class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }

  override func bundleURL() -> URL? {
    #if DEBUG
      let provider = RCTBundleURLProvider.sharedSettings()
      // Prebuilt React Native fixes its default port at compile time. Honor the app build setting.
      if let port = Bundle.main.object(forInfoDictionaryKey: "ReactNativeDevServerPort") as? String,
        !port.isEmpty
      {
        provider.jsLocation = "localhost:\(port)"
      }
      return provider.jsBundleURL(forBundleRoot: "index")
    #else
      Bundle.main.url(forResource: "main", withExtension: "jsbundle")
    #endif
  }
}
