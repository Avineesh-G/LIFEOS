package com.avineesh.lifeos

import android.graphics.Color
import android.os.Build
import android.util.Log
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsControllerCompat
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

@CapacitorPlugin(name = "ThemeBridge")
class ThemeBridgePlugin : Plugin() {

    @PluginMethod
    fun setSystemBarsTheme(call: PluginCall) {
        val isDark = call.getBoolean("isDark", false) ?: false
        val sceneBg = call.getString("sceneBg", "") ?: ""

        val act = activity ?: run {
            call.reject("Activity unavailable")
            return
        }

        act.runOnUiThread {
            try {
                val window = act.window
                val controller = WindowCompat.getInsetsController(window, window.decorView)

                // For WindowInsetsControllerCompat:
                // isAppearanceLightStatusBars = true -> dark icons (on light status bar)
                // isAppearanceLightStatusBars = false -> light/white icons (on dark status bar)
                val lightThemeBackground = !isDark
                controller.isAppearanceLightStatusBars = lightThemeBackground
                controller.isAppearanceLightNavigationBars = lightThemeBackground

                // Enforce true edge-to-edge transparent system bars
                window.statusBarColor = Color.TRANSPARENT
                window.navigationBarColor = Color.TRANSPARENT

                call.resolve()
            } catch (e: Exception) {
                Log.e("ThemeBridgePlugin", "Failed to update system bars theme", e)
                call.reject(e.message)
            }
        }
    }
}
