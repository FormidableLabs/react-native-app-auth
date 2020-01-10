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
import net.openid.appauth.RegistrationRequest;
import net.openid.appauth.RegistrationResponse;
import net.openid.appauth.ResponseTypeValues;
import net.openid.appauth.TokenResponse;
import net.openid.appauth.TokenRequest;
import net.openid.appauth.connectivity.ConnectionBuilder;
import net.openid.appauth.connectivity.DefaultConnectionBuilder;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicReference;
import java.util.concurrent.CountDownLatch;

public class RNAppAuthModule extends ReactContextBaseJavaModule implements ActivityEventListener {

    public static final String CUSTOM_TAB_PACKAGE_NAME = "com.android.chrome";

    private final ReactApplicationContext reactContext;
    private Promise promise;
    private Boolean dangerouslyAllowInsecureHttpRequests;
    private String clientAuthMethod = "basic";
    private Map<String, String> registrationRequestHeaders = null;
    private Map<String, String> authorizationRequestHeaders = null;
    private Map<String, String> tokenRequestHeaders = null;
    private Map<String, String> additionalParametersMap;
    private String clientSecret;
    private final AtomicReference<AuthorizationServiceConfiguration> mServiceConfiguration = new AtomicReference<>();
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
        final Boolean dangerouslyAllowInsecureHttpRequests,
        final ReadableMap headers,
        final Promise promise
    ) {
        if (warmAndPrefetchChrome) {
            warmChromeCustomTab(reactContext, issuer);
        }

        this.parseHeaderMap(headers);
        final ConnectionBuilder builder = createConnectionBuilder(dangerouslyAllowInsecureHttpRequests, this.authorizationRequestHeaders);
        final CountDownLatch fetchConfigurationLatch = new CountDownLatch(1);

        if(!isPrefetched) {
            if (serviceConfiguration != null && mServiceConfiguration.get() == null) {
                try {
                    mServiceConfiguration.set(createAuthorizationServiceConfiguration(serviceConfiguration));
                    isPrefetched = true;
                    fetchConfigurationLatch.countDown();
                } catch (Exception e) {
                    promise.reject("configuration_error", "Failed to convert serviceConfiguration", e);
                }
            } else if (mServiceConfiguration.get() == null) {
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
                                mServiceConfiguration.set(fetchedConfiguration);
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
        final Boolean dangerouslyAllowInsecureHttpRequests,
        final ReadableMap headers,
        final Promise promise
    ) {
        this.parseHeaderMap(headers);
        final ConnectionBuilder builder = createConnectionBuilder(dangerouslyAllowInsecureHttpRequests, this.registrationRequestHeaders);
        final AppAuthConfiguration appAuthConfiguration = this.createAppAuthConfiguration(builder);
        final HashMap<String, String> additionalParametersMap = MapUtil.readableMapToHashMap(additionalParameters);

        // when serviceConfiguration is provided, we don't need to hit up the OpenID well-known id endpoint
        if (serviceConfiguration != null || mServiceConfiguration.get() != null) {
            try {
                final AuthorizationServiceConfiguration serviceConfig = mServiceConfiguration.get() != null ? mServiceConfiguration.get() : createAuthorizationServiceConfiguration(serviceConfiguration);
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
                                promise.reject("service_configuration_fetch_error", getErrorMessage(ex));
                                return;
                            }

                            mServiceConfiguration.set(fetchedConfiguration);

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
            final Boolean usePKCE,
            final String clientAuthMethod,
            final Boolean dangerouslyAllowInsecureHttpRequests,
            final ReadableMap headers,
            final Promise promise
    ) {
        this.parseHeaderMap(headers);
        final ConnectionBuilder builder = createConnectionBuilder(dangerouslyAllowInsecureHttpRequests, this.authorizationRequestHeaders);
        final AppAuthConfiguration appAuthConfiguration = this.createAppAuthConfiguration(builder);
        final HashMap<String, String> additionalParametersMap = MapUtil.readableMapToHashMap(additionalParameters);

        // store args in private fields for later use in onActivityResult handler
        this.promise = promise;
        this.dangerouslyAllowInsecureHttpRequests = dangerouslyAllowInsecureHttpRequests;
        this.additionalParametersMap = additionalParametersMap;
        this.clientSecret = clientSecret;
        this.clientAuthMethod = clientAuthMethod;

        // when serviceConfiguration is provided, we don't need to hit up the OpenID well-known id endpoint
        if (serviceConfiguration != null || mServiceConfiguration.get() != null) {
            try {
                final AuthorizationServiceConfiguration serviceConfig = mServiceConfiguration.get() != null ? mServiceConfiguration.get() : createAuthorizationServiceConfiguration(serviceConfiguration);
                authorizeWithConfiguration(
                        serviceConfig,
                        appAuthConfiguration,
                        clientId,
                        scopes,
                        redirectUrl,
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
                                promise.reject("service_configuration_fetch_error", getErrorMessage(ex));
                                return;
                            }

                            mServiceConfiguration.set(fetchedConfiguration);

                            authorizeWithConfiguration(
                                    fetchedConfiguration,
                                    appAuthConfiguration,
                                    clientId,
                                    scopes,
                                    redirectUrl,
                                    usePKCE,
                                    additionalParametersMap
                            );
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
            final String clientAuthMethod,
            final Boolean dangerouslyAllowInsecureHttpRequests,
            final ReadableMap headers,
            final Promise promise
    ) {
        this.parseHeaderMap(headers);
        final ConnectionBuilder builder = createConnectionBuilder(dangerouslyAllowInsecureHttpRequests, this.tokenRequestHeaders);
        final AppAuthConfiguration appAuthConfiguration = createAppAuthConfiguration(builder);
        final HashMap<String, String> additionalParametersMap = MapUtil.readableMapToHashMap(additionalParameters);

        if (clientSecret != null) {
            additionalParametersMap.put("client_secret", clientSecret);
        }

        // store setting in private field for later use in onActivityResult handler
        this.dangerouslyAllowInsecureHttpRequests = dangerouslyAllowInsecureHttpRequests;
        this.additionalParametersMap = additionalParametersMap;

        // when serviceConfiguration is provided, we don't need to hit up the OpenID well-known id endpoint
        if (serviceConfiguration != null || mServiceConfiguration.get() != null) {
            try {
                final AuthorizationServiceConfiguration serviceConfig = mServiceConfiguration.get() != null ? mServiceConfiguration.get() : createAuthorizationServiceConfiguration(serviceConfiguration);
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
                                promise.reject("service_configuration_fetch_error", getErrorMessage(ex));
                                return;
                            }

                            mServiceConfiguration.set(fetchedConfiguration);

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
                        }
                    },
                    builder);
        }

    }

    /*
     * Called when the OAuth browser activity completes
     */
    @Override
    public void onActivityResult(Activity activity, int requestCode, int resultCode, Intent data) {
        if (requestCode == 0) {
            if (data == null) {
                if (promise != null) {
                    promise.reject("authentication_error", "Data intent is null" );
                }
                return;
            }

            final AuthorizationResponse response = AuthorizationResponse.fromIntent(data);
            AuthorizationException exception = AuthorizationException.fromIntent(data);
            if (exception != null) {
                if (promise != null) {
                    promise.reject("authentication_error", getErrorMessage(exception));
                }
                return;
            }

            final Promise authorizePromise = this.promise;
            final AppAuthConfiguration configuration = createAppAuthConfiguration(
                    createConnectionBuilder(this.dangerouslyAllowInsecureHttpRequests, this.tokenRequestHeaders)
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
                            promise.reject("token_exchange_failed", getErrorMessage(ex));
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
                    promise.reject("registration_failed", getErrorMessage(ex));
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

            authRequestBuilder.setAdditionalParameters(additionalParametersMap);
        }

        if (!usePKCE) {
            authRequestBuilder.setCodeVerifier(null);
        }

        AuthorizationRequest authRequest = authRequestBuilder.build();

        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.LOLLIPOP) {
            AuthorizationService authService = new AuthorizationService(context, appAuthConfiguration);
            Intent authIntent = authService.getAuthorizationRequestIntent(authRequest);

            currentActivity.startActivityForResult(authIntent, 0);
        } else {
            AuthorizationService authService = new AuthorizationService(currentActivity, appAuthConfiguration);
            PendingIntent pendingIntent = currentActivity.createPendingResult(0, new Intent(), 0);

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
                    promise.reject("token_refresh_failed", getErrorMessage(ex));
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
     * Return error information if it is available
     */
    private String getErrorMessage(AuthorizationException ex){
        if(ex.errorDescription == null && ex.error != null)
            return ex.error;
        return ex.errorDescription;
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
    private AppAuthConfiguration createAppAuthConfiguration(ConnectionBuilder connectionBuilder) {
        return new AppAuthConfiguration
                .Builder()
                .setConnectionBuilder(connectionBuilder)
                .build();
    }

    /*
     *  Create appropriate connection builder based on provided settings
     */
    private ConnectionBuilder createConnectionBuilder(Boolean allowInsecureConnections, Map<String, String> headers) {
        ConnectionBuilder proxiedBuilder;

        if (allowInsecureConnections.equals(true)) {
            proxiedBuilder =UnsafeConnectionBuilder.INSTANCE;
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
        if (serviceConfiguration.hasKey("registrationEndpoint")) {
            registrationEndpoint = Uri.parse(serviceConfiguration.getString("registrationEndpoint"));
        }

        return new AuthorizationServiceConfiguration(
                authorizationEndpoint,
                tokenEndpoint,
                registrationEndpoint
        );
    }

    private void warmChromeCustomTab(Context context, final String issuer) {
        CustomTabsServiceConnection connection = new CustomTabsServiceConnection() {
            @Override
            public void onCustomTabsServiceConnected(ComponentName name, CustomTabsClient client) {
                client.warmup(0);
                client.newSession(new CustomTabsCallback()).mayLaunchUrl(Uri.parse(issuer), null, Collections.<Bundle>emptyList());
            }

            @Override
            public void onServiceDisconnected(ComponentName name) {

            }
        };
        CustomTabsClient.bindCustomTabsService(context, CUSTOM_TAB_PACKAGE_NAME, connection);
    }

    @Override
    public void onNewIntent(Intent intent) {

    }

    @Override
    public String getName() {
        return "RNAppAuth";
    }
}
