#import <Foundation/Foundation.h>
#import "RNAppAuthAuthorizationFlowManagerDelegate.h"

@protocol RNAppAuthAuthorizationFlowManager <NSObject>
@required
@property(nonatomic, weak)id<RNAppAuthAuthorizationFlowManagerDelegate>authorizationFlowManagerDelegate;
@end
