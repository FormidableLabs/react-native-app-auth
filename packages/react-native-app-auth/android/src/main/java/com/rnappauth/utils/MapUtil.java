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
                String value = additionalParameters.get(key);
                // Try to parse to JSON
                try {
                    JSONObject jsonObject = new JSONObject(value);
                    WritableMap json = convertJsonToMap(jsonObject);
                    additionalParametersMap.putMap(key, json);
                    continue;
                } catch (JSONException ignored) {

                }
                additionalParametersMap.putString(key, additionalParameters.get(key));
            }
        }

        return additionalParametersMap;
    }

    private static WritableMap convertJsonToMap(JSONObject jsonObject) throws JSONException {
        WritableMap map = new WritableNativeMap();

        Iterator<String> iterator = jsonObject.keys();
        while (iterator.hasNext()) {
            String key = iterator.next();
            Object value = jsonObject.get(key);
            if (value instanceof JSONObject) {
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
            if (value instanceof JSONObject) {
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
