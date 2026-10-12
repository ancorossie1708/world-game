package com.worldgame.journey;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import android.view.View;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.view.WindowManager;
import android.webkit.RenderProcessGoneDetail;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;

import androidx.core.content.FileProvider;
import androidx.webkit.WebViewAssetLoader;

import org.json.JSONObject;

import java.io.File;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

public final class MainActivity extends Activity {
    private static final String HOST = "appassets.androidplatform.net";
    private static final String START_URL = "https://" + HOST + "/assets/www/index.html";
    private static final String CSP = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; " +
            "img-src 'self' data: blob:; media-src 'self' blob:; font-src 'self'; connect-src 'self'; " +
            "object-src 'none'; frame-src 'none'; base-uri 'self'; worker-src 'self' blob:";

    private WebView webView;
    private FrameLayout container;
    private ContentStore content;
    private JourneyBridge bridge;
    private boolean launchCheckStarted;
    private boolean awaitingInstallPermission;
    private File pendingApk;
    private String pendingInstallJob = "";

    @Override public void onCreate(Bundle savedState) {
        super.onCreate(savedState);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        getWindow().getDecorView().setLayoutDirection(View.LAYOUT_DIRECTION_RTL);
        container = new FrameLayout(this);
        container.setBackgroundColor(0xfff5f4ed);
        setContentView(container);
        if (Build.VERSION.SDK_INT >= 33) {
            getOnBackInvokedDispatcher().registerOnBackInvokedCallback(
                    android.window.OnBackInvokedDispatcher.PRIORITY_DEFAULT, this::dispatchGameBack);
        }
        try {
            content = new ContentStore(this);
            bridge = new JourneyBridge(this, content);
            createWebView();
        } catch (IOException exception) {
            new AlertDialog.Builder(this)
                    .setTitle("לא ניתן לפתוח את המסע")
                    .setMessage("האחסון במכשיר אינו זמין כרגע. אפשר לפנות מקום ולפתוח שוב את המשחק.")
                    .setPositiveButton("סגירה", (dialog, which) -> finish())
                    .setCancelable(false).show();
        }
        enterFullscreen();
    }

    @SuppressLint("SetJavaScriptEnabled")
    private void createWebView() {
        WebViewAssetLoader assetLoader = new WebViewAssetLoader.Builder()
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this)).build();
        webView = new WebView(this);
        webView.setBackgroundColor(0xfff5f4ed);
        webView.setOverScrollMode(View.OVER_SCROLL_NEVER);
        webView.setHorizontalScrollBarEnabled(false);
        webView.setVerticalScrollBarEnabled(false);
        webView.setLayoutDirection(View.LAYOUT_DIRECTION_RTL);
        container.addView(webView, new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT));
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setSupportMultipleWindows(false);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setTextZoom(100);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setSupportZoom(false);
        settings.setSafeBrowsingEnabled(true);
        WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG);
        webView.addJavascriptInterface(bridge, "WorldGameNative");
        webView.setWebChromeClient(new WebChromeClient());
        webView.setWebViewClient(new WebViewClient() {
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                Uri url = request.getUrl();
                if (!isLocalUrl(url) || !"GET".equals(request.getMethod())) {
                    return ContentStore.emptyResponse(403, "Forbidden", null);
                }
                WebResourceResponse downloaded = content.intercept(request);
                if (downloaded != null) return downloaded;
                WebResourceResponse response = assetLoader.shouldInterceptRequest(url);
                if (response == null) return ContentStore.emptyResponse(404, "Not Found", null);
                Map<String, String> headers = response.getResponseHeaders() == null
                        ? new HashMap<>() : new HashMap<>(response.getResponseHeaders());
                headers.put("Content-Security-Policy", CSP);
                headers.put("X-Content-Type-Options", "nosniff");
                headers.put("Cache-Control", "no-store");
                response.setResponseHeaders(headers);
                return response;
            }

            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return !isLocalUrl(request.getUrl());
            }

            @Override public void onPageFinished(WebView view, String url) {
                if (!launchCheckStarted && START_URL.equals(url)) {
                    launchCheckStarted = true;
                    if (!BuildConfig.UPDATE_MANIFEST_URL.isEmpty()) bridge.checkForUpdates();
                }
            }

            @Override public boolean onRenderProcessGone(WebView view, RenderProcessGoneDetail detail) {
                container.removeView(view);
                view.destroy();
                webView = null;
                if (!isFinishing() && !isDestroyed()) {
                    new AlertDialog.Builder(MainActivity.this)
                            .setTitle(R.string.reopen_title).setMessage(R.string.reopen_message)
                            .setPositiveButton(R.string.reopen_button, (dialog, which) -> createWebView())
                            .setCancelable(false).show();
                }
                return true;
            }
        });
        webView.setOnApplyWindowInsetsListener((view, insets) -> {
            if (Build.VERSION.SDK_INT >= 28 && insets.getDisplayCutout() != null) {
                android.view.DisplayCutout cutout = insets.getDisplayCutout();
                view.setPadding(cutout.getSafeInsetLeft(), cutout.getSafeInsetTop(),
                        cutout.getSafeInsetRight(), cutout.getSafeInsetBottom());
            } else {
                view.setPadding(0, 0, 0, 0);
            }
            return insets;
        });
        webView.loadUrl(START_URL);
    }

    private static boolean isLocalUrl(Uri uri) {
        String path = uri.getPath();
        return "https".equals(uri.getScheme()) && HOST.equals(uri.getHost()) &&
                uri.getPort() == -1 && uri.getUserInfo() == null &&
                path != null && path.startsWith("/assets/www/");
    }

    void emitNativeEvent(JSONObject detail) {
        runOnUiThread(() -> {
            if (webView != null && !isFinishing() && !isDestroyed()) {
                webView.evaluateJavascript("window.dispatchEvent(new CustomEvent('journey:native',{detail:" +
                        detail.toString() + "}));", null);
            }
        });
    }

    void offerInstallation(File apk, String job) {
        if (isFinishing() || isDestroyed()) return;
        pendingApk = apk;
        pendingInstallJob = job;
        if (!getPackageManager().canRequestPackageInstalls()) {
            bridge.installationEvent(job, "permission-required");
            new AlertDialog.Builder(this)
                    .setTitle(R.string.install_permission_title)
                    .setMessage(R.string.install_permission_message)
                    .setPositiveButton(R.string.install_permission_button, (dialog, which) -> {
                        awaitingInstallPermission = true;
                        try {
                            startActivity(new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                                    Uri.parse("package:" + getPackageName())));
                        } catch (android.content.ActivityNotFoundException exception) {
                            awaitingInstallPermission = false;
                            bridge.installationEvent(job, "error", "error", "Installation settings are unavailable.");
                        }
                    })
                    .setNegativeButton(R.string.cancel, (dialog, which) -> bridge.installationEvent(job, "cancelled"))
                    .show();
            return;
        }
        openInstaller();
    }

    private void openInstaller() {
        if (pendingApk == null || !pendingApk.isFile()) return;
        Uri uri = FileProvider.getUriForFile(this, BuildConfig.APPLICATION_ID + ".updates", pendingApk);
        Intent installer = new Intent(Intent.ACTION_VIEW)
                .setDataAndType(uri, "application/vnd.android.package-archive")
                .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
        try {
            startActivity(installer);
            bridge.installationEvent(pendingInstallJob, "installer-opened");
        } catch (android.content.ActivityNotFoundException | SecurityException exception) {
            bridge.installationEvent(pendingInstallJob, "error", "error", "The Android package installer is unavailable.");
        }
    }

    @Override protected void onResume() {
        super.onResume();
        enterFullscreen();
        if (webView != null) {
            webView.onResume();
            webView.resumeTimers();
        }
        if (awaitingInstallPermission) {
            awaitingInstallPermission = false;
            if (getPackageManager().canRequestPackageInstalls()) openInstaller();
            else if (bridge != null) bridge.installationEvent(pendingInstallJob, "cancelled");
        }
    }

    @Override protected void onPause() {
        if (webView != null) {
            webView.evaluateJavascript("window.dispatchEvent(new Event('journey:pause'));" +
                    "document.querySelectorAll('audio,video').forEach(function(media){media.pause()});", null);
            webView.onPause();
            webView.pauseTimers();
        }
        super.onPause();
    }

    @Override public void onWindowFocusChanged(boolean focused) {
        super.onWindowFocusChanged(focused);
        if (focused) enterFullscreen();
    }

    @SuppressWarnings("deprecation")
    private void enterFullscreen() {
        if (Build.VERSION.SDK_INT >= 30) {
            WindowInsetsController controller = getWindow().getInsetsController();
            if (controller != null) {
                controller.hide(WindowInsets.Type.statusBars() | WindowInsets.Type.navigationBars());
                controller.setSystemBarsBehavior(WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
            }
        } else {
            getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY |
                    View.SYSTEM_UI_FLAG_LAYOUT_STABLE | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION |
                    View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION |
                    View.SYSTEM_UI_FLAG_FULLSCREEN);
        }
    }

    @SuppressWarnings("deprecation")
    @Override public void onBackPressed() {
        dispatchGameBack();
    }

    private void dispatchGameBack() {
        if (webView != null) {
            webView.evaluateJavascript("window.dispatchEvent(new Event('journey:back'));", null);
        }
    }

    @Override protected void onDestroy() {
        if (bridge != null) bridge.shutdown();
        if (webView != null) {
            container.removeView(webView);
            webView.removeJavascriptInterface("WorldGameNative");
            webView.destroy();
            webView = null;
        }
        super.onDestroy();
    }
}
