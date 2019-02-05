package com.rnappauth.utils;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;

import net.openid.appauth.AuthorizationResponse;
import net.openid.appauth.TokenResponse;

import java.util.Iterator;

public final class TokenResponseFactory {
    /*
     * Read raw token response into a React Native map to be passed down the bridge
     */
    public static final WritableMap tokenResponseToMap(TokenResponse response) {
        WritableMap map = Arguments.createMap();

        map.putString("accessToken", response.accessToken);

        if (response.accessTokenExpirationTime != null) {
            map.putString("accessTokenExpirationDate", DateUtil.formatTimestamp(response.accessTokenExpirationTime));
        }

        WritableMap additionalParametersMap = Arguments.createMap();

        if (!response.additionalParameters.isEmpty()) {

            Iterator<String> iterator = response.additionalParameters.keySet().iterator();

            while(iterator.hasNext()) {
                String key = iterator.next();
                additionalParametersMap.putString(key, response.additionalParameters.get(key));
            }
        }

        map.putMap("additionalParameters", additionalParametersMap);
        map.putString("idToken", response.idToken);
        map.putString("refreshToken", response.refreshToken);
        map.putString("tokenType", response.tokenType);

        return map;
    }

    /*
     * Read raw token response into a React Native map to be passed down the bridge
     */
    public static final WritableMap tokenResponseToMap(TokenResponse response, AuthorizationResponse authResponse) {
        WritableMap map = Arguments.createMap();

        map.putString("accessToken", response.accessToken);

        if (response.accessTokenExpirationTime != null) {
            map.putString("accessTokenExpirationDate", DateUtil.formatTimestamp(response.accessTokenExpirationTime));
        }

        WritableMap authorizeAdditionalParameters = Arguments.createMap();

        if (!authResponse.additionalParameters.isEmpty()) {

            Iterator<String> iterator = authResponse.additionalParameters.keySet().iterator();

            while(iterator.hasNext()) {
                String key = iterator.next();
                authorizeAdditionalParameters.putString(key, authResponse.additionalParameters.get(key));
            }
        }

        WritableMap tokenAdditionalParameters = Arguments.createMap();

        if (!response.additionalParameters.isEmpty()) {

            Iterator<String> iterator = response.additionalParameters.keySet().iterator();

            while(iterator.hasNext()) {
                String key = iterator.next();
                tokenAdditionalParameters.putString(key, response.additionalParameters.get(key));
            }
        }

        map.putMap("authorizeAdditionalParameters", authorizeAdditionalParameters);
        map.putMap("tokenAdditionalParameters", tokenAdditionalParameters);
        map.putString("idToken", response.idToken);
        map.putString("refreshToken", response.refreshToken);
        map.putString("tokenType", response.tokenType);

        if (!authResponse.scope.isEmpty()) {
            WritableArray scopes = Arguments.createArray();
            String[] scopesArray = authResponse.scope.split(" ");

            for( int i = 0; i < scopesArray.length - 1; i++)
            {
                scopes.pushString(scopesArray[i]);
            }

            map.putArray("scopes", scopes);
        }

        return map;
    }
}
