package com.rnappauth.utils;

import android.text.TextUtils;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;

import net.openid.appauth.AuthorizationResponse;
import net.openid.appauth.TokenResponse;

import java.util.Iterator;
import java.util.Map;

public final class TokenResponseFactory {
    private static final WritableMap createAdditionalParametersMap(Map<String, String> additionalParameters) {
        WritableMap additionalParametersMap = Arguments.createMap();

        if (!additionalParameters.isEmpty()) {

            Iterator<String> iterator = additionalParameters.keySet().iterator();

            while(iterator.hasNext()) {
                String key = iterator.next();
                additionalParametersMap.putString(key, additionalParameters.get(key));
            }
        }

        return additionalParametersMap;
    }

    private static final WritableArray createScopeArray(String scope) {
        WritableArray scopeArray = Arguments.createArray();
        if (!TextUtils.isEmpty(scope)) {
            String[] scopesArray = scope.split(" ");

            for( int i = 0; i < scopesArray.length - 1; i++)
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
        map.putMap("additionalParameters", createAdditionalParametersMap(response.additionalParameters));
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
        map.putMap("authorizeAdditionalParameters", createAdditionalParametersMap(authResponse.additionalParameters));
        map.putMap("tokenAdditionalParameters", createAdditionalParametersMap(response.additionalParameters));
        map.putMap("additionalParameters", createAdditionalParametersMap(response.additionalParameters)); // DEPRECATED
        map.putString("idToken", response.idToken);
        map.putString("refreshToken", response.refreshToken);
        map.putString("tokenType", response.tokenType);
        map.putArray("scopes", createScopeArray(authResponse.scope));

        if (response.accessTokenExpirationTime != null) {
            map.putString("accessTokenExpirationDate", DateUtil.formatTimestamp(response.accessTokenExpirationTime));
        }


        return map;
    }
}
