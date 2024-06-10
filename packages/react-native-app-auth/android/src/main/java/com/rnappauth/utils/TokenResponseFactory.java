package com.rnappauth.utils;

import android.text.TextUtils;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;

import net.openid.appauth.AuthorizationResponse;
import net.openid.appauth.TokenResponse;

public final class TokenResponseFactory {

    private static final WritableArray createScopeArray(String scope) {
        WritableArray scopeArray = Arguments.createArray();
        if (!TextUtils.isEmpty(scope)) {
            String[] scopesArray = scope.split(" ");

            for( int i = 0; i < scopesArray.length; i++)
            {
                scopeArray.pushString(scopesArray[i]);
            }
        }

        return scopeArray;
    }


    /*
     * Read raw token response into a React Native map to be passed down the bridge
     */
    public static final WritableMap tokenResponseToMap(TokenResponse response) {
        WritableMap map = Arguments.createMap();

        map.putString("accessToken", response.accessToken);
        map.putMap("additionalParameters", MapUtil.createAdditionalParametersMap(response.additionalParameters));
        map.putString("idToken", response.idToken);
        map.putString("refreshToken", response.refreshToken);
        map.putString("tokenType", response.tokenType);

        if (response.accessTokenExpirationTime != null) {
            map.putString("accessTokenExpirationDate", DateUtil.formatTimestamp(response.accessTokenExpirationTime));
        }

        return map;
    }

    /*
     * Read raw token response into a React Native map to be passed down the bridge
     */
    public static final WritableMap tokenResponseToMap(TokenResponse response, AuthorizationResponse authResponse) {
        WritableMap map = Arguments.createMap();

        map.putString("accessToken", response.accessToken);
        map.putMap("authorizeAdditionalParameters", MapUtil.createAdditionalParametersMap(authResponse.additionalParameters));
        map.putMap("tokenAdditionalParameters", MapUtil.createAdditionalParametersMap(response.additionalParameters));
        map.putString("idToken", response.idToken);
        map.putString("refreshToken", response.refreshToken);
        map.putString("tokenType", response.tokenType);
        map.putArray("scopes", createScopeArray(authResponse.scope));

        if (response.accessTokenExpirationTime != null) {
            map.putString("accessTokenExpirationDate", DateUtil.formatTimestamp(response.accessTokenExpirationTime));
        }


        return map;
    }


    /*
     * Read raw authorization into a React Native map to be passed down the bridge
     */
    public static final WritableMap authorizationResponseToMap(AuthorizationResponse authResponse) {
        WritableMap map = Arguments.createMap();
        map.putString("authorizationCode", authResponse.authorizationCode);
        map.putString("accessToken", authResponse.accessToken);
        map.putMap("additionalParameters", MapUtil.createAdditionalParametersMap(authResponse.additionalParameters));
        map.putString("idToken", authResponse.idToken);
        map.putString("tokenType", authResponse.tokenType);
        map.putArray("scopes", createScopeArray(authResponse.scope));

        if (authResponse.accessTokenExpirationTime != null) {
            map.putString("accessTokenExpirationTime", DateUtil.formatTimestamp(authResponse.accessTokenExpirationTime));
        }

        return map;
    }

    /*
     * Read raw authorization into a React Native map with codeVerifier value added if present to be passed down the bridge
     */
    public static final WritableMap authorizationCodeResponseToMap(AuthorizationResponse authResponse, String codeVerifier) {
        WritableMap map = Arguments.createMap();
        map.putString("authorizationCode", authResponse.authorizationCode);
        map.putString("accessToken", authResponse.accessToken);
        map.putMap("additionalParameters", MapUtil.createAdditionalParametersMap(authResponse.additionalParameters));
        map.putString("idToken", authResponse.idToken);
        map.putString("tokenType", authResponse.tokenType);
        map.putArray("scopes", createScopeArray(authResponse.scope));

        if (authResponse.accessTokenExpirationTime != null) {
            map.putString("accessTokenExpirationTime", DateUtil.formatTimestamp(authResponse.accessTokenExpirationTime));
        }

        if (!TextUtils.isEmpty(codeVerifier)) {
            map.putString("codeVerifier", codeVerifier);
        }

        return map;
    }
}
