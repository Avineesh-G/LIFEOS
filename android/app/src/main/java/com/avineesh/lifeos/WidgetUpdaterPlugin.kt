package com.avineesh.lifeos

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Intent
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

@CapacitorPlugin(name = "WidgetUpdater")
class WidgetUpdaterPlugin : Plugin() {

    @PluginMethod
    fun requestRefresh(call: PluginCall) {
        try {
            val ctx = context
            val intent = Intent(ctx, LifeOSWidgetProvider::class.java).apply {
                action = AppWidgetManager.ACTION_APPWIDGET_UPDATE
                val ids = AppWidgetManager.getInstance(ctx).getAppWidgetIds(
                    ComponentName(ctx, LifeOSWidgetProvider::class.java)
                )
                putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids)
            }
            ctx.sendBroadcast(intent)
            call.resolve()
        } catch (e: Exception) {
            call.reject("Failed to trigger widget refresh: ${e.message}", e)
        }
    }
}
