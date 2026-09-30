#import "RNAppAuthPresentation.h"

// Lightweight UIKit fixtures exercise the production resolver without React Native or an IdP.
@interface TestApplication : NSObject
@property(nonatomic, strong) id delegate;
@property(nonatomic, strong) NSSet *connectedScenes;
@property(nonatomic, strong) NSArray *windows;
@end
@implementation TestApplication
@end

@interface TestScene : NSObject
@property(nonatomic) UISceneActivationState activationState;
@property(nonatomic, strong) NSArray *windows;
@end
@implementation TestScene
- (BOOL)isKindOfClass:(Class)class {
    return class == UIWindowScene.class || [super isKindOfClass:class];
}
@end

@interface TestWindow : NSObject
@property(nonatomic) BOOL testKeyWindow;
@property(nonatomic, strong) TestScene *testScene;
@property(nonatomic, strong) UIViewController *rootViewController;
@property(nonatomic, getter=isHidden) BOOL hidden;
@property(nonatomic) UIWindowLevel windowLevel;
@end
@implementation TestWindow
- (BOOL)isKeyWindow { return self.testKeyWindow; }
- (UIWindowScene *)windowScene { return (UIWindowScene *)self.testScene; }
@end

@interface TestViewController : UIViewController
@property(nonatomic, strong) UIViewController *testPresentedViewController;
@end
@implementation TestViewController
- (UIViewController *)presentedViewController { return self.testPresentedViewController; }
@end

@interface TestDelegate : NSObject
@property(nonatomic, strong) UIWindow *window;
@end
@implementation TestDelegate
@end

static TestWindow *Window(BOOL key) {
    TestWindow *window = [TestWindow new];
    window.rootViewController = [TestViewController new];
    window.hidden = NO;
    window.testKeyWindow = key;
    return window;
}

static TestScene *Scene(UISceneActivationState state, NSArray *windows) {
    TestScene *scene = [TestScene new];
    scene.activationState = state;
    scene.windows = windows;
    for (TestWindow *window in windows) { window.testScene = scene; }
    return scene;
}

static void Check(TestApplication *application, UIViewController *expected, NSString *name) {
    UIViewController *actual = RNAppAuthPresentingViewController((UIApplication *)application);
    if (actual != expected) {
        fprintf(stderr, "FAIL: %s\n", name.UTF8String);
        exit(1);
    }
    fprintf(stderr, "PASS: %s\n", name.UTF8String);
}

static void RunTests(void) {
    TestApplication *application = [TestApplication new];
    TestDelegate *delegate = [TestDelegate new];
    application.delegate = delegate;
    application.connectedScenes = [NSSet set];
    application.windows = @[];

    TestWindow *legacy = Window(YES);
    delegate.window = (UIWindow *)legacy;
    Check(application, legacy.rootViewController, @"legacy app-delegate window");

    UIViewController *modal = [UIViewController new];
    ((TestViewController *)legacy.rootViewController).testPresentedViewController = modal;
    Check(application, modal, @"topmost presented modal");
    ((TestViewController *)legacy.rootViewController).testPresentedViewController = nil;

    delegate.window = nil;
    application.windows = @[legacy];
    Check(application, legacy.rootViewController, @"legacy application-window fallback");
    application.windows = @[];

    TestWindow *content = Window(NO);
    TestWindow *key = Window(YES);
    TestWindow *background = Window(YES);
    TestScene *active = Scene(UISceneActivationStateForegroundActive, @[content, key]);
    TestScene *backgroundScene = Scene(UISceneActivationStateBackground, @[background]);
    application.connectedScenes = [NSSet setWithArray:@[backgroundScene, active]];
    Check(application, key.rootViewController, @"foreground key window wins over background");

    key.rootViewController = nil;
    Check(application, content.rootViewController, @"rootless key window does not hide content window");
    key.rootViewController = [TestViewController new];
    key.hidden = YES;
    Check(application, content.rootViewController, @"hidden key window is ignored");
    key.hidden = NO;

    TestWindow *inactive = Window(YES);
    TestScene *inactiveScene = Scene(UISceneActivationStateForegroundInactive, @[inactive]);
    application.connectedScenes = [NSSet setWithArray:@[inactiveScene, active]];
    Check(application, key.rootViewController, @"active scene wins over inactive scene");
    application.connectedScenes = [NSSet setWithObject:inactiveScene];
    Check(application, inactive.rootViewController, @"temporarily inactive foreground scene");

    TestWindow *other = Window(YES);
    TestScene *otherScene = Scene(UISceneActivationStateForegroundActive, @[other]);
    application.connectedScenes = [NSSet setWithArray:@[active, otherScene]];
    Check(application, nil, @"ambiguous foreground scenes are rejected");
    delegate.window = (UIWindow *)key;
    Check(application, key.rootViewController, @"host-owned window disambiguates scenes");
    delegate.window = (UIWindow *)background;
    application.connectedScenes = [NSSet setWithArray:@[active, backgroundScene]];
    Check(application, key.rootViewController, @"background delegate window is ignored");

    application.connectedScenes = [NSSet setWithObject:backgroundScene];
    application.windows = @[background];
    Check(application, nil, @"background-only app cannot present");
    application.connectedScenes = [NSSet set];
    application.windows = @[];
    delegate.window = nil;
    Check(application, nil, @"missing window is rejected");
    fprintf(stderr, "All 13 iOS presenter cases passed.\n");
    NSString *resultPath = [NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES).firstObject
                           stringByAppendingPathComponent:@"presenter-results.txt"];
    [@"All 13 iOS presenter cases passed.\n" writeToFile:resultPath atomically:YES encoding:NSUTF8StringEncoding error:nil];
}

@interface RunnerSceneDelegate : UIResponder <UIWindowSceneDelegate>
@property(nonatomic, strong) UIWindow *window;
@end
@implementation RunnerSceneDelegate
- (void)scene:(UIScene *)scene willConnectToSession:(UISceneSession *)session options:(UISceneConnectionOptions *)options {
    self.window = [[UIWindow alloc] initWithWindowScene:(UIWindowScene *)scene];
    self.window.rootViewController = [UIViewController new];
    [self.window makeKeyAndVisible];
    RunTests();
    exit(0);
}
@end

@interface RunnerDelegate : UIResponder <UIApplicationDelegate>
@property(nonatomic, strong) UIWindow *window;
@end
@implementation RunnerDelegate
- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)options {
    return YES;
}
@end

int main(int argc, char *argv[]) {
    @autoreleasepool {
        return UIApplicationMain(argc, argv, nil, NSStringFromClass(RunnerDelegate.class));
    }
}
