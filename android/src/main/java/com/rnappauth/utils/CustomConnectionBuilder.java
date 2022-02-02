package com.rnappauth.utils;

/*
 * Copyright 2016 The AppAuth for Android Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License. You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the
 * License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied. See the License for the specific language governing permissions and
 * limitations under the License.
 */


import android.net.Uri;
import androidx.annotation.NonNull;

import net.openid.appauth.connectivity.ConnectionBuilder;

import java.io.IOException;
import java.net.HttpURLConnection;
import java.util.concurrent.TimeUnit;
import java.util.Map;


/**
 * An implementation of {@link ConnectionBuilder} that permits
 * to set custom headers on connection use to request endpoints.
 * Useful for non-spec compliant oauth providers.
 */
public final class CustomConnectionBuilder implements ConnectionBuilder {

    private Map<String, String> headers = null;

    private int connectionTimeoutMs = (int) TimeUnit.SECONDS.toMillis(15);
    private int readTimeoutMs = (int) TimeUnit.SECONDS.toMillis(10);     
    private ConnectionBuilder connectionBuilder;

    public CustomConnectionBuilder(ConnectionBuilder connectionBuilderToUse) {
        connectionBuilder = connectionBuilderToUse;
    }

    public void setHeaders (Map<String, String> headersToSet) {
        headers = headersToSet;
    }

    public void setConnectionTimeout (int timeout) {
        connectionTimeoutMs = timeout;
        readTimeoutMs = timeout;
    }

    @NonNull
    @Override
    public HttpURLConnection openConnection(@NonNull Uri uri) throws IOException {
        HttpURLConnection conn = connectionBuilder.openConnection(uri);

        if (headers != null) {
            for (Map.Entry<String, String> header: headers.entrySet()) {
                conn.setRequestProperty(header.getKey(), header.getValue());
            }
        }

        conn.setConnectTimeout(connectionTimeoutMs);
        conn.setReadTimeout(readTimeoutMs);

        return conn;
    }
}
