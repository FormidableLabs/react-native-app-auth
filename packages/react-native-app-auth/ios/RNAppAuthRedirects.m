#import "RNAppAuthRedirects.h"
#import "RNAppAuthAuthorizationFlowManager.h"

static BOOL subscriberRegistered = NO;
static __weak id<RNAppAuthAuthorizationFlowManagerDelegate> currentReceiver = nil;

void RNAppAuthRegisterAppDelegateSubscriber(void) {
    subscriberRegistered = YES;
}

BOOL RNAppAuthResumeExternalUserAgentFlowWithURL(NSURL *url) {
    id<RNAppAuthAuthorizationFlowManagerDelegate> receiver = currentReceiver;
    return receiver != nil && [receiver resumeExternalUserAgentFlowWithURL:url];
}

BOOL RNAppAuthRouteRedirectsTo(id<RNAppAuthAuthorizationFlowManagerDelegate> receiver, id appDelegate) {
    BOOL appDelegateForwards = [[appDelegate class] conformsToProtocol:@protocol(RNAppAuthAuthorizationFlowManager)];
    if (!appDelegateForwards && !subscriberRegistered) {
        return NO;
    }
    if (appDelegateForwards) {
        ((id<RNAppAuthAuthorizationFlowManager>)appDelegate).authorizationFlowManagerDelegate = receiver;
    }
    currentReceiver = receiver;
    return YES;
}
