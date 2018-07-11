#import <Foundation/Foundation.h>
#import <AppAuth/AppAuth.h>

@protocol RNAppAuthAuthorizationFlowManager <NSObject>
@required
-(void)setCurrentAuthorizationFlowSession:(id<OIDAuthorizationFlowSession>)session;
@end
