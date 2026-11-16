package com.sorrypoundsand.fppwledremote;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Bundle;
import android.view.KeyEvent;
import android.view.WindowManager;
import android.webkit.HttpAuthHandler;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

/**
 * A full-screen window onto the WLED Remote plugin on the user's FPP player.
 *
 * The app holds no copy of the remote itself: it loads the plugin page from the Pi, so
 * plugin updates reach the phone without reinstalling. It answers FPP's password prompt
 * with the saved password, and keeps the WebView on the Pi (no address bar, no links out).
 */
public class MainActivity extends Activity {

    static final String PREFS = "settings";
    static final String KEY_HOST = "host";
    static final String KEY_USER = "user";
    static final String KEY_PASS = "pass";

    private static final String PAGE = "/plugin.php?plugin=fpp-wled-remote&page=app.php&nopage=1";
    // Links on the built-in "can't reach the Pi" page.
    private static final String ACTION_RETRY = "wledremote://retry";
    private static final String ACTION_SETTINGS = "wledremote://settings";

    private WebView web;
    private String host, user, pass;
    private int authTries = 0;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        if (!loadSettings()) {
            openSetup(null);
            finish();
            return;
        }
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        web = new WebView(this);
        setContentView(web);
        configure(web);
        web.loadUrl(appUrl());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        // Back from Settings with a new address or password: start over with them.
        if (web != null && loadSettings()) {
            authTries = 0;
            web.loadUrl(appUrl());
        }
    }

    private boolean loadSettings() {
        SharedPreferences p = getSharedPreferences(PREFS, MODE_PRIVATE);
        host = p.getString(KEY_HOST, "");
        user = p.getString(KEY_USER, "fpp");
        pass = p.getString(KEY_PASS, "");
        return host != null && !host.isEmpty();
    }

    private String appUrl() {
        return "http://" + host + PAGE;
    }

    @SuppressLint("SetJavaScriptEnabled")
    private void configure(WebView w) {
        WebSettings s = w.getSettings();
        s.setJavaScriptEnabled(true);
        // The remote keeps the login, favorites and Kids-mode choices in localStorage.
        s.setDomStorageEnabled(true);
        s.setSupportZoom(false);
        s.setBuiltInZoomControls(false);
        w.setBackgroundColor(0xFF0A0E18);

        w.setWebViewClient(new WebViewClient() {
            @Override
            public void onReceivedHttpAuthRequest(WebView view, HttpAuthHandler handler, String h, String realm) {
                // FPP's web password. Answer it with the saved one; if FPP refuses it twice, ask the user.
                if (authTries < 2 && pass != null && !pass.isEmpty()) {
                    authTries++;
                    handler.proceed(user, pass);
                } else {
                    handler.cancel();
                    openSetup("FPP didn't accept the password. Check it and try again.");
                }
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                // A page from the Pi loaded, so the password worked: allow fresh tries next time.
                if (url != null && url.startsWith("http")) authTries = 0;
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                String url = request.getUrl().toString();
                if (url.equals(ACTION_RETRY)) {
                    authTries = 0;
                    view.loadUrl(appUrl());
                    return true;
                }
                if (url.equals(ACTION_SETTINGS)) {
                    openSetup(null);
                    return true;
                }
                // Stay on this player: nothing on the Pi, or anywhere else, opens outside the remote.
                Uri u = request.getUrl();
                String authority = u.getAuthority();
                return authority == null || !authority.equalsIgnoreCase(host);
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (request.isForMainFrame()) showOffline(String.valueOf(error.getDescription()));
            }
        });
    }

    private void showOffline(String why) {
        String safeHost = escape(host), safeWhy = escape(why);
        String html = "<!doctype html><html><head><meta name='viewport' content='width=device-width,initial-scale=1'>"
                + "<style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;"
                + "background:#0a0e18;color:#e9edf7;font:16px system-ui,sans-serif;text-align:center;padding:24px;box-sizing:border-box}"
                + "h1{font-size:22px;margin:0 0 8px}p{color:#8a94b2;margin:0 0 20px}"
                + "a{display:block;margin:10px auto;max-width:280px;padding:14px;border-radius:14px;text-decoration:none;font-weight:700}"
                + ".go{background:#ffc04a;color:#1d0f00}.set{border:1px solid #273150;color:#e9edf7}</style></head><body><div>"
                + "<h1>Can't reach the lights</h1>"
                + "<p>No answer from " + safeHost + ". Check that this phone is on your home Wi-Fi and the Pi is on.<br><small>"
                + safeWhy + "</small></p>"
                + "<a class='go' href='" + ACTION_RETRY + "'>Try again</a>"
                + "<a class='set' href='" + ACTION_SETTINGS + "'>Change Pi address or password</a>"
                + "</div></body></html>";
        web.loadDataWithBaseURL(null, html, "text/html", "utf-8", null);
    }

    private static String escape(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("'", "&#39;").replace("\"", "&quot;");
    }

    private void openSetup(String error) {
        Intent i = new Intent(this, SetupActivity.class);
        if (error != null) i.putExtra(SetupActivity.EXTRA_ERROR, error);
        startActivity(i);
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (keyCode == KeyEvent.KEYCODE_BACK && web != null && web.canGoBack()) {
            web.goBack();
            return true;
        }
        return super.onKeyDown(keyCode, event);
    }

    @Override
    protected void onPause() {
        super.onPause();
        if (web != null) web.onPause();
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (web != null) web.onResume();
    }

    @Override
    protected void onDestroy() {
        if (web != null) web.destroy();
        super.onDestroy();
    }
}
