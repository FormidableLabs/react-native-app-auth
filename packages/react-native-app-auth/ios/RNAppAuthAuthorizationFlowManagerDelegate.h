#import <Foundation/Foundation.h>

@protocol RNAppAuthAuthorizationFlowManagerDelegate <NSObject>
@required
-(BOOL)resumeExternalUserAgentFlowWithURL:(NSURL *)url;
@end
