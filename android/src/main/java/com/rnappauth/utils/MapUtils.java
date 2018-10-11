package com.rnappauth.utils;

import android.support.annotation.Nullable;

import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableMapKeySetIterator;

import java.util.HashMap;

public class MapUtils {

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
}
