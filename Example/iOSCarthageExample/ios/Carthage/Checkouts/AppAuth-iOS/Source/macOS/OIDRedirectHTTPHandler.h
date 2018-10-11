/*! @file OIDRedirectHTTPHandler.h
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

NS_ASSUME_NONNULL_BEGIN

@protocol OIDExternalUserAgentSession;

/*! @brief Start a HTTP server on the loopback interface (i.e. @c 127.0.0.1) to receive the OAuth
        response redirects on macOS.
 */
@interface OIDRedirectHTTPHandler : NSObject

/*! @brief The external user-agent request flow session which receives the return URL from the
        browser.
    @discussion The loopback HTTP server will try sending incoming request URLs to the OAuth
        redirect handler to continue the flow. This should be set while an external user-agent
        request flow is in progress.
 */
@property(nonatomic, strong, nullable) id<OIDExternalUserAgentSession> currentAuthorizationFlow;

/*! @brief Creates an a loopback HTTP redirect URI handler with the given success URL.
    @param successURL The URL that the user is redirected to after the external user-agent request flow completes
        either with a result of success or error. The contents of this page should instruct the user
        to return to the app.
    @discussion Once you have initiated the external user-agent request, be sure to set
        @c currentAuthorizationFlow on this object so that any responses received by this listener will
        be routed accordingly.
 */
- (instancetype)initWithSuccessURL:(nullable NSURL *)successURL;

/*! @brief Starts listening on the loopback interface on a random available port, and returns a URL
        with the base address. Use the returned redirect URI to build a @c OIDExternalUserAgentRequest,
        and once you initiate the request, set the resulting @c OIDExternalUserAgentSession to
        @c currentAuthorizationFlow so the response can be handled.
    @param error The error if an error occurred while starting the local HTTP server.
    @return The URL containing the address of the server with the randomly assigned available port.
    @discussion Each instance of @c OIDRedirectHTTPHandler can only listen for a single response.
        Calling this more than once will result in the previous listener being cancelled (equivalent
        of @c cancelHTTPListener being called).
 */
- (NSURL *)startHTTPListener:(NSError **)error;

/*! @brief Stops listening the loopback interface and sends an cancellation error (in the domain
        ::OIDGeneralErrorDomain, with the code ::OIDErrorCodeProgramCanceledAuthorizationFlow) to
        the @c currentAuthorizationFlow.  Has no effect if called when no requests are pending.
    @discussion The HTTP listener is stopped automatically on receiving a valid response (regardless
        of whether the request succeeded or not), this method should not be called except when
        abandoning the external user-agent request.
 */
- (void)cancelHTTPListener;

@end

NS_ASSUME_NONNULL_END
