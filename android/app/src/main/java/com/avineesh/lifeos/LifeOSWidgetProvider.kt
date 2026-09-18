package com.avineesh.lifeos

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.net.Uri
import android.os.Build
import android.util.Log
import android.util.TypedValue
import android.view.View
import android.widget.RemoteViews
import androidx.core.content.ContextCompat
import java.util.Calendar

class LifeOSWidgetProvider : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        Log.d(TAG, "onUpdate invoked for ${appWidgetIds.size} widget(s): ${appWidgetIds.joinToString()}")
        for (appWidgetId in appWidgetIds) {
            try {
                updateAppWidget(context, appWidgetManager, appWidgetId)
            } catch (e: Exception) {
                Log.e(TAG, "Failed updating widget $appWidgetId", e)
            }
        }
    }

    override fun onDeleted(context: Context, appWidgetIds: IntArray) {
        super.onDeleted(context, appWidgetIds)
        Log.d(TAG, "onDeleted invoked for ${appWidgetIds.size} widget(s): ${appWidgetIds.joinToString()}")
        try {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val editor = prefs.edit()
            for (appWidgetId in appWidgetIds) {
                editor.remove("widget_config_$appWidgetId")
                Log.d(TAG, "Cleaned up widget_config_$appWidgetId from SharedPreferences")
            }
            editor.apply()
        } catch (e: Exception) {
            Log.e(TAG, "Failed cleaning up deleted widgets config", e)
        }
    }

    companion object {
        private const val TAG = "LifeOSWidgetProvider"
        private const val PREFS_NAME = "CapacitorStorage"

        data class WidgetStatData(
            val id: String,
            val heroBadge: String,
            val heroVal: String,
            val heroLabel: String,
            val rightVal: String,
            val rightLabel: String,
            val iconRes: Int,
            val deepLinkRoute: String,
            val requestCode: Int
        )

        fun updateAppWidget(
            context: Context,
            appWidgetManager: AppWidgetManager,
            appWidgetId: Int
        ) {
            try {
                val views = RemoteViews(context.packageName, R.layout.widget_layout)
                val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

                // 1. Read per-widget configuration
                val configStr = readStringPref(prefs, "widget_config_$appWidgetId", "")
                val selectedStats = if (configStr.isNotEmpty()) {
                    configStr.split(",").map { it.trim() }.filter { it.isNotEmpty() }
                } else {
                    listOf("streak", "tasks", "study") // default 3 stats
                }

                // 2. Read latest snapshot values from CapacitorStorage
                val streak = readIntPref(prefs, "widget_streak_count", 0)
                val tasksDone = readIntPref(prefs, "widget_tasks_done", 0)
                val tasksTotal = readIntPref(prefs, "widget_tasks_total", 0)
                val studyMinutes = readIntPref(prefs, "widget_study_minutes_today", 0)
                val nextScheduleTime = readStringPref(prefs, "widget_next_schedule_time", "")
                val nextScheduleTitle = readStringPref(prefs, "widget_next_schedule_title", "")
                val spentToday = readStringPref(prefs, "widget_spent_today", "")

                // 3. Formatted values
                val formattedStudy = when {
                    studyMinutes >= 60 -> {
                        val h = studyMinutes / 60
                        val m = studyMinutes % 60
                        if (m > 0) "${h}h ${m}m" else "${h}h"
                    }
                    else -> "${studyMinutes}m"
                }

                // 4. Build map of all 5 available stat definitions
                val statMap = mapOf(
                    "streak" to WidgetStatData(
                        id = "streak",
                        heroBadge = "STREAK",
                        heroVal = streak.toString(),
                        heroLabel = "DAYS ACTIVE",
                        rightVal = "$streak ${if (streak == 1) "day" else "days"}",
                        rightLabel = "STREAK",
                        iconRes = R.drawable.ic_widget_flame,
                        deepLinkRoute = "progress",
                        requestCode = 201
                    ),
                    "tasks" to WidgetStatData(
                        id = "tasks",
                        heroBadge = "TASKS",
                        heroVal = "$tasksDone/$tasksTotal",
                        heroLabel = "COMPLETED",
                        rightVal = "$tasksDone/$tasksTotal",
                        rightLabel = "TASKS TODAY",
                        iconRes = R.drawable.ic_widget_check,
                        deepLinkRoute = "tasks",
                        requestCode = 202
                    ),
                    "study" to WidgetStatData(
                        id = "study",
                        heroBadge = "STUDY",
                        heroVal = formattedStudy,
                        heroLabel = "FOCUS TODAY",
                        rightVal = formattedStudy,
                        rightLabel = "STUDY TIME",
                        iconRes = R.drawable.ic_widget_clock,
                        deepLinkRoute = "study",
                        requestCode = 203
                    ),
                    "schedule" to WidgetStatData(
                        id = "schedule",
                        heroBadge = "SCHEDULE",
                        heroVal = if (nextScheduleTime.isNotEmpty()) nextScheduleTime else "Free",
                        heroLabel = if (nextScheduleTitle.isNotEmpty()) nextScheduleTitle else "NEXT BLOCK",
                        rightVal = if (nextScheduleTime.isNotEmpty()) nextScheduleTime else "Free",
                        rightLabel = if (nextScheduleTitle.isNotEmpty()) nextScheduleTitle else "NEXT BLOCK",
                        iconRes = R.drawable.ic_widget_calendar,
                        deepLinkRoute = "timetable",
                        requestCode = 204
                    ),
                    "spending" to WidgetStatData(
                        id = "spending",
                        heroBadge = "SPENDING",
                        heroVal = if (spentToday.isNotEmpty()) spentToday else "₹0",
                        heroLabel = "SPENT TODAY",
                        rightVal = if (spentToday.isNotEmpty()) spentToday else "₹0",
                        rightLabel = "SAFE TO SPEND",
                        iconRes = R.drawable.ic_widget_wallet,
                        deepLinkRoute = "spending",
                        requestCode = 205
                    )
                )

                // 5. Determine day phase or full night mode
                val themeMode = readStringPref(prefs, "lifeos_theme_mode", "dynamic")
                val hour = Calendar.getInstance().get(Calendar.HOUR_OF_DAY)
                val colors = if (themeMode == "night") {
                    resolveNightColors(context)
                } else {
                    resolvePhaseColors(context, hour)
                }

                // 6. Apply card background & divider colors
                views.setInt(R.id.widget_bg, "setColorFilter", colors.cardSurface)
                views.setInt(R.id.widget_divider, "setBackgroundColor", colors.cardBorder)

                // 7. Bind Slot 1 (Hero Tile on left)
                val slot1Id = selectedStats.getOrNull(0) ?: "streak"
                val stat1 = statMap[slot1Id] ?: statMap["streak"]!!

                views.setImageViewResource(R.id.widget_tile1_icon, stat1.iconRes)
                views.setTextViewText(R.id.widget_tile1_badge, stat1.heroBadge)
                views.setTextColor(R.id.widget_tile1_badge, colors.accent)

                views.setTextViewText(R.id.widget_tile1_val, stat1.heroVal)
                views.setTextColor(R.id.widget_tile1_val, colors.textPrimary)
                // Adjust font size dynamically for longer strings like "10:00" or "1h 30m"
                val slot1TextSize = if (stat1.heroVal.length > 4) 26f else 34f
                views.setTextViewTextSize(R.id.widget_tile1_val, TypedValue.COMPLEX_UNIT_SP, slot1TextSize)

                views.setTextViewText(R.id.widget_tile1_label, stat1.heroLabel)
                views.setTextColor(R.id.widget_tile1_label, colors.textMuted)

                views.setOnClickPendingIntent(
                    R.id.widget_tile_1,
                    createDeepLinkIntent(context, stat1.deepLinkRoute, stat1.requestCode)
                )

                // 8. Bind Slot 2 (Right Column Top)
                val slot2Id = selectedStats.getOrNull(1) ?: "tasks"
                val stat2 = statMap[slot2Id] ?: statMap["tasks"]!!

                views.setImageViewResource(R.id.widget_tile2_icon, stat2.iconRes)
                views.setTextViewText(R.id.widget_tile2_val, stat2.rightVal)
                views.setTextColor(R.id.widget_tile2_val, colors.textPrimary)

                views.setTextViewText(R.id.widget_tile2_label, stat2.rightLabel)
                views.setTextColor(R.id.widget_tile2_label, colors.textMuted)

                views.setOnClickPendingIntent(
                    R.id.widget_tile_2,
                    createDeepLinkIntent(context, stat2.deepLinkRoute, stat2.requestCode)
                )

                // 9. Bind Slot 3 (Right Column Bottom - visible if 3 stats selected, gone if 2 stats)
                if (selectedStats.size >= 3) {
                    val slot3Id = selectedStats[2]
                    val stat3 = statMap[slot3Id] ?: statMap["study"]!!

                    views.setViewVisibility(R.id.widget_tile_3, View.VISIBLE)
                    views.setImageViewResource(R.id.widget_tile3_icon, stat3.iconRes)
                    views.setTextViewText(R.id.widget_tile3_val, stat3.rightVal)
                    views.setTextColor(R.id.widget_tile3_val, colors.textPrimary)

                    views.setTextViewText(R.id.widget_tile3_label, stat3.rightLabel)
                    views.setTextColor(R.id.widget_tile3_label, colors.textMuted)

                    views.setOnClickPendingIntent(
                        R.id.widget_tile_3,
                        createDeepLinkIntent(context, stat3.deepLinkRoute, stat3.requestCode)
                    )
                } else {
                    views.setViewVisibility(R.id.widget_tile_3, View.GONE)
                }

                // Root fallback -> home
                views.setOnClickPendingIntent(
                    R.id.widget_root,
                    createDeepLinkIntent(context, "", 200)
                )

                // 10. Commit update to AppWidgetManager
                appWidgetManager.updateAppWidget(appWidgetId, views)
                Log.d(TAG, "Successfully updated widget $appWidgetId with config: $selectedStats")
            } catch (e: Exception) {
                Log.e(TAG, "Exception inside updateAppWidget for $appWidgetId", e)
            }
        }

        private fun readIntPref(prefs: SharedPreferences, key: String, defaultVal: Int): Int {
            return try {
                val all = prefs.all
                val v = all[key] ?: return defaultVal
                when (v) {
                    is Number -> v.toInt()
                    is String -> v.toIntOrNull() ?: defaultVal
                    else -> defaultVal
                }
            } catch (e: Exception) {
                Log.w(TAG, "Error reading pref $key", e)
                defaultVal
            }
        }

        private fun readStringPref(prefs: SharedPreferences, key: String, defaultVal: String): String {
            return try {
                val all = prefs.all
                val v = all[key] ?: return defaultVal
                when (v) {
                    is String -> v
                    else -> v.toString()
                }
            } catch (e: Exception) {
                Log.w(TAG, "Error reading string pref $key", e)
                defaultVal
            }
        }

        private data class WidgetPhaseColors(
            val cardSurface: Int,
            val cardBorder: Int,
            val textPrimary: Int,
            val textSecondary: Int,
            val textMuted: Int,
            val accent: Int
        )

        private fun resolveNightColors(context: Context): WidgetPhaseColors {
            return WidgetPhaseColors(
                cardSurface = ContextCompat.getColor(context, R.color.night_card_surface),
                cardBorder = ContextCompat.getColor(context, R.color.night_card_border),
                textPrimary = ContextCompat.getColor(context, R.color.night_text_primary),
                textSecondary = ContextCompat.getColor(context, R.color.night_text_secondary),
                textMuted = ContextCompat.getColor(context, R.color.night_text_muted),
                accent = ContextCompat.getColor(context, R.color.night_accent)
            )
        }

        private fun resolvePhaseColors(context: Context, hour: Int): WidgetPhaseColors {
            return when (hour) {
                in 5..7 -> WidgetPhaseColors(
                    cardSurface = ContextCompat.getColor(context, R.color.dawn_card_surface),
                    cardBorder = ContextCompat.getColor(context, R.color.dawn_card_border),
                    textPrimary = ContextCompat.getColor(context, R.color.dawn_text_primary),
                    textSecondary = ContextCompat.getColor(context, R.color.dawn_text_secondary),
                    textMuted = ContextCompat.getColor(context, R.color.dawn_text_muted),
                    accent = ContextCompat.getColor(context, R.color.dawn_accent)
                )
                in 8..11 -> WidgetPhaseColors(
                    cardSurface = ContextCompat.getColor(context, R.color.morning_card_surface),
                    cardBorder = ContextCompat.getColor(context, R.color.morning_card_border),
                    textPrimary = ContextCompat.getColor(context, R.color.morning_text_primary),
                    textSecondary = ContextCompat.getColor(context, R.color.morning_text_secondary),
                    textMuted = ContextCompat.getColor(context, R.color.morning_text_muted),
                    accent = ContextCompat.getColor(context, R.color.morning_accent)
                )
                in 12..16 -> WidgetPhaseColors(
                    cardSurface = ContextCompat.getColor(context, R.color.afternoon_card_surface),
                    cardBorder = ContextCompat.getColor(context, R.color.afternoon_card_border),
                    textPrimary = ContextCompat.getColor(context, R.color.afternoon_text_primary),
                    textSecondary = ContextCompat.getColor(context, R.color.afternoon_text_secondary),
                    textMuted = ContextCompat.getColor(context, R.color.afternoon_text_muted),
                    accent = ContextCompat.getColor(context, R.color.afternoon_accent)
                )
                in 17..18 -> WidgetPhaseColors(
                    cardSurface = ContextCompat.getColor(context, R.color.dusk_card_surface),
                    cardBorder = ContextCompat.getColor(context, R.color.dusk_card_border),
                    textPrimary = ContextCompat.getColor(context, R.color.dusk_text_primary),
                    textSecondary = ContextCompat.getColor(context, R.color.dusk_text_secondary),
                    textMuted = ContextCompat.getColor(context, R.color.dusk_text_muted),
                    accent = ContextCompat.getColor(context, R.color.dusk_accent)
                )
                in 19..21 -> WidgetPhaseColors(
                    cardSurface = ContextCompat.getColor(context, R.color.evening_card_surface),
                    cardBorder = ContextCompat.getColor(context, R.color.evening_card_border),
                    textPrimary = ContextCompat.getColor(context, R.color.evening_text_primary),
                    textSecondary = ContextCompat.getColor(context, R.color.evening_text_secondary),
                    textMuted = ContextCompat.getColor(context, R.color.evening_text_muted),
                    accent = ContextCompat.getColor(context, R.color.evening_accent)
                )
                else -> resolveNightColors(context)
            }
        }

        private fun createDeepLinkIntent(context: Context, route: String, requestCode: Int): PendingIntent {
            val deepLinkUri = if (route.isNotEmpty()) "lifeos://$route" else "lifeos://home"
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(deepLinkUri)).apply {
                setClass(context, MainActivity::class.java)
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
                putExtra("route", route)
            }

            val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            } else {
                PendingIntent.FLAG_UPDATE_CURRENT
            }

            return PendingIntent.getActivity(context, requestCode, intent, flags)
        }
    }
}
