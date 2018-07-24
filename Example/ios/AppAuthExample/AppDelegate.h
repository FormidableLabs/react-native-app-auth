/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <UIKit/UIKit.h>
#import <RNAppAuth/RNAppAuthAuthorizationFlowManager.h>

@interface AppDelegate : UIResponder <UIApplicationDelegate, RNAppAuthAuthorizationFlowManager>
@property (nonatomic, strong, nullable) UIWindow *window;
@property(nonatomic, weak)id<RNAppAuthAuthorizationFlowManagerDelegate>authorizationFlowManagerDelegate;
@end

