package com.avineesh.lifeos

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.util.Log
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone
import java.util.concurrent.Executors

@CapacitorPlugin(name = "WidgetUpdater")
class WidgetUpdaterPlugin : Plugin() {

    private val executor = Executors.newSingleThreadExecutor()

    @PluginMethod
    fun requestRefresh(call: PluginCall) {
        // Resolve immediately so the Capacitor bridge and JS thread are never held
        call.resolve()

        executor.execute {
            try {
                val ctx = context ?: return@execute
                val appWidgetManager = AppWidgetManager.getInstance(ctx)
                val ids = appWidgetManager.getAppWidgetIds(
                    ComponentName(ctx, LifeOSWidgetProvider::class.java)
                )
                if (ids != null && ids.isNotEmpty()) {
                    for (id in ids) {
                        LifeOSWidgetProvider.updateAppWidget(ctx, appWidgetManager, id)
                    }
                }
            } catch (e: Exception) {
                Log.e("WidgetUpdaterPlugin", "Background widget refresh error", e)
            }
        }
    }

    @PluginMethod
    fun updateSnapshot(call: PluginCall) {
        val streak = call.getInt("streak", 0) ?: 0
        val tasksDone = call.getInt("tasksDone", 0) ?: 0
        val tasksTotal = call.getInt("tasksTotal", 0) ?: 0
        val studyMinutes = call.getInt("studyMinutes", 0) ?: 0
        val nextScheduleTime = call.getString("nextScheduleTime", "") ?: ""
        val nextScheduleTitle = call.getString("nextScheduleTitle", "") ?: ""
        val spentToday = call.getString("spentToday", "") ?: ""

        // Immediately resolve to guarantee 0ms latency on JS interaction path
        call.resolve()

        executor.execute {
            try {
                val ctx = context ?: return@execute
                val prefs = ctx.getSharedPreferences("CapacitorStorage", Context.MODE_PRIVATE)

                val isoDate = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US).apply {
                    timeZone = TimeZone.getTimeZone("UTC")
                }.format(Date())

                // Write asynchronously using .apply() - completely non-blocking to disk I/O
                prefs.edit()
                    .putString("widget_streak_count", streak.toString())
                    .putString("widget_tasks_done", tasksDone.toString())
                    .putString("widget_tasks_total", tasksTotal.toString())
                    .putString("widget_study_minutes_today", studyMinutes.toString())
                    .putString("widget_next_schedule_time", nextScheduleTime)
                    .putString("widget_next_schedule_title", nextScheduleTitle)
                    .putString("widget_spent_today", spentToday)
                    .putString("widget_last_updated", isoDate)
                    .apply()

                val appWidgetManager = AppWidgetManager.getInstance(ctx)
                val ids = appWidgetManager.getAppWidgetIds(
                    ComponentName(ctx, LifeOSWidgetProvider::class.java)
                )
                if (ids != null && ids.isNotEmpty()) {
                    for (id in ids) {
                        LifeOSWidgetProvider.updateAppWidget(ctx, appWidgetManager, id)
                    }
                }
            } catch (e: Exception) {
                Log.e("WidgetUpdaterPlugin", "Background snapshot update error", e)
            }
        }
    }

    override fun handleOnDestroy() {
        super.handleOnDestroy()
        try {
            executor.shutdown()
        } catch (e: Exception) {
            Log.w("WidgetUpdaterPlugin", "Executor shutdown warning", e)
        }
    }
}
