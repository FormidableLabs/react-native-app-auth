/*! @file AppAuth.h
 @brief AppAuth iOS SDK
 @copyright
 Copyright 2015 Google Inc. All Rights Reserved.
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

//! Project version number for AppAuthFramework-iOS.
FOUNDATION_EXPORT double AppAuthVersionNumber;

//! Project version string for AppAuthFramework-iOS.
FOUNDATION_EXPORT const unsigned char AppAuthVersionString[];

#import <AppAuth/OIDAuthState.h>
#import <AppAuth/OIDAuthStateChangeDelegate.h>
#import <AppAuth/OIDAuthStateErrorDelegate.h>
#import <AppAuth/OIDAuthorizationRequest.h>
#import <AppAuth/OIDAuthorizationResponse.h>
#import <AppAuth/OIDAuthorizationService.h>
#import <AppAuth/OIDError.h>
#import <AppAuth/OIDErrorUtilities.h>
#import <AppAuth/OIDExternalUserAgent.h>
#import <AppAuth/OIDExternalUserAgentRequest.h>
#import <AppAuth/OIDExternalUserAgentSession.h>
#import <AppAuth/OIDGrantTypes.h>
#import <AppAuth/OIDIDToken.h>
#import <AppAuth/OIDRegistrationRequest.h>
#import <AppAuth/OIDRegistrationResponse.h>
#import <AppAuth/OIDResponseTypes.h>
#import <AppAuth/OIDScopes.h>
#import <AppAuth/OIDScopeUtilities.h>
#import <AppAuth/OIDServiceConfiguration.h>
#import <AppAuth/OIDServiceDiscovery.h>
#import <AppAuth/OIDTokenRequest.h>
#import <AppAuth/OIDTokenResponse.h>
#import <AppAuth/OIDTokenUtilities.h>
#import <AppAuth/OIDURLSessionProvider.h>

#if TARGET_OS_TV
#elif TARGET_OS_WATCH
#elif TARGET_OS_IOS
#import <AppAuth/OIDAuthState+IOS.h>
#import <AppAuth/OIDAuthorizationService+IOS.h>
#import <AppAuth/OIDExternalUserAgentIOS.h>
#import <AppAuth/OIDExternalUserAgentIOSCustomBrowser.h>
#elif TARGET_OS_MAC
#import <AppAuth/OIDAuthState+Mac.h>
#import <AppAuth/OIDAuthorizationService+Mac.h>
#import <AppAuth/OIDExternalUserAgentMac.h>
#import <AppAuth/OIDRedirectHTTPHandler.h>
#else
#error "Platform Undefined"
#endif

