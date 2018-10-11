/*! @file AppDelegate.h
    @brief AppAuth macOS SDK Example
    @copyright
        Copyright 2016 Google Inc. All Rights Reserved.
    @copydetails
        Licensed under the Apache License, Version 2.0 (the "License");
        you may not use this file except in compliance with the License.
        You may obtain a copy of the License at

        http://www.apache.org/licenses/LICENSE-2.0

        Unless required by applicable law or agreed to in writing, software
        distributed under the License is distributed on an "AS IS" BASIS,
        WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
        See the License for the specific language governing permissions and
        limitations under the License.
 */

#import <Cocoa/Cocoa.h>

NS_ASSUME_NONNULL_BEGIN

@protocol OIDExternalUserAgentSession;

/*! @class AppDelegate
    @brief The example application's delegate.
 */
@interface AppDelegate : NSObject <NSApplicationDelegate>

/*! @property currentAuthorizationFlow
    @brief The authorization flow session which receives the return URL from the browser.
    @discussion We need to store this in the app delegate as it's that delegate which receives the
        incoming URL. This property will be nil, except when an authorization flow is in progress.
 */
@property(nonatomic, strong, nullable) id<OIDExternalUserAgentSession> currentAuthorizationFlow;

@end

NS_ASSUME_NONNULL_END
