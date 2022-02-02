package com.rnappauth;

import android.app.Activity;
import android.app.PendingIntent;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.content.ActivityNotFoundException;
import androidx.annotation.Nullable;
import androidx.browser.customtabs.CustomTabsCallback;
import androidx.browser.customtabs.CustomTabsClient;
import androidx.browser.customtabs.CustomTabsServiceConnection;
import androidx.browser.customtabs.CustomTabsSession;

import com.facebook.react.bridge.ActivityEventListener;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.ReadableType;

import com.rnappauth.utils.MapUtil;
import com.rnappauth.utils.UnsafeConnectionBuilder;
import com.rnappauth.utils.RegistrationResponseFactory;
import com.rnappauth.utils.TokenResponseFactory;
import com.rnappauth.utils.EndSessionResponseFactory;
import com.rnappauth.utils.CustomConnectionBuilder;

import net.openid.appauth.AppAuthConfiguration;
import net.openid.appauth.AuthorizationException;
import net.openid.appauth.AuthorizationRequest;
import net.openid.appauth.AuthorizationResponse;
import net.openid.appauth.AuthorizationService;
import net.openid.appauth.AuthorizationServiceConfiguration;
import net.openid.appauth.ClientAuthentication;
import net.openid.appauth.ClientSecretBasic;
import net.openid.appauth.ClientSecretPost;
import net.openid.appauth.CodeVerifierUtil;
import net.openid.appauth.RegistrationRequest;
import net.openid.appauth.RegistrationResponse;
import net.openid.appauth.ResponseTypeValues;
import net.openid.appauth.TokenResponse;
import net.openid.appauth.TokenRequest;
import net.openid.appauth.EndSessionRequest;
import net.openid.appauth.EndSessionResponse;
import net.openid.appauth.connectivity.ConnectionBuilder;
import net.openid.appauth.connectivity.DefaultConnectionBuilder;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CountDownLatch;

public class RNAppAuthModule extends ReactContextBaseJavaModule implements ActivityEventListener {

    public static final String CUSTOM_TAB_PACKAGE_NAME = "com.android.chrome";

    private final ReactApplicationContext reactContext;
    private Promise promise;
    private boolean dangerouslyAllowInsecureHttpRequests;
    private Boolean skipCodeExchange;
    private Boolean usePKCE;
    private Boolean useNonce;
    private String codeVerifier;
    private String clientAuthMethod = "basic";
    private Map<String, String> registrationRequestHeaders = null;
    private Map<String, String> authorizationRequestHeaders = null;
    private Map<String, String> tokenRequestHeaders = null;
    private Map<String, String> additionalParametersMap;
    private String clientSecret;
    private final ConcurrentHashMap<String, AuthorizationServiceConfiguration> mServiceConfigurations = new ConcurrentHashMap<>();
    private boolean isPrefetched = false;

    public RNAppAuthModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
        reactContext.addActivityEventListener(this);
    }

    @ReactMethod
    public void prefetchConfiguration(
            final Boolean warmAndPrefetchChrome,
            final String issuer,
            final String redirectUrl,
            final String clientId,
            final ReadableArray scopes,
            final ReadableMap serviceConfiguration,
            final boolean dangerouslyAllowInsecureHttpRequests,
            final ReadableMap headers,
            final Double connectionTimeoutMillis,
            final Promise promise
    ) {
        if (warmAndPrefetchChrome) {
            warmChromeCustomTab(reactContext, issuer);
        }

        this.parseHeaderMap(headers);
        final ConnectionBuilder builder = createConnectionBuilder(dangerouslyAllowInsecureHttpRequests, this.authorizationRequestHeaders, connectionTimeoutMillis);
        final CountDownLatch fetchConfigurationLatch = new CountDownLatch(1);

        if(!isPrefetched) {
            if (serviceConfiguration != null && !this.hasServiceConfiguration(issuer)) {
                try {
                    setServiceConfiguration(issuer, createAuthorizationServiceConfiguration(serviceConfiguration));
                    isPrefetched = true;
                    fetchConfigurationLatch.countDown();
                } catch (Exception e) {
                    promise.reject("configuration_error", "Failed to convert serviceConfiguration", e);
                }
            } else if (!hasServiceConfiguration(issuer)) {
                final Uri issuerUri = Uri.parse(issuer);
                AuthorizationServiceConfiguration.fetchFromUrl(
                        buildConfigurationUriFromIssuer(issuerUri),
                        new AuthorizationServiceConfiguration.RetrieveConfigurationCallback() {
                            public void onFetchConfigurationCompleted(
                                    @Nullable AuthorizationServiceConfiguration fetchedConfiguration,
                                    @Nullable AuthorizationException ex) {
                                if (ex != null) {
                                    promise.reject("service_configuration_fetch_error", "Failed to fetch configuration", ex);
                                    return;
                                }
                                setServiceConfiguration(issuer, fetchedConfiguration);
                                isPrefetched = true;
                                fetchConfigurationLatch.countDown();
                            }
                        },
                        builder
                );
            }
        } else {
            fetchConfigurationLatch.countDown();
        }

        try {
            fetchConfigurationLatch.await();
            promise.resolve(isPrefetched);
        } catch (Exception e) {
            promise.reject("service_configuration_fetch_error", "Failed to await fetch configuration", e);
        }
    }

    @ReactMethod
    public void register(
            String issuer,
            final ReadableArray redirectUris,
            final ReadableArray responseTypes,
            final ReadableArray grantTypes,
            final String subjectType,
            final String tokenEndpointAuthMethod,
            final ReadableMap additionalParameters,
            final ReadableMap serviceConfiguration,
            final Double connectionTimeoutMillis,
            final boolean dangerouslyAllowInsecureHttpRequests,
            final ReadableMap headers,
            final Promise promise
    ) {
        this.parseHeaderMap(headers);
        final ConnectionBuilder builder = createConnectionBuilder(dangerouslyAllowInsecureHttpRequests, this.registrationRequestHeaders, connectionTimeoutMillis);
        final AppAuthConfiguration appAuthConfiguration = this.createAppAuthConfiguration(builder, dangerouslyAllowInsecureHttpRequests);
        final HashMap<String, String> additionalParametersMap = MapUtil.readableMapToHashMap(additionalParameters);

        // when serviceConfiguration is provided, we don't need to hit up the OpenID well-known id endpoint
        if (serviceConfiguration != null || hasServiceConfiguration(issuer)) {
            try {
                final AuthorizationServiceConfiguration serviceConfig = hasServiceConfiguration(issuer)? getServiceConfiguration(issuer) : createAuthorizationServiceConfiguration(serviceConfiguration);
                registerWithConfiguration(
                        serviceConfig,
                        appAuthConfiguration,
                        redirectUris,
                        responseTypes,
                        grantTypes,
                        subjectType,
                        tokenEndpointAuthMethod,
                        additionalParametersMap,
                        promise
                );
            } catch (Exception e) {
                promise.reject("registration_failed", e.getMessage());
            }
        } else {
            final Uri issuerUri = Uri.parse(issuer);
            AuthorizationServiceConfiguration.fetchFromUrl(
                    buildConfigurationUriFromIssuer(issuerUri),
                    new AuthorizationServiceConfiguration.RetrieveConfigurationCallback() {
                        public void onFetchConfigurationCompleted(
                                @Nullable AuthorizationServiceConfiguration fetchedConfiguration,
                                @Nullable AuthorizationException ex) {
                            if (ex != null) {
                                promise.reject("service_configuration_fetch_error", ex.getLocalizedMessage(), ex);
                                return;
                            }

                            setServiceConfiguration(issuer, fetchedConfiguration);

                            registerWithConfiguration(
                                    fetchedConfiguration,
                                    appAuthConfiguration,
                                    redirectUris,
                                    responseTypes,
                                    grantTypes,
                                    subjectType,
                                    tokenEndpointAuthMethod,
                                    additionalParametersMap,
                                    promise
                            );
                        }
                    },
                    builder);
        }
    }

    @ReactMethod
    public void authorize(
            String issuer,
            final String redirectUrl,
            final String clientId,
            final String clientSecret,
            final ReadableArray scopes,
            final ReadableMap additionalParameters,
            final ReadableMap serviceConfiguration,
            final Boolean skipCodeExchange,
            final Double connectionTimeoutMillis,
            final Boolean useNonce,
            final Boolean usePKCE,
            final String clientAuthMethod,
            final boolean dangerouslyAllowInsecureHttpRequests,
            final ReadableMap headers,
            final Promise promise
    ) {
        this.parseHeaderMap(headers);
        final ConnectionBuilder builder = createConnectionBuilder(dangerouslyAllowInsecureHttpRequests, this.authorizationRequestHeaders, connectionTimeoutMillis);
        final AppAuthConfiguration appAuthConfiguration = this.createAppAuthConfiguration(builder, dangerouslyAllowInsecureHttpRequests);
        final HashMap<String, String> additionalParametersMap = MapUtil.readableMapToHashMap(additionalParameters);

        // store args in private fields for later use in onActivityResult handler
        this.promise = promise;
        this.dangerouslyAllowInsecureHttpRequests = dangerouslyAllowInsecureHttpRequests;
        this.additionalParametersMap = additionalParametersMap;
        this.clientSecret = clientSecret;
        this.clientAuthMethod = clientAuthMethod;
        this.skipCodeExchange = skipCodeExchange;
        this.useNonce = useNonce;
        this.usePKCE = usePKCE;

        // when serviceConfiguration is provided, we don't need to hit up the OpenID well-known id endpoint
        if (serviceConfiguration != null || hasServiceConfiguration(issuer)) {
            try {
                final AuthorizationServiceConfiguration serviceConfig = hasServiceConfiguration(issuer) ? getServiceConfiguration(issuer) : createAuthorizationServiceConfiguration(serviceConfiguration);
                authorizeWithConfiguration(
                        serviceConfig,
                        appAuthConfiguration,
                        clientId,
                        scopes,
                        redirectUrl,
                        useNonce,
                        usePKCE,
                        additionalParametersMap
                );
            } catch (ActivityNotFoundException e) {
                promise.reject("browser_not_found", e.getMessage());
            } catch (Exception e) {
                promise.reject("authentication_failed", e.getMessage());
            }
        } else {
            final Uri issuerUri = Uri.parse(issuer);
            AuthorizationServiceConfiguration.fetchFromUrl(
                    buildConfigurationUriFromIssuer(issuerUri),
                    new AuthorizationServiceConfiguration.RetrieveConfigurationCallback() {
                        public void onFetchConfigurationCompleted(
                                @Nullable AuthorizationServiceConfiguration fetchedConfiguration,
                                @Nullable AuthorizationException ex) {
                            if (ex != null) {
                                promise.reject("service_configuration_fetch_error", ex.getLocalizedMessage(), ex);
                                return;
                            }

                            setServiceConfiguration(issuer, fetchedConfiguration);

                            try {
                                authorizeWithConfiguration(
                                        fetchedConfiguration,
                                        appAuthConfiguration,
                                        clientId,
                                        scopes,
                                        redirectUrl,
                                        useNonce,
                                        usePKCE,
                                        additionalParametersMap
                                );
                            } catch (ActivityNotFoundException e) {
                                promise.reject("browser_not_found", e.getMessage());
                            } catch (Exception e) {
                                promise.reject("authentication_failed", e.getMessage());
                            }
                        }
                    },
                    builder
            );
        }




    }

    @ReactMethod
    public void refresh(
            String issuer,
            final String redirectUrl,
            final String clientId,
            final String clientSecret,
            final String refreshToken,
            final ReadableArray scopes,
            final ReadableMap additionalParameters,
            final ReadableMap serviceConfiguration,
            final Double connectionTimeoutMillis,
            final String clientAuthMethod,
            final boolean dangerouslyAllowInsecureHttpRequests,
            final ReadableMap headers,
            final Promise promise
    ) {
        this.parseHeaderMap(headers);
        final ConnectionBuilder builder = createConnectionBuilder(dangerouslyAllowInsecureHttpRequests, this.tokenRequestHeaders, connectionTimeoutMillis);
        final AppAuthConfiguration appAuthConfiguration = createAppAuthConfiguration(builder, dangerouslyAllowInsecureHttpRequests);
        final HashMap<String, String> additionalParametersMap = MapUtil.readableMapToHashMap(additionalParameters);

        if (clientSecret != null) {
            additionalParametersMap.put("client_secret", clientSecret);
        }

        // store setting in private field for later use in onActivityResult handler
        this.dangerouslyAllowInsecureHttpRequests = dangerouslyAllowInsecureHttpRequests;
        this.additionalParametersMap = additionalParametersMap;

        // when serviceConfiguration is provided, we don't need to hit up the OpenID well-known id endpoint
        if (serviceConfiguration != null || hasServiceConfiguration(issuer)) {
            try {
                final AuthorizationServiceConfiguration serviceConfig = hasServiceConfiguration(issuer) ? getServiceConfiguration(issuer) : createAuthorizationServiceConfiguration(serviceConfiguration);
                refreshWithConfiguration(
                        serviceConfig,
                        appAuthConfiguration,
                        refreshToken,
                        clientId,
                        scopes,
                        redirectUrl,
                        additionalParametersMap,
                        clientAuthMethod,
                        clientSecret,
                        promise
                );
            } catch (ActivityNotFoundException e) {
                promise.reject("browser_not_found", e.getMessage());
            } catch (Exception e) {
                promise.reject("token_refresh_failed", e.getMessage());
            }
        } else {
            final Uri issuerUri = Uri.parse(issuer);
            AuthorizationServiceConfiguration.fetchFromUrl(
                    buildConfigurationUriFromIssuer(issuerUri),
                    new AuthorizationServiceConfiguration.RetrieveConfigurationCallback() {
                        public void onFetchConfigurationCompleted(
                                @Nullable AuthorizationServiceConfiguration fetchedConfiguration,
                                @Nullable AuthorizationException ex) {
                            if (ex != null) {
                                promise.reject("service_configuration_fetch_error", ex.getLocalizedMessage(), ex);
                                return;
                            }

                            setServiceConfiguration(issuer, fetchedConfiguration);

                            try {
                                refreshWithConfiguration(
                                        fetchedConfiguration,
                                        appAuthConfiguration,
                                        refreshToken,
                                        clientId,
                                        scopes,
                                        redirectUrl,
                                        additionalParametersMap,
                                        clientAuthMethod,
                                        clientSecret,
                                        promise
                                );
                            } catch (ActivityNotFoundException e) {
                                promise.reject("browser_not_found", e.getMessage());
                            } catch (Exception e) {
                                promise.reject("token_refresh_failed", e.getMessage());
                            }
                        }
                    },
                    builder);
        }

    }

    @ReactMethod
    public void logout(
            String issuer,
            final String idTokenHint,
            final String postLogoutRedirectUri,
            final ReadableMap serviceConfiguration,
            final ReadableMap additionalParameters,
            final boolean dangerouslyAllowInsecureHttpRequests,
            final Promise promise
    ) {
        final ConnectionBuilder builder = createConnectionBuilder(dangerouslyAllowInsecureHttpRequests, null);
        final AppAuthConfiguration appAuthConfiguration = this.createAppAuthConfiguration(builder, dangerouslyAllowInsecureHttpRequests);
        final HashMap<String, String> additionalParametersMap = MapUtil.readableMapToHashMap(additionalParameters);

        this.promise = promise;

        if (serviceConfiguration != null || hasServiceConfiguration(issuer)) {
            try {
                final AuthorizationServiceConfiguration serviceConfig = hasServiceConfiguration(issuer) ? getServiceConfiguration(issuer) : createAuthorizationServiceConfiguration(serviceConfiguration);
                endSessionWithConfiguration(
                        serviceConfig,
                        appAuthConfiguration,
                        idTokenHint,
                        postLogoutRedirectUri,
                        additionalParametersMap
                );
            } catch (ActivityNotFoundException e) {
                promise.reject("browser_not_found", e.getMessage());
            } catch (Exception e) {
                promise.reject("end_session_failed", e.getMessage());
            }
        } else {
            final Uri issuerUri = Uri.parse(issuer);
            AuthorizationServiceConfiguration.fetchFromUrl(
                    buildConfigurationUriFromIssuer(issuerUri),
                    new AuthorizationServiceConfiguration.RetrieveConfigurationCallback() {
                        public void onFetchConfigurationCompleted(
                                @Nullable AuthorizationServiceConfiguration fetchedConfiguration,
                                @Nullable AuthorizationException ex) {
                            if (ex != null) {
                                promise.reject("service_configuration_fetch_error", ex.getLocalizedMessage(), ex);
                                return;
                            }

                            setServiceConfiguration(issuer, fetchedConfiguration);

                            try {
                                endSessionWithConfiguration(
                                        fetchedConfiguration,
                                        appAuthConfiguration,
                                        idTokenHint,
                                        postLogoutRedirectUri,
                                        additionalParametersMap
                                );
                            } catch (ActivityNotFoundException e) {
                                promise.reject("browser_not_found", e.getMessage());
                            } catch (Exception e) {
                                promise.reject("end_session_failed", e.getMessage());
                            }
                        }
                    },
                    builder
            );
        }
    }

    /*
     * Called when the OAuth browser activity completes
     */
    @Override
    public void onActivityResult(Activity activity, int requestCode, int resultCode, Intent data) {
        if (requestCode == 52) {
            if (data == null) {
                if (promise != null) {
                    promise.reject("authentication_error", "Data intent is null" );
                }
                return;
            }

            final AuthorizationResponse response = AuthorizationResponse.fromIntent(data);
            AuthorizationException ex = AuthorizationException.fromIntent(data);
            if (ex != null) {
                if (promise != null) {
                    handleAuthorizationException("authentication_error", ex, promise);
                }
                return;
            }

            if (this.skipCodeExchange) {
                WritableMap map;
                if (this.usePKCE && this.codeVerifier != null) {
                    map = TokenResponseFactory.authorizationCodeResponseToMap(response, this.codeVerifier);
                } else {
                    map = TokenResponseFactory.authorizationResponseToMap(response);
                }

                if (promise != null) {
                    promise.resolve(map);
                }
                return;
            }


            final Promise authorizePromise = this.promise;
            final AppAuthConfiguration configuration = createAppAuthConfiguration(
                    createConnectionBuilder(this.dangerouslyAllowInsecureHttpRequests, this.tokenRequestHeaders),
                    this.dangerouslyAllowInsecureHttpRequests
            );

            AuthorizationService authService = new AuthorizationService(this.reactContext, configuration);

            TokenRequest tokenRequest = response.createTokenExchangeRequest(this.additionalParametersMap);

            AuthorizationService.TokenResponseCallback tokenResponseCallback = new AuthorizationService.TokenResponseCallback() {

                @Override
                public void onTokenRequestCompleted(
                        TokenResponse resp, AuthorizationException ex) {
                    if (resp != null) {
                        WritableMap map = TokenResponseFactory.tokenResponseToMap(resp, response);
                        if (authorizePromise != null) {
                            authorizePromise.resolve(map);
                        }
                    } else {
                        if (promise != null) {
                            handleAuthorizationException("token_exchange_failed", ex, promise);
                        }
                    }
                }
            };

            if (this.clientSecret != null) {
                ClientAuthentication clientAuth = this.getClientAuthentication(this.clientSecret, this.clientAuthMethod);
                authService.performTokenRequest(tokenRequest, clientAuth, tokenResponseCallback);

            } else {
                authService.performTokenRequest(tokenRequest, tokenResponseCallback);
            }

        }

        if (requestCode == 53) {
            if (data == null) {
                if (promise != null) {
                    promise.reject("end_session_failed", "Data intent is null" );
                }
                return;
            }
            EndSessionResponse response = EndSessionResponse.fromIntent(data);
            AuthorizationException ex = AuthorizationException.fromIntent(data);
            if (ex != null) {
                if (promise != null) {
                    handleAuthorizationException("end_session_failed", ex, promise);
                }
                return;
            }
            final Promise endSessionPromise = this.promise;
            WritableMap map = EndSessionResponseFactory.endSessionResponseToMap(response);
            endSessionPromise.resolve(map);
        }
    }

    /*
     * Perform dynamic client registration with the provided configuration
     */
    private void registerWithConfiguration(
            final AuthorizationServiceConfiguration serviceConfiguration,
            final AppAuthConfiguration appAuthConfiguration,
            final ReadableArray redirectUris,
            final ReadableArray responseTypes,
            final ReadableArray grantTypes,
            final String subjectType,
            final String tokenEndpointAuthMethod,
            final Map<String, String> additionalParametersMap,
            final Promise promise
    ) {
        final Context context = this.reactContext;

        AuthorizationService authService = new AuthorizationService(context, appAuthConfiguration);

        RegistrationRequest.Builder registrationRequestBuilder =
                new RegistrationRequest.Builder(
                        serviceConfiguration,
                        arrayToUriList(redirectUris)
                )
                        .setAdditionalParameters(additionalParametersMap);

        if (responseTypes != null) {
            registrationRequestBuilder.setResponseTypeValues(arrayToList(responseTypes));
        }

        if (grantTypes != null) {
            registrationRequestBuilder.setGrantTypeValues(arrayToList(grantTypes));
        }

        if (subjectType != null) {
            registrationRequestBuilder.setSubjectType(subjectType);
        }

        if (tokenEndpointAuthMethod != null) {
            registrationRequestBuilder.setTokenEndpointAuthenticationMethod(tokenEndpointAuthMethod);
        }

        RegistrationRequest registrationRequest = registrationRequestBuilder.build();

        AuthorizationService.RegistrationResponseCallback registrationResponseCallback = new AuthorizationService.RegistrationResponseCallback() {
            @Override
            public void onRegistrationRequestCompleted(@Nullable RegistrationResponse response, @Nullable AuthorizationException ex) {
                if (response != null) {
                    WritableMap map = RegistrationResponseFactory.registrationResponseToMap(response);
                    promise.resolve(map);
                } else {
                    handleAuthorizationException("registration_failed", ex, promise);
                }
            }
        };

        authService.performRegistrationRequest(registrationRequest, registrationResponseCallback);
    }

    /*
     * Authorize user with the provided configuration
     */
    private void authorizeWithConfiguration(
            final AuthorizationServiceConfiguration serviceConfiguration,
            final AppAuthConfiguration appAuthConfiguration,
            final String clientId,
            final ReadableArray scopes,
            final String redirectUrl,
            final Boolean useNonce,
            final Boolean usePKCE,
            final Map<String, String> additionalParametersMap
    ) {

        String scopesString = null;

        if (scopes != null) {
            scopesString = this.arrayToString(scopes);
        }

        final Context context = this.reactContext;
        final Activity currentActivity = getCurrentActivity();

        AuthorizationRequest.Builder authRequestBuilder =
                new AuthorizationRequest.Builder(
                        serviceConfiguration,
                        clientId,
                        ResponseTypeValues.CODE,
                        Uri.parse(redirectUrl)
                );

        if (scopesString != null) {
            authRequestBuilder.setScope(scopesString);
        }

        if (additionalParametersMap != null) {
            // handle additional parameters separately to avoid exceptions from AppAuth
            if (additionalParametersMap.containsKey("display")) {
                authRequestBuilder.setDisplay(additionalParametersMap.get("display"));
                additionalParametersMap.remove("display");
            }
            if (additionalParametersMap.containsKey("login_hint")) {
                authRequestBuilder.setLoginHint(additionalParametersMap.get("login_hint"));
                additionalParametersMap.remove("login_hint");
            }
            if (additionalParametersMap.containsKey("prompt")) {
                authRequestBuilder.setPrompt(additionalParametersMap.get("prompt"));
                additionalParametersMap.remove("prompt");
            }
            if (additionalParametersMap.containsKey("state")) {
                authRequestBuilder.setState(additionalParametersMap.get("state"));
                additionalParametersMap.remove("state");
            }

            authRequestBuilder.setAdditionalParameters(additionalParametersMap);
        }

        if (!usePKCE) {
            authRequestBuilder.setCodeVerifier(null);
        } else {
            this.codeVerifier = CodeVerifierUtil.generateRandomCodeVerifier();
            authRequestBuilder.setCodeVerifier(this.codeVerifier);
        }

        if(!useNonce) {
            authRequestBuilder.setNonce(null);
        }

        AuthorizationRequest authRequest = authRequestBuilder.build();

        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.LOLLIPOP) {
            AuthorizationService authService = new AuthorizationService(context, appAuthConfiguration);
            Intent authIntent = authService.getAuthorizationRequestIntent(authRequest);

            currentActivity.startActivityForResult(authIntent, 52);
        } else {
            AuthorizationService authService = new AuthorizationService(currentActivity, appAuthConfiguration);
            PendingIntent pendingIntent = currentActivity.createPendingResult(52, new Intent(), 0);

            authService.performAuthorizationRequest(authRequest, pendingIntent);
        }
    }

    /*
     * Refresh authentication token with the provided configuration
     */
    private void refreshWithConfiguration(
            final AuthorizationServiceConfiguration serviceConfiguration,
            final AppAuthConfiguration appAuthConfiguration,
            final String refreshToken,
            final String clientId,
            final ReadableArray scopes,
            final String redirectUrl,
            final Map<String, String> additionalParametersMap,
            final String clientAuthMethod,
            final String clientSecret,
            final Promise promise
    ) {

        String scopesString = null;

        if (scopes != null) {
            scopesString = this.arrayToString(scopes);
        }

        final Context context = this.reactContext;

        TokenRequest.Builder tokenRequestBuilder =
                new TokenRequest.Builder(
                        serviceConfiguration,
                        clientId
                )
                        .setRefreshToken(refreshToken)
                        .setRedirectUri(Uri.parse(redirectUrl));

        if (scopesString != null) {
            tokenRequestBuilder.setScope(scopesString);
        }

        if (!additionalParametersMap.isEmpty()) {
            tokenRequestBuilder.setAdditionalParameters(additionalParametersMap);
        }

        TokenRequest tokenRequest = tokenRequestBuilder.build();

        AuthorizationService authService = new AuthorizationService(context, appAuthConfiguration);

        AuthorizationService.TokenResponseCallback tokenResponseCallback = new AuthorizationService.TokenResponseCallback() {
            @Override
            public void onTokenRequestCompleted(@Nullable TokenResponse response, @Nullable AuthorizationException ex) {
                if (response != null) {
                    WritableMap map = TokenResponseFactory.tokenResponseToMap(response);
                    promise.resolve(map);
                } else {
                    handleAuthorizationException("token_refresh_failed", ex, promise);
                }
            }
        };


        if (clientSecret != null) {
            ClientAuthentication clientAuth = this.getClientAuthentication(clientSecret, clientAuthMethod);
            authService.performTokenRequest(tokenRequest, clientAuth, tokenResponseCallback);

        } else {
            authService.performTokenRequest(tokenRequest, tokenResponseCallback);
        }
    }

    /*
     * End user session with provided configuration
     */
    private void endSessionWithConfiguration(
            final AuthorizationServiceConfiguration serviceConfiguration,
            final AppAuthConfiguration appAuthConfiguration,
            final String idTokenHint,
            final String postLogoutRedirectUri,
            final Map<String, String> additionalParametersMap
    ) {
        final Context context = this.reactContext;
        final Activity currentActivity = getCurrentActivity();

        EndSessionRequest.Builder endSessionRequestBuilder =
                new EndSessionRequest.Builder(
                        serviceConfiguration,
                        idTokenHint,
                        Uri.parse(postLogoutRedirectUri)
                );

        if (additionalParametersMap != null) {
            if (additionalParametersMap.containsKey("state")) {
                endSessionRequestBuilder.setState(additionalParametersMap.get("state"));
            }
        }

        EndSessionRequest endSessionRequest = endSessionRequestBuilder.build();

        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.LOLLIPOP) {
            AuthorizationService authService = new AuthorizationService(context, appAuthConfiguration);
            Intent endSessionIntent = authService.getEndSessionRequestIntent(endSessionRequest);

            currentActivity.startActivityForResult(endSessionIntent, 53);
        } else {
            AuthorizationService authService = new AuthorizationService(currentActivity, appAuthConfiguration);
            PendingIntent pendingIntent = currentActivity.createPendingResult(53, new Intent(), 0);

            authService.performEndSessionRequest(endSessionRequest, pendingIntent);
        }
    }

    private void parseHeaderMap (ReadableMap headerMap) {
        if (headerMap == null) {
            return;
        }
        if (headerMap.hasKey("register") && headerMap.getType("register") == ReadableType.Map) {
            this.registrationRequestHeaders = MapUtil.readableMapToHashMap(headerMap.getMap("register"));
        }
        if (headerMap.hasKey("authorize") && headerMap.getType("authorize") == ReadableType.Map) {
            this.authorizationRequestHeaders = MapUtil.readableMapToHashMap(headerMap.getMap("authorize"));
        }
        if (headerMap.hasKey("token") && headerMap.getType("token") == ReadableType.Map) {
            this.tokenRequestHeaders = MapUtil.readableMapToHashMap(headerMap.getMap("token"));
        }

    }

    private ClientAuthentication getClientAuthentication(String clientSecret, String clientAuthMethod) {
        if (clientAuthMethod.equals("post")) {
            return new ClientSecretPost(clientSecret);
        }

        return new ClientSecretBasic(clientSecret);
    }

    /*
     * Create a space-delimited string from an array
     */
    private String arrayToString(ReadableArray array) {
        StringBuilder strBuilder = new StringBuilder();
        for (int i = 0; i < array.size(); i++) {
            if (i != 0) {
                strBuilder.append(' ');
            }
            strBuilder.append(array.getString(i));
        }
        return strBuilder.toString();
    }

    /*
     * Create a string list from an array of strings
     */
    private List<String> arrayToList(ReadableArray array) {
        ArrayList<String> list = new ArrayList<>();
        for (int i = 0; i < array.size(); i++) {
            list.add(array.getString(i));
        }
        return list;
    }

    /*
     * Create a Uri list from an array of strings
     */
    private List<Uri> arrayToUriList(ReadableArray array) {
        ArrayList<Uri> list = new ArrayList<>();
        for (int i = 0; i < array.size(); i++) {
            list.add(Uri.parse(array.getString(i)));
        }
        return list;
    }

    /*
     * Create an App Auth configuration using the provided connection builder
     */
    private AppAuthConfiguration createAppAuthConfiguration(
            ConnectionBuilder connectionBuilder,
            Boolean skipIssuerHttpsCheck
    ) {
        return new AppAuthConfiguration
                .Builder()
                .setConnectionBuilder(connectionBuilder)
                .setSkipIssuerHttpsCheck(skipIssuerHttpsCheck)
                .build();
    }

    /*
     *  Create appropriate connection builder based on provided settings
     */
    private ConnectionBuilder createConnectionBuilder(boolean allowInsecureConnections, Map<String, String> headers, Double connectionTimeoutMillis) {
        ConnectionBuilder proxiedBuilder;

        if (allowInsecureConnections) {
            proxiedBuilder =UnsafeConnectionBuilder.INSTANCE;
        } else {
            proxiedBuilder = DefaultConnectionBuilder.INSTANCE;
        }

        CustomConnectionBuilder customConnection = new CustomConnectionBuilder(proxiedBuilder);
        
        if (headers != null) {
            customConnection.setHeaders(headers);
        }

        customConnection.setConnectionTimeout(connectionTimeoutMillis.intValue());

        return customConnection;
    }

    private ConnectionBuilder createConnectionBuilder(boolean allowInsecureConnections, Map<String, String> headers) {
        ConnectionBuilder proxiedBuilder;

        if (allowInsecureConnections) {
            proxiedBuilder = UnsafeConnectionBuilder.INSTANCE;
        } else {
            proxiedBuilder = DefaultConnectionBuilder.INSTANCE;
        }

        CustomConnectionBuilder customConnection = new CustomConnectionBuilder(proxiedBuilder);
        
        if (headers != null) {
            customConnection.setHeaders(headers);
        }

        return customConnection;
    }

    /*
     *  Replicated private method from AuthorizationServiceConfiguration
     */
    private Uri buildConfigurationUriFromIssuer(Uri openIdConnectIssuerUri) {
        return openIdConnectIssuerUri.buildUpon()
                .appendPath(AuthorizationServiceConfiguration.WELL_KNOWN_PATH)
                .appendPath(AuthorizationServiceConfiguration.OPENID_CONFIGURATION_RESOURCE)
                .build();
    }

    private AuthorizationServiceConfiguration createAuthorizationServiceConfiguration(ReadableMap serviceConfiguration) throws Exception {
        if (!serviceConfiguration.hasKey("authorizationEndpoint")) {
            throw new Exception("serviceConfiguration passed without an authorizationEndpoint");
        }

        if (!serviceConfiguration.hasKey("tokenEndpoint")) {
            throw new Exception("serviceConfiguration passed without a tokenEndpoint");
        }

        Uri authorizationEndpoint = Uri.parse(serviceConfiguration.getString("authorizationEndpoint"));
        Uri tokenEndpoint = Uri.parse(serviceConfiguration.getString("tokenEndpoint"));
        Uri registrationEndpoint = null;
        Uri endSessionEndpoint = null;
        if (serviceConfiguration.hasKey("registrationEndpoint")) {
            registrationEndpoint = Uri.parse(serviceConfiguration.getString("registrationEndpoint"));
        }
        if (serviceConfiguration.hasKey("endSessionEndpoint")) {
            endSessionEndpoint = Uri.parse(serviceConfiguration.getString("endSessionEndpoint"));
        }

        return new AuthorizationServiceConfiguration(
                authorizationEndpoint,
                tokenEndpoint,
                registrationEndpoint,
                endSessionEndpoint
        );
    }

    private void warmChromeCustomTab(Context context, final String issuer) {
        CustomTabsServiceConnection connection = new CustomTabsServiceConnection() {
            @Override
            public void onCustomTabsServiceConnected(ComponentName name, CustomTabsClient client) {
                client.warmup(0);
                CustomTabsSession session = client.newSession(new CustomTabsCallback());
                if (session == null) {
                    return;
                }
                session.mayLaunchUrl(Uri.parse(issuer), null, Collections.<Bundle>emptyList());
            }

            @Override
            public void onServiceDisconnected(ComponentName name) {

            }
        };
        CustomTabsClient.bindCustomTabsService(context, CUSTOM_TAB_PACKAGE_NAME, connection);
    }

    private boolean hasServiceConfiguration(@Nullable String issuer) {
        return issuer != null && mServiceConfigurations.containsKey(issuer);
    }

    private AuthorizationServiceConfiguration getServiceConfiguration(@Nullable String issuer) {
        if (issuer == null) {
            return null;
        } else {
            return mServiceConfigurations.get(issuer);
        }
    }

    private void handleAuthorizationException(final String fallbackErrorCode, final AuthorizationException ex, final Promise promise) {
        if (ex.getLocalizedMessage() == null) {
            promise.reject(fallbackErrorCode, ex.error, ex);
        } else {
            promise.reject(ex.error != null ? ex.error: fallbackErrorCode, ex.getLocalizedMessage(), ex);
        }
    }

    private void setServiceConfiguration(@Nullable String issuer, AuthorizationServiceConfiguration serviceConfiguration) {
        if (issuer != null) {
            mServiceConfigurations.put(issuer, serviceConfiguration);
        }
    }

    @Override
    public void onNewIntent(Intent intent) {

    }

    @Override
    public String getName() {
        return "RNAppAuth";
    }
}
