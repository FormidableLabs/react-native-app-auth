/*! @file OIDAuthorizationUICoordinator.h
    @brief AppAuth iOS SDK
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

#import <Foundation/Foundation.h>

@class OIDAuthorizationRequest;
@protocol OIDAuthorizationFlowSession;

NS_ASSUME_NONNULL_BEGIN

/*! @protocol OIDAuthorizationUICoordinator
    @brief An authorization UI coordinator that presents an authorization request. Clients may
         provide custom implementations of an authorization UI coordinator to customize the way the
         authorization request is presented to the user.
 */
@protocol OIDAuthorizationUICoordinator<NSObject>

/*! @brief Presents the authroization request in the user agent.
    @param request The authorizatoin request to be presented in the user agent.
    @param session The @c OIDAuthorizationFlowSession instance that initiates presenting the
        authorization UI. Concrete implementations of a @c OIDAuthorizationUICoordinator may call
        resumeAuthorizationFlowWithURL or failAuthorizationFlowWithError on session to either
        resume or fail the authorization.
    @return YES If the authorization UI was successfully presented to the user.
 */
- (BOOL)presentAuthorizationRequest:(OIDAuthorizationRequest *)request
                            session:(id<OIDAuthorizationFlowSession>)session;

/*! @brief Dimisses the authorization UI and calls completion when the dismiss operation ends.
    @param animated Wheter or not the dismiss operation should be animated.
    @remarks Has no effect if no authorization UI is presented.
    @param completion The block to be called when the dismiss operations ends
 */
- (void)dismissAuthorizationAnimated:(BOOL)animated completion:(void (^)(void))completion;

@end

NS_ASSUME_NONNULL_END
