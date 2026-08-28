package com.rnappauth.utils;

import android.util.Log;

import androidx.annotation.Nullable;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableMapKeySetIterator;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeArray;
import com.facebook.react.bridge.WritableNativeMap;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.json.JSONTokener;

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

        for (Map.Entry<String, String> entry : additionalParameters.entrySet()) {
            String key = entry.getKey();
            String value = entry.getValue();
            if (value != null) {
                try {
                    Object parsed = new JSONTokener(value).nextValue();
                    if (parsed instanceof JSONObject) {
                        additionalParametersMap.putMap(key, convertJsonToMap((JSONObject) parsed));
                        continue;
                    }
                    if (parsed instanceof JSONArray) {
                        additionalParametersMap.putArray(key, convertJsonToArray((JSONArray) parsed));
                        continue;
                    }
                } catch (JSONException ignored) {
                }
            }
            additionalParametersMap.putString(key, value);
        }

        return additionalParametersMap;
    }

    private static WritableMap convertJsonToMap(JSONObject jsonObject) throws JSONException {
        WritableMap map = new WritableNativeMap();

        Iterator<String> iterator = jsonObject.keys();
        while (iterator.hasNext()) {
            String key = iterator.next();
            Object value = jsonObject.get(key);
            if (value == JSONObject.NULL) {
                map.putNull(key);
            } else if (value instanceof JSONObject) {
                map.putMap(key, convertJsonToMap((JSONObject) value));
            } else if (value instanceof JSONArray) {
                map.putArray(key, convertJsonToArray((JSONArray) value));
            } else if (value instanceof Boolean) {
                map.putBoolean(key, (Boolean) value);
            } else if (value instanceof Integer) {
                map.putInt(key, (Integer) value);
            } else if (value instanceof Double) {
                map.putDouble(key, (Double) value);
            } else if (value instanceof Float) {
                map.putDouble(key, ((Float) value).doubleValue());
            } else if (value instanceof Long) {
                map.putDouble(key, ((Long) value).doubleValue());
            } else if (value instanceof String) {
                map.putString(key, (String) value);
            } else {
                map.putString(key, value.toString());
            }
        }
        return map;
    }

    private static WritableArray convertJsonToArray(JSONArray jsonArray) throws JSONException {
        WritableArray array = new WritableNativeArray();

        for (int i = 0; i < jsonArray.length(); i++) {
            Object value = jsonArray.get(i);
            if (value == JSONObject.NULL) {
                array.pushNull();
            } else if (value instanceof JSONObject) {
                array.pushMap(convertJsonToMap((JSONObject) value));
            } else if (value instanceof JSONArray) {
                array.pushArray(convertJsonToArray((JSONArray) value));
            } else if (value instanceof Boolean) {
                array.pushBoolean((Boolean) value);
            } else if (value instanceof Integer) {
                array.pushInt((Integer) value);
            } else if (value instanceof Double) {
                array.pushDouble((Double) value);
            } else if (value instanceof Float) {
                array.pushDouble(((Float) value).doubleValue());
            } else if (value instanceof Long) {
                array.pushDouble(((Long) value).doubleValue());
            } else if (value instanceof String) {
                array.pushString((String) value);
            } else {
                array.pushString(value.toString());
            }
        }
        return array;
    }
}
