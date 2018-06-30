/*! @file OIDAuthorizationService.m
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

#import "OIDAuthorizationService.h"

#import "OIDAuthorizationRequest.h"
#import "OIDAuthorizationResponse.h"
#import "OIDAuthorizationUICoordinator.h"
#import "OIDDefines.h"
#import "OIDErrorUtilities.h"
#import "OIDRegistrationRequest.h"
#import "OIDRegistrationResponse.h"
#import "OIDServiceConfiguration.h"
#import "OIDServiceDiscovery.h"
#import "OIDTokenRequest.h"
#import "OIDTokenResponse.h"
#import "OIDURLQueryComponent.h"
#import "OIDURLSessionProvider.h"

/*! @brief Path appended to an OpenID Connect issuer for discovery
    @see https://openid.net/specs/openid-connect-discovery-1_0.html#ProviderConfig
 */
static NSString *const kOpenIDConfigurationWellKnownPath = @".well-known/openid-configuration";


NS_ASSUME_NONNULL_BEGIN

@interface OIDAuthorizationFlowSessionImplementation : NSObject<OIDAuthorizationFlowSession> {
  // private variables
  OIDAuthorizationRequest *_request;
  id<OIDAuthorizationUICoordinator> _UICoordinator;
  OIDAuthorizationCallback _pendingauthorizationFlowCallback;
}

- (instancetype)init NS_UNAVAILABLE;

- (instancetype)initWithRequest:(OIDAuthorizationRequest *)request
    NS_DESIGNATED_INITIALIZER;

@end

@implementation OIDAuthorizationFlowSessionImplementation

- (instancetype)initWithRequest:(OIDAuthorizationRequest *)request {
  self = [super init];
  if (self) {
    _request = [request copy];
  }
  return self;
}

- (void)presentAuthorizationWithCoordinator:(id<OIDAuthorizationUICoordinator>)UICoordinator
                                   callback:(OIDAuthorizationCallback)authorizationFlowCallback {
  _UICoordinator = UICoordinator;
  _pendingauthorizationFlowCallback = authorizationFlowCallback;
  BOOL authorizationFlowStarted =
      [_UICoordinator presentAuthorizationRequest:_request session:self];
  if (!authorizationFlowStarted) {
    NSError *safariError = [OIDErrorUtilities errorWithCode:OIDErrorCodeSafariOpenError
                                            underlyingError:nil
                                                description:@"Unable to open Safari."];
    [self didFinishWithResponse:nil error:safariError];
  }
}

- (void)cancel {
  [_UICoordinator dismissAuthorizationAnimated:YES
                                    completion:^{
                                      NSError *error = [OIDErrorUtilities
                                            errorWithCode:OIDErrorCodeUserCanceledAuthorizationFlow
                                          underlyingError:nil
                                              description:nil];
                                      [self didFinishWithResponse:nil error:error];
                                    }];
}

- (BOOL)shouldHandleURL:(NSURL *)URL {
  NSURL *standardizedURL = [URL standardizedURL];
  NSURL *standardizedRedirectURL = [_request.redirectURL standardizedURL];

  return OIDIsEqualIncludingNil(standardizedURL.scheme, standardizedRedirectURL.scheme) &&
      OIDIsEqualIncludingNil(standardizedURL.user, standardizedRedirectURL.user) &&
      OIDIsEqualIncludingNil(standardizedURL.password, standardizedRedirectURL.password) &&
      OIDIsEqualIncludingNil(standardizedURL.host, standardizedRedirectURL.host) &&
      OIDIsEqualIncludingNil(standardizedURL.port, standardizedRedirectURL.port) &&
      OIDIsEqualIncludingNil(standardizedURL.path, standardizedRedirectURL.path);
}

- (BOOL)resumeAuthorizationFlowWithURL:(NSURL *)URL {
  // rejects URLs that don't match redirect (these may be completely unrelated to the authorization)
  if (![self shouldHandleURL:URL]) {
    return NO;
  }
  // checks for an invalid state
  if (!_pendingauthorizationFlowCallback) {
    [NSException raise:OIDOAuthExceptionInvalidAuthorizationFlow
                format:@"%@", OIDOAuthExceptionInvalidAuthorizationFlow, nil];
  }

  OIDURLQueryComponent *query = [[OIDURLQueryComponent alloc] initWithURL:URL];

  NSError *error;
  OIDAuthorizationResponse *response = nil;

  // checks for an OAuth error response as per RFC6749 Section 4.1.2.1
  if (query.dictionaryValue[OIDOAuthErrorFieldError]) {
    error = [OIDErrorUtilities OAuthErrorWithDomain:OIDOAuthAuthorizationErrorDomain
                                      OAuthResponse:query.dictionaryValue
                                    underlyingError:nil];
  }

  // no error, should be a valid OAuth 2.0 response
  if (!error) {
    response = [[OIDAuthorizationResponse alloc] initWithRequest:_request
                                                      parameters:query.dictionaryValue];
      
    // verifies that the state in the response matches the state in the request, or both are nil
    if (!OIDIsEqualIncludingNil(_request.state, response.state)) {
      NSMutableDictionary *userInfo = [query.dictionaryValue mutableCopy];
      userInfo[NSLocalizedDescriptionKey] =
        [NSString stringWithFormat:@"State mismatch, expecting %@ but got %@ in authorization "
                                   "response %@",
                                   _request.state,
                                   response.state,
                                   response];
      response = nil;
      error = [NSError errorWithDomain:OIDOAuthAuthorizationErrorDomain
                                  code:OIDErrorCodeOAuthAuthorizationClientError
                              userInfo:userInfo];
      }
  }

  [_UICoordinator dismissAuthorizationAnimated:YES
                                    completion:^{
                                      [self didFinishWithResponse:response error:error];
                                    }];

  return YES;
}

- (void)failAuthorizationFlowWithError:(NSError *)error {
  [self didFinishWithResponse:nil error:error];
}

/*! @brief Invokes the pending callback and performs cleanup.
    @param response The authorization response, if any to return to the callback.
    @param error The error, if any, to return to the callback.
 */
- (void)didFinishWithResponse:(nullable OIDAuthorizationResponse *)response
                        error:(nullable NSError *)error {
  OIDAuthorizationCallback callback = _pendingauthorizationFlowCallback;
  _pendingauthorizationFlowCallback = nil;
  _UICoordinator = nil;
  if (callback) {
    callback(response, error);
  }
}

@end

@implementation OIDAuthorizationService

@synthesize configuration = _configuration;

+ (void)discoverServiceConfigurationForIssuer:(NSURL *)issuerURL
                                   completion:(OIDDiscoveryCallback)completion {
  NSURL *fullDiscoveryURL =
      [issuerURL URLByAppendingPathComponent:kOpenIDConfigurationWellKnownPath];

  return [[self class] discoverServiceConfigurationForDiscoveryURL:fullDiscoveryURL
                                                        completion:completion];
}

+ (void)discoverServiceConfigurationForDiscoveryURL:(NSURL *)discoveryURL
    completion:(OIDDiscoveryCallback)completion {

  NSURLSession *session = [OIDURLSessionProvider session];
  NSURLSessionDataTask *task =
      [session dataTaskWithURL:discoveryURL
             completionHandler:^(NSData *data, NSURLResponse *response, NSError *error) {
    // If we got any sort of error, just report it.
    if (error || !data) {
      error = [OIDErrorUtilities errorWithCode:OIDErrorCodeNetworkError
                               underlyingError:error
                                   description:error.localizedDescription];
      dispatch_async(dispatch_get_main_queue(), ^{
        completion(nil, error);
      });
      return;
    }

    NSHTTPURLResponse *urlResponse = (NSHTTPURLResponse *)response;

    // Check for non-200 status codes.
    // https://openid.net/specs/openid-connect-discovery-1_0.html#ProviderConfigurationResponse
    if (urlResponse.statusCode != 200) {
      NSError *URLResponseError = [OIDErrorUtilities HTTPErrorWithHTTPResponse:urlResponse
                                                                          data:data];
      error = [OIDErrorUtilities errorWithCode:OIDErrorCodeNetworkError
                               underlyingError:URLResponseError
                                   description:nil];
      dispatch_async(dispatch_get_main_queue(), ^{
        completion(nil, error);
      });
      return;
    }

    // Construct an OIDServiceDiscovery with the received JSON.
    OIDServiceDiscovery *discovery =
        [[OIDServiceDiscovery alloc] initWithJSONData:data error:&error];
    if (error || !discovery) {
      error = [OIDErrorUtilities errorWithCode:OIDErrorCodeNetworkError
                               underlyingError:error
                                   description:nil];
      dispatch_async(dispatch_get_main_queue(), ^{
        completion(nil, error);
      });
      return;
    }

    // Create our service configuration with the discovery document and return it.
    OIDServiceConfiguration *configuration =
        [[OIDServiceConfiguration alloc] initWithDiscoveryDocument:discovery];
    dispatch_async(dispatch_get_main_queue(), ^{
      completion(configuration, nil);
    });
  }];
  [task resume];
}

#pragma mark - Authorization Endpoint

+ (id<OIDAuthorizationFlowSession>)
    presentAuthorizationRequest:(OIDAuthorizationRequest *)request
                  UICoordinator:(id<OIDAuthorizationUICoordinator>)UICoordinator
                       callback:(OIDAuthorizationCallback)callback {
  OIDAuthorizationFlowSessionImplementation *flowSession =
      [[OIDAuthorizationFlowSessionImplementation alloc] initWithRequest:request];
  [flowSession presentAuthorizationWithCoordinator:UICoordinator callback:callback];
  return flowSession;
}

#pragma mark - Token Endpoint

+ (void)performTokenRequest:(OIDTokenRequest *)request callback:(OIDTokenCallback)callback {
  NSURLRequest *URLRequest = [request URLRequest];
  NSURLSession *session = [OIDURLSessionProvider session];
  [[session dataTaskWithRequest:URLRequest
              completionHandler:^(NSData *_Nullable data,
                                  NSURLResponse *_Nullable response,
                                  NSError *_Nullable error) {
    if (error) {
      // A network error or server error occurred.
      NSError *returnedError =
          [OIDErrorUtilities errorWithCode:OIDErrorCodeNetworkError
                           underlyingError:error
                               description:nil];
      dispatch_async(dispatch_get_main_queue(), ^{
        callback(nil, returnedError);
      });
      return;
    }

    NSHTTPURLResponse *HTTPURLResponse = (NSHTTPURLResponse *)response;
    NSInteger statusCode = HTTPURLResponse.statusCode;
    if (statusCode != 200) {
      // A server error occurred.
      NSError *serverError =
          [OIDErrorUtilities HTTPErrorWithHTTPResponse:HTTPURLResponse data:data];

      // HTTP 400 may indicate an RFC6749 Section 5.2 error response.
      // HTTP 429 may occur during polling for device-flow requests for the slow_down error
      // https://tools.ietf.org/html/draft-ietf-oauth-device-flow-03#section-3.5
      if (statusCode == 400 || statusCode == 429) {
        NSError *jsonDeserializationError;
        NSDictionary<NSString *, NSObject<NSCopying> *> *json =
            [NSJSONSerialization JSONObjectWithData:data options:0 error:&jsonDeserializationError];

        // if the HTTP 400 response parses as JSON and has an 'error' key, it's an OAuth error
        // these errors are special as they indicate a problem with the authorization grant
        if (json[OIDOAuthErrorFieldError]) {
          NSError *oauthError =
            [OIDErrorUtilities OAuthErrorWithDomain:OIDOAuthTokenErrorDomain
                                      OAuthResponse:json
                                    underlyingError:serverError];
          dispatch_async(dispatch_get_main_queue(), ^{
            callback(nil, oauthError);
          });
          return;
        }
      }

      // not an OAuth error, just a generic server error
      NSError *returnedError =
          [OIDErrorUtilities errorWithCode:OIDErrorCodeServerError
                           underlyingError:serverError
                               description:nil];
      dispatch_async(dispatch_get_main_queue(), ^{
        callback(nil, returnedError);
      });
      return;
    }

    NSError *jsonDeserializationError;
    NSDictionary<NSString *, NSObject<NSCopying> *> *json =
        [NSJSONSerialization JSONObjectWithData:data options:0 error:&jsonDeserializationError];
    if (jsonDeserializationError) {
      // A problem occurred deserializing the response/JSON.
      NSError *returnedError =
          [OIDErrorUtilities errorWithCode:OIDErrorCodeJSONDeserializationError
                           underlyingError:jsonDeserializationError
                               description:nil];
      dispatch_async(dispatch_get_main_queue(), ^{
        callback(nil, returnedError);
      });
      return;
    }

    OIDTokenResponse *tokenResponse =
        [[OIDTokenResponse alloc] initWithRequest:request parameters:json];
    if (!tokenResponse) {
      // A problem occurred constructing the token response from the JSON.
      NSError *returnedError =
          [OIDErrorUtilities errorWithCode:OIDErrorCodeTokenResponseConstructionError
                           underlyingError:jsonDeserializationError
                               description:nil];
      dispatch_async(dispatch_get_main_queue(), ^{
        callback(nil, returnedError);
      });
      return;
    }

    // Success
    dispatch_async(dispatch_get_main_queue(), ^{
      callback(tokenResponse, nil);
    });
  }] resume];
}


#pragma mark - Registration Endpoint

+ (void)performRegistrationRequest:(OIDRegistrationRequest *)request
                          completion:(OIDRegistrationCompletion)completion {
  NSURLRequest *URLRequest = [request URLRequest];
  if (!URLRequest) {
    // A problem occurred deserializing the response/JSON.
    NSError *returnedError = [OIDErrorUtilities errorWithCode:OIDErrorCodeJSONSerializationError
                                              underlyingError:nil
                                                  description:@"The registration request could not "
                                                               "be serialized as JSON."];
    dispatch_async(dispatch_get_main_queue(), ^{
      completion(nil, returnedError);
    });
    return;
  }

  NSURLSession *session = [OIDURLSessionProvider session];
  [[session dataTaskWithRequest:URLRequest
              completionHandler:^(NSData *_Nullable data,
                                  NSURLResponse *_Nullable response,
                                  NSError *_Nullable error) {
    if (error) {
      // A network error or server error occurred.
      NSError *returnedError = [OIDErrorUtilities errorWithCode:OIDErrorCodeNetworkError
                                                underlyingError:error
                                                    description:nil];
      dispatch_async(dispatch_get_main_queue(), ^{
        completion(nil, returnedError);
      });
      return;
    }

    NSHTTPURLResponse *HTTPURLResponse = (NSHTTPURLResponse *) response;

    if (HTTPURLResponse.statusCode != 201 && HTTPURLResponse.statusCode != 200) {
      // A server error occurred.
      NSError *serverError = [OIDErrorUtilities HTTPErrorWithHTTPResponse:HTTPURLResponse
                                                                     data:data];

      // HTTP 400 may indicate an OpenID Connect Dynamic Client Registration 1.0 Section 3.3 error
      // response, checks for that
      if (HTTPURLResponse.statusCode == 400) {
        NSError *jsonDeserializationError;
        NSDictionary<NSString *, NSObject <NSCopying> *> *json =
            [NSJSONSerialization JSONObjectWithData:data options:0 error:&jsonDeserializationError];

        // if the HTTP 400 response parses as JSON and has an 'error' key, it's an OAuth error
        // these errors are special as they indicate a problem with the authorization grant
        if (json[OIDOAuthErrorFieldError]) {
          NSError *oauthError =
              [OIDErrorUtilities OAuthErrorWithDomain:OIDOAuthRegistrationErrorDomain
                                        OAuthResponse:json
                                      underlyingError:serverError];
          dispatch_async(dispatch_get_main_queue(), ^{
            completion(nil, oauthError);
          });
          return;
        }
      }

      // not an OAuth error, just a generic server error
      NSError *returnedError = [OIDErrorUtilities errorWithCode:OIDErrorCodeServerError
                                                underlyingError:serverError
                                                    description:nil];
      dispatch_async(dispatch_get_main_queue(), ^{
        completion(nil, returnedError);
      });
      return;
    }

    NSError *jsonDeserializationError;
    NSDictionary<NSString *, NSObject <NSCopying> *> *json =
        [NSJSONSerialization JSONObjectWithData:data options:0 error:&jsonDeserializationError];
    if (jsonDeserializationError) {
      // A problem occurred deserializing the response/JSON.
      NSError *returnedError = [OIDErrorUtilities errorWithCode:OIDErrorCodeJSONDeserializationError
                                                underlyingError:jsonDeserializationError
                                                    description:nil];
      dispatch_async(dispatch_get_main_queue(), ^{
        completion(nil, returnedError);
      });
      return;
    }

    OIDRegistrationResponse *registrationResponse =
        [[OIDRegistrationResponse alloc] initWithRequest:request
                                              parameters:json];
    if (!registrationResponse) {
      // A problem occurred constructing the registration response from the JSON.
      NSError *returnedError =
          [OIDErrorUtilities errorWithCode:OIDErrorCodeRegistrationResponseConstructionError
                           underlyingError:jsonDeserializationError
                               description:nil];
      dispatch_async(dispatch_get_main_queue(), ^{
        completion(nil, returnedError);
      });
      return;
    }

    // Success
    dispatch_async(dispatch_get_main_queue(), ^{
      completion(registrationResponse, nil);
    });
  }] resume];
}

@end

NS_ASSUME_NONNULL_END
