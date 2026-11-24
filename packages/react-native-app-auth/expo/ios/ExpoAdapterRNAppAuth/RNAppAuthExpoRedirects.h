#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

// Defined in the react-native-app-auth pod (ios/RNAppAuthRedirects.m).
FOUNDATION_EXPORT void RNAppAuthRegisterAppDelegateSubscriber(void);
FOUNDATION_EXPORT BOOL RNAppAuthResumeExternalUserAgentFlowWithURL(NSURL *url);

NS_ASSUME_NONNULL_END
