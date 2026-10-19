package com.example;

import android.app.Activity;
import android.app.Instrumentation;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;

import com.facebook.react.bridge.JavaOnlyMap;
import com.facebook.react.bridge.JavaOnlyArray;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.BridgeReactContext;
import com.facebook.react.bridge.ReadableMap;
import com.rnappauth.RNAppAuthModule;

import net.openid.appauth.AuthorizationException;
import net.openid.appauth.AuthorizationRequest;
import net.openid.appauth.AuthorizationResponse;
import net.openid.appauth.AuthorizationServiceConfiguration;
import net.openid.appauth.ResponseTypeValues;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.lang.reflect.Proxy;
import java.lang.reflect.Field;
import java.net.ServerSocket;
import java.net.Socket;
import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;

/** Native recovery regression tests. Uses framework instrumentation and a loopback token endpoint. */
public class RNAppAuthRecoveryInstrumentation extends Instrumentation {
    private static final String VERIFIER = "abcdefghijklmnopqrstuvwxyz0123456789ABCDEFG";
    private int passed;

    @Override
    public void onCreate(Bundle arguments) {
        super.onCreate(arguments);
        start();
    }

    @Override
    public void onStart() {
        Bundle result = new Bundle();
        try {
            // Instrumentation.start() races Application.onCreate(), which initializes React Native JNI.
            waitForIdleSync();
            runTests();
            result.putString("stream", "\nAll " + passed + " Android recovery cases passed.\n");
            finish(Activity.RESULT_OK, result);
        } catch (Throwable error) {
            result.putString("stream", "\nFAIL: " + android.util.Log.getStackTraceString(error) + "\n");
            finish(Activity.RESULT_CANCELED, result);
        }
    }

    private RNAppAuthModule module() {
        return new RNAppAuthModule(new BridgeReactContext(getTargetContext()));
    }

    private Intent response(int port, boolean pkce) {
        AuthorizationServiceConfiguration configuration = new AuthorizationServiceConfiguration(
                Uri.parse("http://127.0.0.1:" + port + "/authorize"),
                Uri.parse("http://127.0.0.1:" + port + "/token"));
        AuthorizationRequest request = new AuthorizationRequest.Builder(configuration, "fixture-client",
                ResponseTypeValues.CODE, Uri.parse("io.identityserver.demo:/oauthredirect"))
                .setCodeVerifier(pkce ? VERIFIER : null).setScope("profile").build();
        return new AuthorizationResponse.Builder(request).setAuthorizationCode("fixture-code").build().toIntent();
    }

    private Result resume(RNAppAuthModule module, boolean skip, String secret, String method, ReadableMap parameters, ReadableMap headers) {
        Result result = new Result();
        module.resumePendingAuthorize(parameters, 5000.0, headers, true, secret, method, skip, result.promise);
        return result;
    }

    private void runTests() throws Exception {
        RNAppAuthModule.stashAuthorizationResult(null);
        check(resume(module(), false, null, "basic", null, null).await() == null, "empty startup");

        RNAppAuthModule.stashAuthorizationResult(response(1, true));
        ReadableMap code = (ReadableMap)resume(module(), true, null, "basic", null, null).await();
        check("fixture-code".equals(code.getString("authorizationCode")) && VERIFIER.equals(code.getString("codeVerifier")), "skip exchange preserves PKCE");
        check(resume(module(), true, null, "basic", null, null).await() == null, "claim only once");

        RNAppAuthModule.stashAuthorizationResult(response(1, false));
        code = (ReadableMap)resume(module(), true, null, "basic", null, null).await();
        check(!code.hasKey("codeVerifier"), "skip exchange without PKCE");

        RNAppAuthModule.stashAuthorizationResult(AuthorizationException.GeneralErrors.USER_CANCELED_AUTH_FLOW.toIntent());
        Result cancelled = resume(module(), false, null, "basic", null, null);
        cancelled.waitForSettlement();
        check(cancelled.error != null && cancelled.settlements.get() == 1, "cancellation rejects once");

        RNAppAuthModule orphaned = module();
        orphaned.onActivityResult(null, RNAppAuthModule.AUTHORIZATION_REQUEST_CODE, Activity.RESULT_OK, response(1, true));
        check(resume(orphaned, true, null, "basic", null, null).await() != null, "listener stashes orphaned response");

        RNAppAuthModule live = module();
        Result liveResult = new Result();
        Field pending = RNAppAuthModule.class.getDeclaredField("pendingAuthorizePromise");
        pending.setAccessible(true);
        ((AtomicReference<Promise>)pending.get(live)).set(liveResult.promise);
        Field skip = RNAppAuthModule.class.getDeclaredField("skipCodeExchange");
        skip.setAccessible(true);
        skip.set(live, true);
        Intent liveResponse = response(1, true);
        RNAppAuthModule.stashAuthorizationResult(liveResponse);
        check(resume(live, true, null, "basic", null, null).await() == null, "recovery cannot steal a live authorization");
        live.onActivityResult(null, RNAppAuthModule.AUTHORIZATION_REQUEST_CODE, Activity.RESULT_OK, liveResponse);
        check(liveResult.await() != null && liveResult.settlements.get() == 1 &&
                resume(live, true, null, "basic", null, null).await() == null, "live result settles once and clears the stash");

        RNAppAuthModule earlyRecovery = module();
        Intent earlyResponse = response(1, true);
        RNAppAuthModule.stashAuthorizationResult(earlyResponse);
        Result recoveredBeforeCallback = resume(earlyRecovery, true, null, "basic", null, null);
        if (recoveredBeforeCallback.await() == null) throw new AssertionError("Early recovery did not claim its result");
        earlyRecovery.onActivityResult(null, RNAppAuthModule.AUTHORIZATION_REQUEST_CODE, Activity.RESULT_OK, earlyResponse);
        check(resume(earlyRecovery, true, null, "basic", null, null).await() == null,
                "delayed activity callback cannot restash a recovered result");

        RNAppAuthModule repeatedCallback = module();
        Result repeatedOwner = new Result();
        ((AtomicReference<Promise>)pending.get(repeatedCallback)).set(repeatedOwner.promise);
        skip.set(repeatedCallback, true);
        Intent repeatedResponse = response(1, true);
        RNAppAuthModule.stashAuthorizationResult(repeatedResponse);
        repeatedCallback.onActivityResult(null, RNAppAuthModule.AUTHORIZATION_REQUEST_CODE, Activity.RESULT_OK, repeatedResponse);
        if (repeatedOwner.await() == null) throw new AssertionError("Live authorization did not claim its result");
        RNAppAuthModule.stashAuthorizationResult(repeatedResponse);
        repeatedCallback.onActivityResult(null, RNAppAuthModule.AUTHORIZATION_REQUEST_CODE, Activity.RESULT_OK, repeatedResponse);
        check(repeatedOwner.settlements.get() == 1 &&
                resume(repeatedCallback, true, null, "basic", null, null).await() == null,
                "repeated host forwarding cannot replay a live result");

        Result nextOwner = new Result();
        ((AtomicReference<Promise>)pending.get(repeatedCallback)).set(nextOwner.promise);
        repeatedCallback.onActivityResult(null, RNAppAuthModule.AUTHORIZATION_REQUEST_CODE, Activity.RESULT_OK, repeatedResponse);
        if (nextOwner.settlements.get() != 0 ||
                ((AtomicReference<Promise>)pending.get(repeatedCallback)).get() != nextOwner.promise) {
            throw new AssertionError("Repeated old delivery stole the next login's promise");
        }
        Intent nextResponse = response(1, true);
        RNAppAuthModule.stashAuthorizationResult(nextResponse);
        repeatedCallback.onActivityResult(null, RNAppAuthModule.AUTHORIZATION_REQUEST_CODE, Activity.RESULT_OK, nextResponse);
        check(nextOwner.await() != null && nextOwner.settlements.get() == 1 &&
                resume(repeatedCallback, true, null, "basic", null, null).await() == null,
                "repeated old delivery cannot settle a new login");

        // Race the UI result callback against the native-module startup recovery call.
        // Repeated simultaneous starts exercise both orders without network or browser timing.
        for (int iteration = 0; iteration < 500; iteration++) {
            RNAppAuthModule racing = module();
            Result owner = new Result();
            ((AtomicReference<Promise>)pending.get(racing)).set(owner.promise);
            skip.set(racing, true);
            Intent racingResponse = response(1, true);
            RNAppAuthModule.stashAuthorizationResult(racingResponse);
            CountDownLatch ready = new CountDownLatch(2);
            CountDownLatch start = new CountDownLatch(1);
            AtomicReference<Result> recovery = new AtomicReference<>();
            AtomicReference<Throwable> failure = new AtomicReference<>();
            Thread delivery = new Thread(() -> {
                ready.countDown();
                try {
                    start.await();
                    racing.onActivityResult(null, RNAppAuthModule.AUTHORIZATION_REQUEST_CODE, Activity.RESULT_OK, racingResponse);
                } catch (Throwable error) { failure.compareAndSet(null, error); }
            }, "RNAppAuth-live-result");
            Thread startup = new Thread(() -> {
                ready.countDown();
                try {
                    start.await();
                    recovery.set(resume(racing, true, null, "basic", null, null));
                } catch (Throwable error) { failure.compareAndSet(null, error); }
            }, "RNAppAuth-startup-recovery");
            delivery.start();
            startup.start();
            if (!ready.await(10, TimeUnit.SECONDS)) throw new AssertionError("Race workers did not start");
            start.countDown();
            delivery.join(10000);
            startup.join(10000);
            if (delivery.isAlive() || startup.isAlive()) throw new AssertionError("Race workers did not finish");
            if (failure.get() != null) throw new AssertionError(failure.get());
            if (owner.await() == null || owner.settlements.get() != 1 ||
                    recovery.get().await() != null || recovery.get().settlements.get() != 1 ||
                    resume(racing, true, null, "basic", null, null).await() != null) {
                throw new AssertionError("Live authorization lost exclusive ownership at iteration " + iteration);
            }
        }
        check(true, "live result and concurrent startup recovery have one owner (500 races)");

        for (int iteration = 0; iteration < 500; iteration++) {
            RNAppAuthModule racing = module();
            Result owner = new Result();
            ((AtomicReference<Promise>)pending.get(racing)).set(owner.promise);
            skip.set(racing, true);
            Intent firstResponse = response(1, true);
            Field insecure = RNAppAuthModule.class.getDeclaredField("dangerouslyAllowInsecureHttpRequests");
            insecure.setAccessible(true);
            insecure.set(racing, true);
            RNAppAuthModule.stashAuthorizationResult(firstResponse);
            CountDownLatch start = new CountDownLatch(1);
            AtomicReference<Throwable> failure = new AtomicReference<>();
            Thread delivery = new Thread(() -> {
                try {
                    start.await();
                    racing.onActivityResult(null, RNAppAuthModule.AUTHORIZATION_REQUEST_CODE, Activity.RESULT_OK, firstResponse);
                } catch (Throwable error) { failure.compareAndSet(null, error); }
            }, "RNAppAuth-original-result");
            Result next = new Result();
            Thread nextLogin = new Thread(() -> {
                try {
                    start.await();
                    // A malformed endpoint configuration fails after setting its exchange options.
                    // That failure must not change how the original result completes.
                    racing.authorize("https://fixture.example", "io.identityserver.demo:/oauthredirect", "fixture-next-client", null,
                            JavaOnlyArray.of("profile"), null,
                            JavaOnlyMap.of("tokenEndpoint", "http://127.0.0.1:1/token"),
                            false, 5000.0, true, true, "basic", true, null, null, false, false, next.promise);
                } catch (Throwable error) { failure.compareAndSet(null, error); }
            }, "RNAppAuth-next-login");
            delivery.start();
            nextLogin.start();
            start.countDown();
            delivery.join(10000);
            nextLogin.join(10000);
            if (delivery.isAlive() || nextLogin.isAlive()) throw new AssertionError("Login race workers did not finish");
            if (failure.get() != null) throw new AssertionError(failure.get());
            if (owner.await() == null || owner.settlements.get() != 1) throw new AssertionError("Original result changed exchange mode");
            next.waitForSettlement();
        }
        check(true, "a new login cannot change the previous result's exchange options (500 races)");

        try (TokenEndpoint endpoint = new TokenEndpoint(false)) {
            RNAppAuthModule.stashAuthorizationResult(response(endpoint.port(), true));
            ReadableMap tokens = (ReadableMap)resume(module(), false, "fixture-secret", "basic", null,
                    JavaOnlyMap.of("token", JavaOnlyMap.of("X-Fixture", "custom"))).await();
            check("fixture-access-token".equals(tokens.getString("accessToken")) &&
                    endpoint.request().contains("authorization: Basic ") &&
                    endpoint.request().contains("x-fixture: custom") &&
                    endpoint.request().contains("code_verifier=" + VERIFIER), "basic auth, token headers and original verifier");
        }

        try (TokenEndpoint endpoint = new TokenEndpoint(false)) {
            RNAppAuthModule.stashAuthorizationResult(response(endpoint.port(), true));
            resume(module(), false, "fixture-secret", "post", null, null).await();
            check(endpoint.request().contains("client_secret=fixture-secret") &&
                    !endpoint.request().contains("authorization: Basic "), "post client authentication");
        }

        try (TokenEndpoint endpoint = new TokenEndpoint(false)) {
            RNAppAuthModule.stashAuthorizationResult(response(endpoint.port(), true));
            RNAppAuthModule recovered = module();
            Result first = resume(recovered, false, null, "basic",
                    JavaOnlyMap.of("audience", "fixture-api", "prompt", "login", "nonce", "original-nonce", "state", "original-state"), null);
            Result second = resume(recovered, false, null, "basic", null, null);
            first.await();
            check(second.await() == null && endpoint.requests.get() == 1 &&
                    endpoint.request().contains("audience=fixture-api") &&
                    !endpoint.request().contains("prompt=") && !endpoint.request().contains("nonce=") &&
                    !endpoint.request().contains("state="), "concurrent claim and authorization-only parameters");
        }

        try (TokenEndpoint endpoint = new TokenEndpoint(true)) {
            RNAppAuthModule.stashAuthorizationResult(response(endpoint.port(), true));
            RNAppAuthModule recovered = module();
            Result failed = resume(recovered, false, null, "basic", null, null);
            failed.waitForSettlement();
            check("invalid_grant".equals(failed.error) &&
                    resume(recovered, false, null, "basic", null, null).await() == null, "failed exchange does not replay a consumed code");
        }
    }

    private void check(boolean condition, String name) {
        if (!condition) throw new AssertionError(name);
        passed++;
        Bundle progress = new Bundle();
        progress.putString("stream", "PASS: " + name + "\n");
        sendStatus(0, progress);
    }

    private static class Result {
        final CountDownLatch settled = new CountDownLatch(1);
        final AtomicInteger settlements = new AtomicInteger();
        volatile Object value;
        volatile String error;
        final Promise promise = (Promise)Proxy.newProxyInstance(Promise.class.getClassLoader(), new Class<?>[]{Promise.class},
                (proxy, method, arguments) -> {
                    if (method.getName().equals("resolve") || method.getName().equals("reject")) {
                        if (method.getName().equals("resolve")) value = arguments[0];
                        else error = String.valueOf(arguments[0]);
                        settlements.incrementAndGet();
                        settled.countDown();
                    }
                    return null;
                });
        void waitForSettlement() throws InterruptedException {
            if (!settled.await(10, TimeUnit.SECONDS)) throw new AssertionError("Promise timed out");
        }
        Object await() throws InterruptedException {
            waitForSettlement();
            if (error != null) throw new AssertionError(error);
            return value;
        }
    }

    private static class TokenEndpoint implements AutoCloseable {
        final ServerSocket server = new ServerSocket(0);
        final AtomicInteger requests = new AtomicInteger();
        volatile String captured;
        volatile Throwable failure;
        TokenEndpoint(boolean fail) throws Exception {
            Thread worker = new Thread(() -> {
                try (Socket socket = server.accept()) {
                    socket.setSoTimeout(10000);
                    BufferedReader reader = new BufferedReader(new InputStreamReader(socket.getInputStream(), StandardCharsets.UTF_8));
                    StringBuilder request = new StringBuilder();
                    int length = 0;
                    String line;
                    while ((line = reader.readLine()) != null && !line.isEmpty()) {
                        String normalized = line.toLowerCase(Locale.ROOT);
                        request.append(normalized.startsWith("authorization:") ? "authorization:" + line.substring(line.indexOf(':') + 1) : normalized).append('\n');
                        if (normalized.startsWith("content-length:")) length = Integer.parseInt(line.substring(line.indexOf(':') + 1).trim());
                    }
                    char[] body = new char[length];
                    int offset = 0;
                    while (offset < length) {
                        int count = reader.read(body, offset, length - offset);
                        if (count < 0) throw new AssertionError("Incomplete HTTP body");
                        offset += count;
                    }
                    captured = request.append(body).toString();
                    requests.incrementAndGet();
                    String response = fail ? "{\"error\":\"invalid_grant\"}" :
                            "{\"access_token\":\"fixture-access-token\",\"token_type\":\"Bearer\",\"expires_in\":3600}";
                    byte[] bytes = response.getBytes(StandardCharsets.UTF_8);
                    socket.getOutputStream().write(("HTTP/1.1 " + (fail ? "400 Bad Request" : "200 OK") +
                            "\r\nContent-Type: application/json\r\nContent-Length: " + bytes.length + "\r\nConnection: close\r\n\r\n").getBytes(StandardCharsets.UTF_8));
                    socket.getOutputStream().write(bytes);
                    socket.getOutputStream().flush();
                } catch (Throwable error) { failure = error; }
            }, "RNAppAuth-token-fixture");
            worker.setDaemon(true);
            worker.start();
        }
        int port() { return server.getLocalPort(); }
        String request() {
            if (failure != null) throw new AssertionError(failure);
            if (captured == null) throw new AssertionError("No token request received");
            return captured;
        }
        public void close() throws Exception { server.close(); }
    }
}
