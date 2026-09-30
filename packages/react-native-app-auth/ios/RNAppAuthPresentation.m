#import "RNAppAuthPresentation.h"

static UIWindow *RNAppAuthWindowWithRootViewController(NSArray<UIWindow *> *windows) {
    UIWindow *fallback = nil;
    for (UIWindow *window in windows) {
        if (window.hidden || window.rootViewController == nil) {
            continue;
        }
        if (window.isKeyWindow) {
            return window;
        }
        if (window.windowLevel == UIWindowLevelNormal) {
            fallback = window;
        }
    }
    return fallback;
}

static UIWindow *RNAppAuthPresentationWindow(UIApplication *application) {
    id<UIApplicationDelegate> appDelegate = application.delegate;
    UIWindow *delegateWindow = [appDelegate respondsToSelector:@selector(window)] ? appDelegate.window : nil;

    if (@available(iOS 13.0, *)) {
        // Prefer the window owned by the host app, when it belongs to a foreground scene.
        if (delegateWindow.rootViewController != nil && !delegateWindow.hidden &&
            (delegateWindow.windowScene == nil ||
             delegateWindow.windowScene.activationState == UISceneActivationStateForegroundActive ||
             delegateWindow.windowScene.activationState == UISceneActivationStateForegroundInactive)) {
            return delegateWindow;
        }

        for (NSInteger state = UISceneActivationStateForegroundActive;
             state <= UISceneActivationStateForegroundInactive; state++) {
            UIWindow *candidate = nil;
            for (UIScene *scene in application.connectedScenes) {
                if (![scene isKindOfClass:[UIWindowScene class]] || scene.activationState != state) {
                    continue;
                }
                UIWindow *window = RNAppAuthWindowWithRootViewController(((UIWindowScene *)scene).windows);
                if (window == nil) {
                    continue;
                }
                // The bridge has no initiating scene identifier. Do not pick an arbitrary scene.
                if (candidate != nil) {
                    return nil;
                }
                candidate = window;
            }
            if (candidate != nil) {
                return candidate;
            }
        }

        if (application.connectedScenes.count != 0) {
            return nil;
        }
    } else if (delegateWindow.rootViewController != nil && !delegateWindow.hidden) {
        return delegateWindow;
    }

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
    return RNAppAuthWindowWithRootViewController(application.windows);
#pragma clang diagnostic pop
}

UIViewController *RNAppAuthPresentingViewController(UIApplication *application) {
    UIViewController *viewController = RNAppAuthPresentationWindow(application).rootViewController;
    while (viewController.presentedViewController != nil) {
        viewController = viewController.presentedViewController;
    }
    return viewController;
}
