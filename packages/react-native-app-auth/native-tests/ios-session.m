#import <UIKit/UIKit.h>
#import "AppAuth.h"
#import "RNAppAuth.h"
#import "RNAppAuthAuthorizationFlowManager.h"

@interface RNAppAuth (SessionTests)
- (BOOL)resumeExternalUserAgentFlowWithURL:(NSURL *)url;
- (void)authorizeWithConfiguration:(OIDServiceConfiguration *)configuration
                      redirectUrl:(NSString *)redirectUrl clientId:(NSString *)clientId
                     clientSecret:(NSString *)clientSecret scopes:(NSArray *)scopes
                         useNonce:(BOOL)useNonce usePKCE:(BOOL)usePKCE
             additionalParameters:(NSDictionary *)additionalParameters
                 skipCodeExchange:(BOOL)skipCodeExchange iosCustomBrowser:(NSString *)iosCustomBrowser
          prefersEphemeralSession:(BOOL)prefersEphemeralSession
                          resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject;
- (void)endSessionWithConfiguration:(OIDServiceConfiguration *)configuration
                       idTokenHint:(NSString *)idTokenHint postLogoutRedirectURL:(NSString *)postLogoutRedirectURL
              additionalParameters:(NSDictionary *)additionalParameters iosCustomBrowser:(NSString *)iosCustomBrowser
           prefersEphemeralSession:(BOOL)prefersEphemeralSession
                           resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject;
@end

// Exercise actual AppAuth sessions without opening a browser.
@interface TestBrowser : NSObject <OIDExternalUserAgent>
@property(nonatomic) BOOL opens;
@property(nonatomic, weak) id<OIDExternalUserAgentSession> session;
@property(nonatomic, strong) id<OIDExternalUserAgentRequest> request;
@end
@implementation TestBrowser
- (BOOL)presentExternalUserAgentRequest:(id<OIDExternalUserAgentRequest>)request
                               session:(id<OIDExternalUserAgentSession>)session {
    self.session = session;
    self.request = request;
    return self.opens;
}
- (void)dismissExternalUserAgentAnimated:(BOOL)animated completion:(void (^)(void))completion {
    if (completion) completion();
}
@end

@interface TestModule : RNAppAuth
@property(nonatomic, strong) TestBrowser *browser;
@end
@implementation TestModule
- (id<OIDExternalUserAgent>)getCustomBrowser:(NSString *)browserType { return self.browser; }
@end

// Hold the real token exchange open until the duplicate redirect has been delivered.
static NSURLProtocol *pendingTokenRequest;
@interface TokenProtocol : NSURLProtocol
@end
@implementation TokenProtocol
+ (BOOL)canInitWithRequest:(NSURLRequest *)request {
    return [request.URL.host isEqualToString:@"session-tests.invalid"];
}
+ (NSURLRequest *)canonicalRequestForRequest:(NSURLRequest *)request { return request; }
- (void)startLoading { @synchronized(TokenProtocol.class) { pendingTokenRequest = self; } }
- (void)stopLoading {}
@end

static NSUInteger checks;
static void Check(BOOL condition, NSString *description) {
    if (!condition) {
        fprintf(stderr, "FAIL: %s\n", description.UTF8String);
        exit(1);
    }
    checks++;
    fprintf(stderr, "PASS: %s\n", description.UTF8String);
}

static void WaitUntil(BOOL (^condition)(void)) {
    NSDate *deadline = [NSDate dateWithTimeIntervalSinceNow:5];
    while (!condition() && deadline.timeIntervalSinceNow > 0) {
        [NSRunLoop.currentRunLoop runUntilDate:[NSDate dateWithTimeIntervalSinceNow:0.01]];
    }
    Check(condition(), @"asynchronous operation completes within timeout");
}

static OIDServiceConfiguration *Configuration(void) {
    return [[OIDServiceConfiguration alloc]
            initWithAuthorizationEndpoint:[NSURL URLWithString:@"https://session-tests.invalid/authorize"]
            tokenEndpoint:[NSURL URLWithString:@"https://session-tests.invalid/token"]
            issuer:nil registrationEndpoint:nil
            endSessionEndpoint:[NSURL URLWithString:@"https://session-tests.invalid/logout"]];
}

static TestModule *Module(BOOL opens) {
    TestModule *module = [TestModule new];
    module.browser = [TestBrowser new];
    module.browser.opens = opens;
    return module;
}

static void Authorize(TestModule *module, BOOL skipExchange,
                      RCTPromiseResolveBlock resolve, RCTPromiseRejectBlock reject) {
    [module authorizeWithConfiguration:Configuration() redirectUrl:@"com.rnaa.tests:/callback"
                              clientId:@"test-client" clientSecret:nil scopes:@[@"openid"]
                              useNonce:NO usePKCE:YES additionalParameters:@{@"state": @"expected-state"}
                      skipCodeExchange:skipExchange iosCustomBrowser:@"controlled"
               prefersEphemeralSession:NO resolve:resolve reject:reject];
}

static void RunTests(void) {
    NSURL *redirect = [NSURL URLWithString:@"com.rnaa.tests:/callback?code=test-code&state=expected-state"];
    RCTPromiseResolveBlock unexpectedResolve = ^(id result) { Check(NO, @"unexpected success"); };
    RCTPromiseRejectBlock unexpectedReject = ^(NSString *code, NSString *message, NSError *error) {
        Check(NO, [NSString stringWithFormat:@"unexpected failure: %@ %@", code, message]);
    };
    Check(![Module(YES) resumeExternalUserAgentFlowWithURL:redirect], @"no pending flow ignores redirect");

    for (NSNumber *skip in @[@YES, @NO]) {
        TestModule *module = Module(NO);
        __block NSUInteger rejected = 0;
        Authorize(module, skip.boolValue, unexpectedResolve, ^(NSString *code, NSString *message, NSError *error) {
            Check(error.code == OIDErrorCodeSafariOpenError, @"authorization fails in the browser-open path");
            rejected++;
        });
        Check(rejected == 1, @"browser-open failure rejects authorization once");
        Check([module valueForKey:@"currentSession"] == nil, @"synchronously completed authorization is not retained");
        Check(![module resumeExternalUserAgentFlowWithURL:redirect], @"redirect after failed authorization does not crash");
    }

    TestModule *logout = Module(NO);
    __block NSUInteger logoutRejected = 0;
    [logout endSessionWithConfiguration:Configuration() idTokenHint:@"test-id-token"
                  postLogoutRedirectURL:@"com.rnaa.tests:/logout" additionalParameters:@{}
                       iosCustomBrowser:@"controlled" prefersEphemeralSession:NO
                                resolve:unexpectedResolve reject:^(NSString *code, NSString *message, NSError *error) {
        Check(error.code == OIDErrorCodeSafariOpenError, @"logout fails in the browser-open path");
        logoutRejected++;
    }];
    Check(logoutRejected == 1, @"browser-open failure rejects logout once");
    Check([logout valueForKey:@"currentSession"] == nil, @"synchronously completed logout is not retained");
    Check(![logout resumeExternalUserAgentFlowWithURL:[NSURL URLWithString:@"com.rnaa.tests:/logout"]],
          @"redirect after failed logout does not crash");

    TestModule *skip = Module(YES);
    __block NSDictionary *authorization;
    Authorize(skip, YES, ^(id result) { authorization = result; }, unexpectedReject);
    Check(![skip resumeExternalUserAgentFlowWithURL:[NSURL URLWithString:@"com.other:/unrelated"]],
          @"unrelated URL is not consumed");
    Check([skip valueForKey:@"currentSession"] != nil, @"unrelated URL preserves pending flow");
    Check([skip resumeExternalUserAgentFlowWithURL:redirect], @"matching URL completes code-only authorization");
    Check([authorization[@"authorizationCode"] isEqual:@"test-code"] && [authorization[@"codeVerifier"] length] > 0,
          @"code-only authorization retains code and PKCE verifier");
    Check(![skip resumeExternalUserAgentFlowWithURL:redirect], @"duplicate code-only redirect is ignored");

    TestModule *wrongState = Module(YES);
    __block NSUInteger stateRejected = 0;
    Authorize(wrongState, YES, unexpectedResolve, ^(NSString *code, NSString *message, NSError *error) {
        stateRejected++;
    });
    Check([wrongState resumeExternalUserAgentFlowWithURL:[NSURL URLWithString:@"com.rnaa.tests:/callback?code=test&state=wrong"]],
          @"matching URL with wrong state reaches AppAuth validation");
    Check(stateRejected == 1, @"AppAuth rejects wrong state");
    Check(![wrongState resumeExternalUserAgentFlowWithURL:redirect], @"rejected state leaves no resumable session");

    TestModule *cancelled = Module(YES);
    __block NSUInteger cancelRejected = 0;
    Authorize(cancelled, NO, unexpectedResolve, ^(NSString *code, NSString *message, NSError *error) {
        cancelRejected++;
    });
    [cancelled.browser.session cancel];
    Check(cancelRejected == 1, @"cancellation rejects authorization once");
    Check(![cancelled resumeExternalUserAgentFlowWithURL:redirect], @"redirect after cancellation is ignored");

    NSURLSessionConfiguration *sessionConfiguration = NSURLSessionConfiguration.ephemeralSessionConfiguration;
    sessionConfiguration.protocolClasses = @[TokenProtocol.class];
    [OIDURLSessionProvider setSession:[NSURLSession sessionWithConfiguration:sessionConfiguration]];
    TestModule *token = Module(YES);
    __block NSDictionary *tokens;
    Authorize(token, NO, ^(id result) { tokens = result; }, unexpectedReject);
    Check([token resumeExternalUserAgentFlowWithURL:redirect], @"first redirect starts real token exchange");
    WaitUntil(^BOOL { @synchronized(TokenProtocol.class) { return pendingTokenRequest != nil; } });
    Check(tokens == nil, @"token exchange remains pending");
    Check([token valueForKey:@"currentSession"] == nil, @"consumed browser session is cleared before token response");
    Check(![token resumeExternalUserAgentFlowWithURL:redirect], @"duplicate redirect during token exchange does not crash");
    NSURLProtocol *request = pendingTokenRequest;
    NSData *body = [@"{\"access_token\":\"test-access-token\",\"token_type\":\"Bearer\",\"expires_in\":3600}" dataUsingEncoding:NSUTF8StringEncoding];
    NSHTTPURLResponse *response = [[NSHTTPURLResponse alloc] initWithURL:request.request.URL statusCode:200
                                                        HTTPVersion:@"HTTP/1.1" headerFields:@{@"Content-Type": @"application/json"}];
    [request.client URLProtocol:request didReceiveResponse:response cacheStoragePolicy:NSURLCacheStorageNotAllowed];
    [request.client URLProtocol:request didLoadData:body];
    [request.client URLProtocolDidFinishLoading:request];
    WaitUntil(^BOOL { return tokens != nil; });
    Check([tokens[@"accessToken"] isEqual:@"test-access-token"], @"clearing browser session preserves token completion");
    pendingTokenRequest = nil;

    TestModule *successLogout = Module(YES);
    __block NSDictionary *logoutResponse;
    [successLogout endSessionWithConfiguration:Configuration() idTokenHint:@"test-id-token"
                         postLogoutRedirectURL:@"com.rnaa.tests:/logout" additionalParameters:@{}
                              iosCustomBrowser:@"controlled" prefersEphemeralSession:NO
                                       resolve:^(id result) { logoutResponse = result; } reject:unexpectedReject];
    OIDEndSessionRequest *logoutRequest = (OIDEndSessionRequest *)successLogout.browser.request;
    NSURL *logoutRedirect = [NSURL URLWithString:[@"com.rnaa.tests:/logout?state=" stringByAppendingString:logoutRequest.state]];
    Check([successLogout resumeExternalUserAgentFlowWithURL:logoutRedirect], @"matching logout redirect is consumed");
    Check([logoutResponse[@"idTokenHint"] isEqual:@"test-id-token"], @"logout completes successfully");
    Check(![successLogout resumeExternalUserAgentFlowWithURL:logoutRedirect], @"duplicate logout redirect is ignored");

    NSString *results = [NSString stringWithFormat:@"All %lu iOS session checks passed.\n", (unsigned long)checks];
    NSString *resultPath = [NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES).firstObject
                           stringByAppendingPathComponent:@"session-results.txt"];
    [results writeToFile:resultPath atomically:YES encoding:NSUTF8StringEncoding error:nil];
    fprintf(stderr, "%s", results.UTF8String);
}

@interface SessionSceneDelegate : UIResponder <UIWindowSceneDelegate>
@property(nonatomic, strong) UIWindow *window;
@end
@implementation SessionSceneDelegate
- (void)scene:(UIScene *)scene willConnectToSession:(UISceneSession *)session options:(UISceneConnectionOptions *)options {
    self.window = [[UIWindow alloc] initWithWindowScene:(UIWindowScene *)scene];
    self.window.rootViewController = [UIViewController new];
    [self.window makeKeyAndVisible];
    UIApplication.sharedApplication.delegate.window = self.window;
}
- (void)sceneDidBecomeActive:(UIScene *)scene {
    RunTests();
    exit(0);
}
@end

@interface SessionAppDelegate : UIResponder <UIApplicationDelegate, RNAppAuthAuthorizationFlowManager>
@property(nonatomic, strong) UIWindow *window;
@property(nonatomic, weak) id<RNAppAuthAuthorizationFlowManagerDelegate> authorizationFlowManagerDelegate;
@end
@implementation SessionAppDelegate
- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)options { return YES; }
@end

int main(int argc, char *argv[]) {
    @autoreleasepool {
        return UIApplicationMain(argc, argv, nil, NSStringFromClass(SessionAppDelegate.class));
    }
}
