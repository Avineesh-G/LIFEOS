package com.avineesh.lifeos;

import android.os.Build;
import android.os.Bundle;
import android.view.Display;
import android.view.WindowManager;
import com.getcapacitor.BridgeActivity;
import com.codetrixstudio.capacitor.GoogleAuth.GoogleAuth;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(GoogleAuth.class);
        super.onCreate(savedInstanceState);

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
    }
}

