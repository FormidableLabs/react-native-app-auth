#import "RNAppAuthRedirects.h"
#import "RNAppAuthAuthorizationFlowManager.h"

// Runs on the host: the router uses only Foundation.
@interface TestReceiver : NSObject <RNAppAuthAuthorizationFlowManagerDelegate>
@property(nonatomic, strong) NSURL *receivedURL;
@end
@implementation TestReceiver
- (BOOL)resumeExternalUserAgentFlowWithURL:(NSURL *)url {
    self.receivedURL = url;
    return YES;
}
@end

@interface PlainAppDelegate : NSObject
@end
@implementation PlainAppDelegate
@end

@interface ForwardingAppDelegate : NSObject <RNAppAuthAuthorizationFlowManager>
@end
@implementation ForwardingAppDelegate
@synthesize authorizationFlowManagerDelegate;
@end

static int failures = 0;

static void Check(BOOL condition, const char *name) {
    fprintf(stderr, "%s: %s\n", condition ? "PASS" : "FAIL", name);
    if (!condition) {
        failures++;
    }
}

int main(void) {
    @autoreleasepool {
        NSURL *url = [NSURL URLWithString:@"com.example.app:/oauthredirect?code=1"];
        TestReceiver *receiver = [TestReceiver new];

        Check(!RNAppAuthResumeExternalUserAgentFlowWithURL(url), "no flow takes no redirect");
        Check(!RNAppAuthRouteRedirectsTo(receiver, [PlainAppDelegate new]),
              "plain AppDelegate without a subscriber cannot route redirects");

        ForwardingAppDelegate *forwarding = [ForwardingAppDelegate new];
        Check(RNAppAuthRouteRedirectsTo(receiver, forwarding), "forwarding AppDelegate routes redirects");
        Check(forwarding.authorizationFlowManagerDelegate == receiver, "forwarding AppDelegate gets the receiver");

        RNAppAuthRegisterAppDelegateSubscriber();
        TestReceiver *subscriberReceiver = [TestReceiver new];
        Check(RNAppAuthRouteRedirectsTo(subscriberReceiver, [PlainAppDelegate new]),
              "plain AppDelegate with a subscriber routes redirects");
        Check(RNAppAuthResumeExternalUserAgentFlowWithURL(url), "subscriber redirect is handled");
        Check([subscriberReceiver.receivedURL isEqual:url], "subscriber redirect reaches the latest receiver");
        Check(receiver.receivedURL == nil, "an earlier receiver gets nothing");

        @autoreleasepool {
            TestReceiver *shortLived = [TestReceiver new];
            RNAppAuthRouteRedirectsTo(shortLived, nil);
        }
        Check(!RNAppAuthResumeExternalUserAgentFlowWithURL(url), "a released receiver is not kept alive");
    }
    if (failures > 0) {
        fprintf(stderr, "%d iOS redirect cases failed.\n", failures);
        return 1;
    }
    fprintf(stderr, "All 9 iOS redirect cases passed.\n");
    return 0;
}
