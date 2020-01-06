package com.rnappauth.utils;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;

import net.openid.appauth.RegistrationResponse;

public final class RegistrationResponseFactory {
    /*
     * Read raw registration response into a React Native map to be passed down the bridge
     */
    public static final WritableMap registrationResponseToMap(RegistrationResponse response) {
        WritableMap map = Arguments.createMap();
        
        map.putString("clientId", response.clientId);
        map.putMap("additionalParameters", MapUtil.createAdditionalParametersMap(response.additionalParameters));

        if (response.clientIdIssuedAt != null) {
            map.putString("clientIdIssuedAt", DateUtil.formatTimestamp(response.clientIdIssuedAt));
        }

        if (response.clientSecret != null) {
            map.putString("clientSecret", response.clientSecret);
        }

        if (response.clientSecretExpiresAt != null) {
            map.putString("clientSecretExpiresAt", DateUtil.formatTimestamp(response.clientSecretExpiresAt));
        }

        if (response.registrationAccessToken != null) {
            map.putString("registrationAccessToken", response.registrationAccessToken);
        }

        if (response.registrationClientUri != null) {
            map.putString("registrationClientUri", response.registrationClientUri.toString());
        }

        if (response.tokenEndpointAuthMethod != null) {
            map.putString("tokenEndpointAuthMethod", response.tokenEndpointAuthMethod);
        }

        return map;
    }
}
