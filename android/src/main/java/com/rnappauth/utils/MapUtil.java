package com.rnappauth.utils;

import androidx.annotation.Nullable;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableMapKeySetIterator;
import com.facebook.react.bridge.WritableMap;

import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;

public class MapUtil {

    public static HashMap<String, String> readableMapToHashMap(@Nullable ReadableMap readableMap) {

        HashMap<String, String> hashMap = new HashMap<>();
        if (readableMap != null) {
            ReadableMapKeySetIterator iterator = readableMap.keySetIterator();
            while (iterator.hasNextKey()) {
                String nextKey = iterator.nextKey();
                hashMap.put(nextKey, readableMap.getString(nextKey));
            }
        }

        return hashMap;
    }

    public static final WritableMap createAdditionalParametersMap(Map<String, String> additionalParameters) {
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
}
