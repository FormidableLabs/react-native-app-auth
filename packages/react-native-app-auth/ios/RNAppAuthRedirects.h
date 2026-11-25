#import <Foundation/Foundation.h>
#import "RNAppAuthAuthorizationFlowManagerDelegate.h"

NS_ASSUME_NONNULL_BEGIN

/*! @brief Records that an Expo AppDelegate subscriber forwards redirect URLs to
        RNAppAuthResumeExternalUserAgentFlowWithURL, so the AppDelegate need not.
 */
FOUNDATION_EXPORT void RNAppAuthRegisterAppDelegateSubscriber(void);

/*! @brief Sends a redirect URL to the flow that is in progress.
    @return NO when no flow accepts the URL.
 */
FOUNDATION_EXPORT BOOL RNAppAuthResumeExternalUserAgentFlowWithURL(NSURL *url);

/*! @brief Makes @c receiver the target of redirect URLs. An AppDelegate that conforms to
        RNAppAuthAuthorizationFlowManager also gets @c receiver as its delegate.
    @return NO when neither the AppDelegate nor a subscriber forwards redirect URLs.
 */
FOUNDATION_EXPORT BOOL RNAppAuthRouteRedirectsTo(id<RNAppAuthAuthorizationFlowManagerDelegate> receiver,
                                                 id _Nullable appDelegate);

NS_ASSUME_NONNULL_END
