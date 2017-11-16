package com.reactlibrary;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.support.annotation.Nullable;
import android.util.Log;

import com.facebook.react.bridge.ActivityEventListener;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.WritableMap;

import net.openid.appauth.AuthorizationException;
import net.openid.appauth.AuthorizationRequest;
import net.openid.appauth.AuthorizationResponse;
import net.openid.appauth.AuthorizationService;
import net.openid.appauth.AuthorizationServiceConfiguration;
import net.openid.appauth.ResponseTypeValues;
import net.openid.appauth.TokenResponse;
import net.openid.appauth.TokenRequest;

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

    @ReactMethod
    public void authorize(String issuer, final String redirectUrl, final String clientId, final ReadableArray scopes, final Promise promise) {

        final Context context = this.reactContext;
        this.promise = promise;
        final Activity currentActivity = getCurrentActivity();

        final String scopesString = this.arrayToString(scopes);

        AuthorizationServiceConfiguration.fetchFromIssuer(
                Uri.parse(issuer),
                new AuthorizationServiceConfiguration.RetrieveConfigurationCallback() {
                    public void onFetchConfigurationCompleted(
                            @Nullable AuthorizationServiceConfiguration serviceConfiguration,
                            @Nullable AuthorizationException ex) {
                        if (ex != null) {
                            // TODO: handle error & reject
                            Log.e("AppAuth", "failed to fetch configuration");
                            return;
                        }

                        AuthorizationRequest.Builder authRequestBuilder =
                                new AuthorizationRequest.Builder(
                                        serviceConfiguration,
                                        clientId,
                                        ResponseTypeValues.CODE,
                                        Uri.parse(redirectUrl));

                        AuthorizationRequest authRequest = authRequestBuilder
                                .setScope(scopesString)
                                .build();
                        AuthorizationService authService = new AuthorizationService(context);
                        Intent authIntent = authService.getAuthorizationRequestIntent(authRequest);
                        currentActivity.startActivityForResult(authIntent, 0);

                    }
                });

    }

    @ReactMethod
    public void refresh(String issuer, final String redirectUrl, final String clientId, final String refreshToken, final ReadableArray scopes, final Promise promise) {
        final Context context = this.reactContext;

        final String scopesString = this.arrayToString(scopes);

        AuthorizationServiceConfiguration.fetchFromIssuer(
                Uri.parse(issuer),
                new AuthorizationServiceConfiguration.RetrieveConfigurationCallback() {
                    public void onFetchConfigurationCompleted(
                            @Nullable AuthorizationServiceConfiguration serviceConfiguration,
                            @Nullable AuthorizationException ex) {
                        if (ex != null) {
                            // TODO: handle error & reject
                            Log.e("AppAuth", "failed to fetch configuration");
                            return;
                        }

                        TokenRequest.Builder tokenRequestBuilder =
                                new TokenRequest.Builder(
                                        serviceConfiguration,
                                        clientId
                                );

                        TokenRequest tokenRequest = tokenRequestBuilder
                                .setScope(scopesString)
                                .setRefreshToken(refreshToken)
                                .setRedirectUri(Uri.parse(redirectUrl))
                                .build();

                        AuthorizationService authService = new AuthorizationService(context);

                        authService.performTokenRequest(tokenRequest, new AuthorizationService.TokenResponseCallback() {
                            @Override
                            public void onTokenRequestCompleted(@Nullable TokenResponse response, @Nullable AuthorizationException ex) {
                                if (response != null) {
                                    WritableMap map = Arguments.createMap();
                                    map.putString("accessToken", response.accessToken);
                                    map.putString("accessTokenExpirationDate", response.accessTokenExpirationTime.toString());
                                    map.putString("refreshToken", response.refreshToken);
                                    promise.resolve(map);
                                } else {
                                    // authorization failed, check ex for more details
                                    // TODO: process failure
                                }
                            }
                        });

                    }
                });
    }

    @Override
    public void onActivityResult(Activity activity, int requestCode, int resultCode, Intent data) {
        if (requestCode == 0) {
            AuthorizationResponse response = AuthorizationResponse.fromIntent(data);
            AuthorizationException exception = AuthorizationException.fromIntent(data);
            final Promise authorizePromise = this.promise;
            // TODO: process exception

            AuthorizationService authService = new AuthorizationService(this.reactContext);

            authService.performTokenRequest(
                    response.createTokenExchangeRequest(),
                    new AuthorizationService.TokenResponseCallback() {

                        @Override
                        public void onTokenRequestCompleted(
                                TokenResponse resp, AuthorizationException ex) {
                            if (resp != null) {
                                WritableMap map = Arguments.createMap();
                                map.putString("accessToken", resp.accessToken);
                                map.putString("accessTokenExpirationDate", resp.accessTokenExpirationTime.toString());
                                map.putString("refreshToken", resp.refreshToken);
                                authorizePromise.resolve(map);
                                // exchange succeeded
                            } else {
                                // authorization failed, check ex for more details
                                // TODO: process failure
                            }
                        }
                    });

        } else {
            // ...
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
