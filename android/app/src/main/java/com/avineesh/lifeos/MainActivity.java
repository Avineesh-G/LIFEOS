package com.avineesh.lifeos;

import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.view.Display;
import android.view.View;
import android.view.WindowManager;
import android.webkit.WebView;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import com.getcapacitor.BridgeActivity;
import com.codetrixstudio.capacitor.GoogleAuth.GoogleAuth;
import ee.forgr.biometric.NativeBiometric;
import com.capacitorjs.plugins.localnotifications.LocalNotificationsPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(GoogleAuth.class);
        registerPlugin(NativeBiometric.class);
        registerPlugin(LocalNotificationsPlugin.class);
        registerPlugin(ApkInstallerPlugin.class);
        registerPlugin(TimerNotificationPlugin.class);
        registerPlugin(WidgetUpdaterPlugin.class);
        super.onCreate(savedInstanceState);

        // Enable edge-to-edge layout across all supported Android versions (API 24+)
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);

        // Match decor window background to theme canvas to avoid white/dark flashes
        boolean isNight = (getResources().getConfiguration().uiMode & android.content.res.Configuration.UI_MODE_NIGHT_MASK) == android.content.res.Configuration.UI_MODE_NIGHT_YES;
        getWindow().setBackgroundDrawable(new android.graphics.drawable.ColorDrawable(isNight ? Color.parseColor("#121316") : Color.parseColor("#FDFDFD")));

        // Maximize display refresh rate (60Hz / 90Hz / 120Hz) for silky smooth 60/120 FPS
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            try {
                Display display = getDisplay();
                if (display != null) {
                    Display.Mode[] modes = display.getSupportedModes();
                    Display.Mode maxMode = null;
                    float maxRate = 60.0f;
                    for (Display.Mode mode : modes) {
                        if (mode.getRefreshRate() > maxRate) {
                            maxRate = mode.getRefreshRate();
                            maxMode = mode;
                        }
                    }
                    if (maxMode != null) {
                        WindowManager.LayoutParams params = getWindow().getAttributes();
                        params.preferredDisplayModeId = maxMode.getModeId();
                        getWindow().setAttributes(params);
                    }
                }
            } catch (Exception ignored) {
            }
        }

        // Apply edge-to-edge window insets listener and forward CSS variables into WebView
        View decorView = getWindow().getDecorView();
        ViewCompat.setOnApplyWindowInsetsListener(decorView, (v, windowInsets) -> {
            Insets statusInsets = windowInsets.getInsets(
                WindowInsetsCompat.Type.statusBars() | WindowInsetsCompat.Type.displayCutout()
            );
            Insets navInsets = windowInsets.getInsets(
                WindowInsetsCompat.Type.navigationBars()
            );

            float density = getResources().getDisplayMetrics().density;
            int topDp = Math.round(statusInsets.top / density);
            int bottomDp = Math.round(navInsets.bottom / density);
            int leftDp = Math.round(statusInsets.left / density);
            int rightDp = Math.round(statusInsets.right / density);

            if (getBridge() != null && getBridge().getWebView() != null) {
                WebView webView = getBridge().getWebView();
                String js = String.format(
                    "document.documentElement.style.setProperty('--sat', '%dpx');" +
                    "document.documentElement.style.setProperty('--sab', '%dpx');" +
                    "document.documentElement.style.setProperty('--sal', '%dpx');" +
                    "document.documentElement.style.setProperty('--sar', '%dpx');",
                    topDp, bottomDp, leftDp, rightDp
                );
                webView.post(() -> webView.evaluateJavascript(js, null));
            }
            return windowInsets;
        });
    }

    @Override
    public void onResume() {
        super.onResume();
        if (getBridge() != null && getBridge().getWebView() != null) {
            WebView webView = getBridge().getWebView();
            webView.setOverScrollMode(View.OVER_SCROLL_NEVER);
            webView.setBackgroundColor(Color.TRANSPARENT);
        }
    }
}

