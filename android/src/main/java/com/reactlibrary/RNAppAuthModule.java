package com.reactlibrary;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.support.annotation.Nullable;

import com.facebook.react.bridge.ActivityEventListener;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.reactlibrary.utils.MapUtils;
import com.reactlibrary.utils.UnsafeConnectionBuilder;

import net.openid.appauth.AppAuthConfiguration;
import net.openid.appauth.AuthorizationException;
import net.openid.appauth.AuthorizationRequest;
import net.openid.appauth.AuthorizationResponse;
import net.openid.appauth.AuthorizationService;
import net.openid.appauth.AuthorizationServiceConfiguration;
import net.openid.appauth.ResponseTypeValues;
import net.openid.appauth.TokenResponse;
import net.openid.appauth.TokenRequest;
import net.openid.appauth.connectivity.ConnectionBuilder;
import net.openid.appauth.connectivity.DefaultConnectionBuilder;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;

public class RNAppAuthModule extends ReactContextBaseJavaModule implements ActivityEventListener {

    private final ReactApplicationContext reactContext;
    private Promise promise;
    private Boolean dangerouslyAllowInsecureHttpRequests;
    private Map<String, String> additionalParametersMap;

    public RNAppAuthModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
        reactContext.addActivityEventListener(this);
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
            final Boolean dangerouslyAllowInsecureHttpRequests,
            final Promise promise
    ) {

        final String scopesString = this.arrayToString(scopes);
        final ConnectionBuilder builder = createConnectionBuilder(dangerouslyAllowInsecureHttpRequests);
        final AppAuthConfiguration appAuthConfiguration = this.createAppAuthConfiguration(builder);
        final HashMap<String, String> additionalParametersMap = MapUtils.readableMapToHashMap(additionalParameters);

        if (clientSecret != null) {
            additionalParametersMap.put("client_secret", clientSecret);
        }

        // store args in private fields for later use in onActivityResult handler
        this.promise = promise;
        this.dangerouslyAllowInsecureHttpRequests = dangerouslyAllowInsecureHttpRequests;
        this.additionalParametersMap = additionalParametersMap;

        // when serviceConfiguration is provided, we don't need to hit up the OpenID well-known id endpoint
        if (serviceConfiguration != null) {
            try {
                authorizeWithConfiguration(
                        createAuthorizationServiceConfiguration(serviceConfiguration),
                        appAuthConfiguration,
                        clientId,
                        scopesString,
                        redirectUrl,
                        additionalParametersMap
                );
            } catch (Exception e) {
                promise.reject(e);
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
                                promise.reject("RNAppAuth Error", "Failed to fetch configuration", ex);
                                return;
                            }

                            authorizeWithConfiguration(
                                    fetchedConfiguration,
                                    appAuthConfiguration,
                                    clientId,
                                    scopesString,
                                    redirectUrl,
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
            final Boolean dangerouslyAllowInsecureHttpRequests,
            final Promise promise
    ) {
        final Context context = this.reactContext;
        final String scopesString = this.arrayToString(scopes);
        final Uri issuerUri = Uri.parse(issuer);
        final ConnectionBuilder builder = createConnectionBuilder(dangerouslyAllowInsecureHttpRequests);
        final AppAuthConfiguration appAuthConfiguration = createAppAuthConfiguration(builder);
        final HashMap<String, String> additionalParametersMap = MapUtils.readableMapToHashMap(additionalParameters);

        if (clientSecret != null) {
            additionalParametersMap.put("client_secret", clientSecret);
        }

        // store setting in private field for later use in onActivityResult handler
        this.dangerouslyAllowInsecureHttpRequests = dangerouslyAllowInsecureHttpRequests;
        this.additionalParametersMap = additionalParametersMap;

        // when serviceConfiguration is provided, we don't need to hit up the OpenID well-known id endpoint
        if (serviceConfiguration != null) {
            try {
                refreshWithConfiguration(
                        createAuthorizationServiceConfiguration(serviceConfiguration),
                        appAuthConfiguration,
                        refreshToken,
                        clientId,
                        scopesString,
                        redirectUrl,
                        additionalParametersMap,
                        promise
                );
            } catch (Exception e) {
                promise.reject(e);
            }
        } else {
            // @TODO: Refactor to avoid hitting IDP endpoint on refresh, reuse fetchedConfiguration if possible.
            AuthorizationServiceConfiguration.fetchFromUrl(
                    buildConfigurationUriFromIssuer(issuerUri),
                    new AuthorizationServiceConfiguration.RetrieveConfigurationCallback() {
                        public void onFetchConfigurationCompleted(
                                @Nullable AuthorizationServiceConfiguration fetchedConfiguration,
                                @Nullable AuthorizationException ex) {
                            if (ex != null) {
                                promise.reject("RNAppAuth Error", "Failed to fetch configuration", ex);
                                return;
                            }

                            refreshWithConfiguration(
                                    fetchedConfiguration,
                                    appAuthConfiguration,
                                    refreshToken,
                                    clientId,
                                    scopesString,
                                    redirectUrl,
                                    additionalParametersMap,
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
            AuthorizationResponse response = AuthorizationResponse.fromIntent(data);
            AuthorizationException exception = AuthorizationException.fromIntent(data);
            if (exception != null) {
                promise.reject("RNAppAuth Error", "Failed to authenticate", exception);
                return;
            }

            final Promise authorizePromise = this.promise;
            final AppAuthConfiguration configuration = createAppAuthConfiguration(
                    createConnectionBuilder(this.dangerouslyAllowInsecureHttpRequests)
            );

            AuthorizationService authService = new AuthorizationService(this.reactContext, configuration);

            TokenRequest tokenRequest = response.createTokenExchangeRequest(this.additionalParametersMap);
            authService.performTokenRequest(
                    tokenRequest,
                    new AuthorizationService.TokenResponseCallback() {

                        @Override
                        public void onTokenRequestCompleted(
                                TokenResponse resp, AuthorizationException ex) {
                            if (resp != null) {
                                WritableMap map = tokenResponseToMap(resp);
                                authorizePromise.resolve(map);
                            } else {
                                promise.reject("RNAppAuth Error", "Failed exchange token", ex);
                            }
                        }
                    });

        }
    }

    /*
     * Authorize user with the provided configuration
     */
    private void authorizeWithConfiguration(
            final AuthorizationServiceConfiguration serviceConfiguration,
            final AppAuthConfiguration appAuthConfiguration,
            final String clientId,
            final String scopesString,
            final String redirectUrl,
            final Map<String, String> additionalParametersMap
    ) {

        final Context context = this.reactContext;
        final Activity currentActivity = getCurrentActivity();

        AuthorizationRequest.Builder authRequestBuilder =
                new AuthorizationRequest.Builder(
                        serviceConfiguration,
                        clientId,
                        ResponseTypeValues.CODE,
                        Uri.parse(redirectUrl)
                )
                        .setScope(scopesString);

        if (additionalParametersMap != null) {
            authRequestBuilder.setAdditionalParameters(additionalParametersMap);
        }

        AuthorizationRequest authRequest = authRequestBuilder.build();
        AuthorizationService authService = new AuthorizationService(context, appAuthConfiguration);
        Intent authIntent = authService.getAuthorizationRequestIntent(authRequest);
        currentActivity.startActivityForResult(authIntent, 0);
    }

    /*
     * Refresh authentication token with the provided configuration
     */
    private void refreshWithConfiguration(
            final AuthorizationServiceConfiguration serviceConfiguration,
            final AppAuthConfiguration appAuthConfiguration,
            final String refreshToken,
            final String clientId,
            final String scopesString,
            final String redirectUrl,
            final Map<String, String> additionalParametersMap,
            final Promise promise
    ) {

        final Context context = this.reactContext;

        TokenRequest.Builder tokenRequestBuilder =
                new TokenRequest.Builder(
                        serviceConfiguration,
                        clientId
                )
                        .setScope(scopesString)
                        .setRefreshToken(refreshToken)
                        .setRedirectUri(Uri.parse(redirectUrl));

        if (!additionalParametersMap.isEmpty()) {
            tokenRequestBuilder.setAdditionalParameters(additionalParametersMap);
        }

        TokenRequest tokenRequest = tokenRequestBuilder.build();

        AuthorizationService authService = new AuthorizationService(context, appAuthConfiguration);
        authService.performTokenRequest(tokenRequest, new AuthorizationService.TokenResponseCallback() {
            @Override
            public void onTokenRequestCompleted(@Nullable TokenResponse response, @Nullable AuthorizationException ex) {
                if (response != null) {
                    WritableMap map = tokenResponseToMap(response);
                    promise.resolve(map);
                } else {
                    promise.reject("RNAppAuth Error", "Failed refresh token");
                }
            }
        });
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
     * Read raw token response into a React Native map to be passed down the bridge
     */
    private WritableMap tokenResponseToMap(TokenResponse response) {

        Date expirationDate = new Date(response.accessTokenExpirationTime);
        SimpleDateFormat formatter = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ssZ");
        String expirationDateString = formatter.format(expirationDate);
        WritableMap additionalParametersMap = Arguments.createMap();

        if (!response.additionalParameters.isEmpty()) {

            Iterator<String> iterator = response.additionalParameters.keySet().iterator();

            while(iterator.hasNext()) {
                String key = iterator.next();
                additionalParametersMap.putString(key, response.additionalParameters.get(key));
            }
        }

        WritableMap map = Arguments.createMap();
        map.putString("accessToken", response.accessToken);
        map.putString("accessTokenExpirationDate", expirationDateString);
        map.putMap("additionalParameters", additionalParametersMap);
        map.putString("idToken", response.idToken);
        map.putString("refreshToken", response.refreshToken);
        map.putString("tokenType", response.tokenType);

        return map;
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
    private ConnectionBuilder createConnectionBuilder(Boolean allowInsecureConnections) {
        if (allowInsecureConnections.equals(true)) {
            return UnsafeConnectionBuilder.INSTANCE;
        }

        return DefaultConnectionBuilder.INSTANCE;
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
            registrationEndpoint = Uri.parse(serviceConfiguration.getString("registrationEndPoint"));
        }

        return new AuthorizationServiceConfiguration(
                authorizationEndpoint,
                tokenEndpoint,
                registrationEndpoint
        );
    }


    @Override
    public void onNewIntent(Intent intent) {

    }

    @Override
    public String getName() {
        return "RNAppAuth";
    }
}