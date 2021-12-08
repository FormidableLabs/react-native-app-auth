package com.rnappauth.utils;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;

import net.openid.appauth.EndSessionResponse;

public final class EndSessionResponseFactory {
    /*
     * Read raw end session response into a React Native map to be passed down the bridge
     */
    public static final WritableMap endSessionResponseToMap(EndSessionResponse response) {
        WritableMap map = Arguments.createMap();

        map.putString("state", response.state);
        map.putString("idTokenHint", response.request.idToken);
        map.putString("postLogoutRedirectUri", response.request.redirectUri.toString());

        return map;
    }
}
