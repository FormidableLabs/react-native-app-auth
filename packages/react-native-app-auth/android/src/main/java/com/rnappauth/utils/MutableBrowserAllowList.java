package com.rnappauth.utils;

import androidx.annotation.NonNull;

import net.openid.appauth.browser.BrowserDescriptor;
import net.openid.appauth.browser.BrowserMatcher;

import java.util.ArrayList;
import java.util.List;

public class MutableBrowserAllowList implements BrowserMatcher {

    private final List<BrowserMatcher> mBrowserMatchers = new ArrayList<>();

    public void add(BrowserMatcher browserMatcher) {
        mBrowserMatchers.add(browserMatcher);
    }

    public void remove(BrowserMatcher browserMatcher) {
        mBrowserMatchers.remove(browserMatcher);
    }

    @Override
    public boolean matches(@NonNull BrowserDescriptor descriptor) {
        for (BrowserMatcher matcher : mBrowserMatchers) {
            if (matcher.matches(descriptor)) {
                return true;
            }
        }

        return false;
    }
}
