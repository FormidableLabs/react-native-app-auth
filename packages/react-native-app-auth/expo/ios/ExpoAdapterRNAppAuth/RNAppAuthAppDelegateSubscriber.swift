#if canImport(ExpoModulesCore)
import ExpoModulesCore

public class RNAppAuthAppDelegateSubscriber: ExpoAppDelegateSubscriber {
  public func subscriberDidRegister() {
    RNAppAuthRegisterAppDelegateSubscriber()
  }

  public func application(
    _ app: UIApplication,
    open url: URL,
    options: [UIApplication.OpenURLOptionsKey: Any] = [:]
  ) -> Bool {
    return RNAppAuthResumeExternalUserAgentFlowWithURL(url)
  }

  public func application(
    _ application: UIApplication,
    continue userActivity: NSUserActivity,
    restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void
  ) -> Bool {
    guard userActivity.activityType == NSUserActivityTypeBrowsingWeb,
          let url = userActivity.webpageURL else {
      return false
    }
    return RNAppAuthResumeExternalUserAgentFlowWithURL(url)
  }
}
#endif
