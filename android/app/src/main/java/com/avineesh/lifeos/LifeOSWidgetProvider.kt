package com.avineesh.lifeos

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.widget.RemoteViews
import androidx.core.content.ContextCompat
import java.util.Calendar

class LifeOSWidgetProvider : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
    }

    companion object {
        private const val PREFS_NAME = "CapacitorStorage"

        fun updateAppWidget(
            context: Context,
            appWidgetManager: AppWidgetManager,
            appWidgetId: Int
        ) {
            val views = RemoteViews(context.packageName, R.layout.widget_layout)

            // 1. Read stats from CapacitorStorage SharedPreferences
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

            val streak = readIntPref(prefs, "widget_streak_count", 0)
            val tasksDone = readIntPref(prefs, "widget_tasks_done", 0)
            val tasksTotal = readIntPref(prefs, "widget_tasks_total", 0)
            val studyMinutes = readIntPref(prefs, "widget_study_minutes_today", 0)

            // 2. Determine day phase natively using local clock hours
            // Boundaries identical to useDayPhase.ts:
            // dawn 5-8, morning 8-12, afternoon 12-17, dusk 17-19, evening 19-22, night 22-5
            val hour = Calendar.getInstance().get(Calendar.HOUR_OF_DAY)
            val colors = resolvePhaseColors(context, hour)

            // 3. Apply phase-derived colors
            views.setInt(R.id.widget_bg, "setColorFilter", colors.cardSurface)
            views.setInt(R.id.widget_divider, "setBackgroundColor", colors.cardBorder)

            // Text colors
            views.setTextColor(R.id.widget_streak_val, colors.textPrimary)
            views.setTextColor(R.id.widget_streak_badge, colors.accent)
            views.setTextColor(R.id.widget_streak_label, colors.textMuted)

            views.setTextColor(R.id.widget_tasks_val, colors.textPrimary)
            views.setTextColor(R.id.widget_tasks_label, colors.textMuted)

            views.setTextColor(R.id.widget_study_val, colors.textPrimary)
            views.setTextColor(R.id.widget_study_label, colors.textMuted)

            // 4. Populate formatted values
            views.setTextViewText(R.id.widget_streak_val, streak.toString())
            views.setTextViewText(R.id.widget_tasks_val, "$tasksDone/$tasksTotal")

            val formattedStudy = when {
                studyMinutes >= 60 -> {
                    val h = studyMinutes / 60
                    val m = studyMinutes % 60
                    if (m > 0) "${h}h ${m}m" else "${h}h"
                }
                else -> "${studyMinutes}m"
            }
            views.setTextViewText(R.id.widget_study_val, formattedStudy)

            // 5. Attach per-stat deep links
            // Streak -> lifeos://progress
            views.setOnClickPendingIntent(
                R.id.widget_tile_streak,
                createDeepLinkIntent(context, "progress", 201)
            )

            // Tasks -> lifeos://tasks
            views.setOnClickPendingIntent(
                R.id.widget_tile_tasks,
                createDeepLinkIntent(context, "tasks", 202)
            )

            // Study -> lifeos://study
            views.setOnClickPendingIntent(
                R.id.widget_tile_study,
                createDeepLinkIntent(context, "study", 203)
            )

            // Root fallback -> home
            views.setOnClickPendingIntent(
                R.id.widget_root,
                createDeepLinkIntent(context, "", 200)
            )

            // Commit RemoteViews update
            appWidgetManager.updateAppWidget(appWidgetId, views)
        }

        private fun readIntPref(prefs: android.content.SharedPreferences, key: String, defaultVal: Int): Int {
            return try {
                val str = prefs.getString(key, null)
                if (str != null) {
                    str.toIntOrNull() ?: defaultVal
                } else {
                    prefs.getInt(key, defaultVal)
                }
            } catch (_: Exception) {
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
                else -> WidgetPhaseColors(
                    cardSurface = ContextCompat.getColor(context, R.color.night_card_surface),
                    cardBorder = ContextCompat.getColor(context, R.color.night_card_border),
                    textPrimary = ContextCompat.getColor(context, R.color.night_text_primary),
                    textSecondary = ContextCompat.getColor(context, R.color.night_text_secondary),
                    textMuted = ContextCompat.getColor(context, R.color.night_text_muted),
                    accent = ContextCompat.getColor(context, R.color.night_accent)
                )
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
