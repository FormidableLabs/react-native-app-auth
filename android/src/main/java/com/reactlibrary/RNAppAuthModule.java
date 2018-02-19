package com.reactlibrary;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.support.annotation.NonNull;
import android.support.annotation.Nullable;

import com.facebook.react.bridge.ActivityEventListener;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableMapKeySetIterator;
import com.facebook.react.bridge.WritableMap;

import net.openid.appauth.AuthorizationException;
import net.openid.appauth.AuthorizationRequest;
import net.openid.appauth.AuthorizationResponse;
import net.openid.appauth.AuthorizationService;
import net.openid.appauth.AuthorizationServiceConfiguration;
import net.openid.appauth.Preconditions;
import net.openid.appauth.ResponseTypeValues;
import net.openid.appauth.TokenResponse;
import net.openid.appauth.TokenRequest;
import net.openid.appauth.connectivity.ConnectionBuilder;
import net.openid.appauth.connectivity.DefaultConnectionBuilder;

import java.io.IOException;
import java.net.HttpURLConnection;
import java.net.MalformedURLException;
import java.net.URL;
import java.sql.Connection;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.HashMap;
import java.util.Iterator;
import java.util.concurrent.TimeUnit;

public class RNAppAuthModule extends ReactContextBaseJavaModule implements ActivityEventListener {

    private final ReactApplicationContext reactContext;
    private Promise promise;

    public RNAppAuthModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
        reactContext.addActivityEventListener(this);
    }


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

    private HashMap<String, String> additionalParametersToMap(ReadableMap additionalParameters) {

        HashMap<String, String> additionalParametersHash = new HashMap<>();

        ReadableMapKeySetIterator iterator = additionalParameters.keySetIterator();

        while (iterator.hasNextKey()) {
            String nextKey = iterator.nextKey();
            additionalParametersHash.put(nextKey, additionalParameters.getString(nextKey));
        }

        return additionalParametersHash;
    }

    private ConnectionBuilder createConnectionBuilder(Boolean allowInsecureConnections) {

        if (allowInsecureConnections.equals(true)) {
            return new UnsafeConnectionBuilder();
        }

        return DefaultConnectionBuilder.INSTANCE;
    }

    static Uri buildConfigurationUriFromIssuer(Uri openIdConnectIssuerUri) {
        return openIdConnectIssuerUri.buildUpon()
                .appendPath(AuthorizationServiceConfiguration.WELL_KNOWN_PATH)
                .appendPath(AuthorizationServiceConfiguration.OPENID_CONFIGURATION_RESOURCE)
                .build();
    }

    @ReactMethod
    public void authorize(
            String issuer,
            final String redirectUrl,
            final String clientId,
            final ReadableArray scopes,
            final ReadableMap additionalParameters,
            final Boolean dangerouslyAllowInsecureHttpRequests,
            final Promise promise
    ) {

        final Context context = this.reactContext;
        this.promise = promise;
        final Activity currentActivity = getCurrentActivity();

        final String scopesString = this.arrayToString(scopes);
        final Uri issuerUri = Uri.parse(issuer);
        final ConnectionBuilder builder = createConnectionBuilder(dangerouslyAllowInsecureHttpRequests);

        AuthorizationServiceConfiguration.fetchFromUrl(
                buildConfigurationUriFromIssuer(issuerUri),
                new AuthorizationServiceConfiguration.RetrieveConfigurationCallback() {
                    public void onFetchConfigurationCompleted(
                            @Nullable AuthorizationServiceConfiguration serviceConfiguration,
                            @Nullable AuthorizationException ex) {
                        if (ex != null) {
                            promise.reject("RNAppAuth Error", "Failed to fetch configuration", ex);
                            return;
                        }

                        AuthorizationRequest.Builder authRequestBuilder =
                                new AuthorizationRequest.Builder(
                                        serviceConfiguration,
                                        clientId,
                                        ResponseTypeValues.CODE,
                                        Uri.parse(redirectUrl)
                                )
                                        .setScope(scopesString);

                        if (additionalParameters != null) {
                            authRequestBuilder.setAdditionalParameters(additionalParametersToMap(additionalParameters));
                        }

                        AuthorizationRequest authRequest = authRequestBuilder.build();

                        AuthorizationService authService = new AuthorizationService(context);
                        Intent authIntent = authService.getAuthorizationRequestIntent(authRequest);
                        currentActivity.startActivityForResult(authIntent, 0);

                    }
                },
                builder
        );

    }

    @ReactMethod
    public void refresh(
            String issuer,
            final String redirectUrl,
            final String clientId,
            final String refreshToken,
            final ReadableArray scopes,
            final ReadableMap additionalParameters,
            final Boolean dangerouslyAllowInsecureHttpRequests,
            final Promise promise
    ) {
        final Context context = this.reactContext;
        final String scopesString = this.arrayToString(scopes);
        final Uri issuerUri = Uri.parse(issuer);
        final ConnectionBuilder builder = createConnectionBuilder(dangerouslyAllowInsecureHttpRequests);

        AuthorizationServiceConfiguration.fetchFromUrl(
                buildConfigurationUriFromIssuer(issuerUri),
                new AuthorizationServiceConfiguration.RetrieveConfigurationCallback() {
                    public void onFetchConfigurationCompleted(
                            @Nullable AuthorizationServiceConfiguration serviceConfiguration,
                            @Nullable AuthorizationException ex) {
                        if (ex != null) {
                            promise.reject("RNAppAuth Error", "Failed to fetch configuration", ex);
                            return;
                        }

                        TokenRequest.Builder tokenRequestBuilder =
                                new TokenRequest.Builder(
                                        serviceConfiguration,
                                        clientId
                                )
                                        .setScope(scopesString)
                                        .setRefreshToken(refreshToken)
                                        .setRedirectUri(Uri.parse(redirectUrl));

                        if (additionalParameters != null) {
                            tokenRequestBuilder.setAdditionalParameters(additionalParametersToMap(additionalParameters));
                        }

                        TokenRequest tokenRequest = tokenRequestBuilder.build();


                        AuthorizationService authService = new AuthorizationService(context);

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
                },
        builder);
    }

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

            AuthorizationService authService = new AuthorizationService(this.reactContext);

            authService.performTokenRequest(
                    response.createTokenExchangeRequest(),
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

    @Override
    public void onNewIntent(Intent intent) {

    }

    @Override
    public String getName() {
        return "RNAppAuth";
    }
}


final class UnsafeConnectionBuilder implements ConnectionBuilder {

    private static final int CONNECTION_TIMEOUT_MS = (int) TimeUnit.SECONDS.toMillis(15);
    private static final int READ_TIMEOUT_MS = (int) TimeUnit.SECONDS.toMillis(10);


    @NonNull
    @Override
    public HttpURLConnection openConnection(@NonNull Uri uri) throws IOException {
        Preconditions.checkNotNull(uri, "url must not be null");
        HttpURLConnection conn = (HttpURLConnection) new URL(uri.toString()).openConnection();
        conn.setConnectTimeout(CONNECTION_TIMEOUT_MS);
        conn.setReadTimeout(READ_TIMEOUT_MS);
        conn.setInstanceFollowRedirects(false);
        return conn;
    }
}