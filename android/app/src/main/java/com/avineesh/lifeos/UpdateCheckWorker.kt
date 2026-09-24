package com.avineesh.lifeos

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.work.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.io.BufferedReader
import java.io.InputStreamReader
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.TimeUnit

/**
 * Background worker that checks for LifeOS APK updates periodically
 * and alerts the user directly in the phone notification shade without needing to open the app.
 */
class UpdateCheckWorker(
    private val appContext: Context,
    workerParams: WorkerParameters
) : CoroutineWorker(appContext, workerParams) {

    companion object {
        const val TAG = "LifeOSUpdateWorker"
        const val WORK_NAME = "LifeOSPeriodicUpdateCheck"
        const val CHANNEL_ID = "lifeos_updates"
        const val NOTIFICATION_ID = 9001
        const val PREFS_NAME = "LifeOSUpdates"
        const val KEY_LAST_NOTIFIED_CODE = "last_notified_version_code"

        private val VERSION_URLS = listOf(
            "https://lifeos-gujjeti-avineeshs-projects.vercel.app/version.json",
            "https://raw.githubusercontent.com/Avineesh-G/LIFEOS/main/public/version.json"
        )

        /**
         * Schedules periodic background update checks using Android WorkManager
         */
        @JvmStatic
        fun schedulePeriodicCheck(context: Context) {
            try {
                val constraints = Constraints.Builder()
                    .setRequiredNetworkType(NetworkType.CONNECTED)
                    .build()

                // Check every 2 hours with a 15-minute flex interval
                val periodicWorkRequest = PeriodicWorkRequestBuilder<UpdateCheckWorker>(
                    2, TimeUnit.HOURS,
                    15, TimeUnit.MINUTES
                )
                    .setConstraints(constraints)
                    .addTag(WORK_NAME)
                    .build()

                WorkManager.getInstance(context).enqueueUniquePeriodicWork(
                    WORK_NAME,
                    ExistingPeriodicWorkPolicy.KEEP,
                    periodicWorkRequest
                )
                Log.d(TAG, "Scheduled periodic update check with WorkManager")
            } catch (e: Exception) {
                Log.e(TAG, "Failed to schedule update check worker: ${e.message}", e)
            }
        }
    }

    override suspend fun doWork(): Result = withContext(Dispatchers.IO) {
        try {
            Log.d(TAG, "Checking for LifeOS updates in background...")

            // 1. Get currently installed version code
            val packageInfo = appContext.packageManager.getPackageInfo(appContext.packageName, 0)
            val currentVersionCode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                packageInfo.longVersionCode.toInt()
            } else {
                @Suppress("DEPRECATION")
                packageInfo.versionCode
            }

            // 2. Fetch remote version info
            var remoteJson: JSONObject? = null
            for (urlStr in VERSION_URLS) {
                try {
                    val url = URL(urlStr)
                    val conn = url.openConnection() as HttpURLConnection
                    conn.connectTimeout = 8000
                    conn.readTimeout = 8000
                    conn.requestMethod = "GET"
                    conn.setRequestProperty("User-Agent", "LifeOS-Android-Background")

                    if (conn.responseCode == 200) {
                        val reader = BufferedReader(InputStreamReader(conn.inputStream))
                        val response = reader.use { it.readText() }
                        remoteJson = JSONObject(response)
                        conn.disconnect()
                        break
                    }
                    conn.disconnect()
                } catch (e: Exception) {
                    Log.w(TAG, "Failed reading $urlStr: ${e.message}")
                }
            }

            if (remoteJson == null) {
                Log.d(TAG, "Could not fetch remote version metadata. Retrying later.")
                return@withContext Result.retry()
            }

            val remoteVersionCode = remoteJson.optInt("versionCode", 0)
            val remoteVersionName = remoteJson.optString("versionName", "")
            val releaseNotes = remoteJson.optString("releaseNotes", "New performance enhancements and features.")

            Log.d(TAG, "Installed: $currentVersionCode, Remote: $remoteVersionCode ($remoteVersionName)")

            if (remoteVersionCode > currentVersionCode) {
                val prefs = appContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
                val lastNotified = prefs.getInt(KEY_LAST_NOTIFIED_CODE, 0)

                // Only notify if we haven't already alerted for this specific remote build
                if (remoteVersionCode > lastNotified) {
                    postUpdateNotification(remoteVersionName, releaseNotes)
                    prefs.edit().putInt(KEY_LAST_NOTIFIED_CODE, remoteVersionCode).apply()
                    Log.d(TAG, "Posted background update notification for v$remoteVersionName (code $remoteVersionCode)")
                }
            }

            Result.success()
        } catch (e: Exception) {
            Log.e(TAG, "Background update check encountered an error: ${e.message}", e)
            Result.retry()
        }
    }

    private fun postUpdateNotification(versionName: String, releaseNotes: String) {
        val notificationManager = appContext.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        // Create notification channel if on Android O+
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "LifeOS System Updates",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Alerts when a newer version of LifeOS is available for installation"
                enableLights(true)
                enableVibration(true)
            }
            notificationManager.createNotificationChannel(channel)
        }

        // Tap intent to open MainActivity
        val openIntent = Intent(appContext, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra("OPEN_UPDATER", true)
        }
        val pendingIntent = PendingIntent.getActivity(
            appContext,
            0,
            openIntent,
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE else PendingIntent.FLAG_UPDATE_CURRENT
        )

        val cleanNotes = if (releaseNotes.isNotBlank()) releaseNotes else "Tap to install the latest LifeOS update."

        val notification = NotificationCompat.Builder(appContext, CHANNEL_ID)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle("LifeOS Update Available: v$versionName")
            .setContentText("Tap to view new features and update LifeOS.")
            .setStyle(
                NotificationCompat.BigTextStyle()
                    .bigText(cleanNotes)
                    .setSummaryText("LifeOS $versionName")
            )
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)
            .build()

        notificationManager.notify(NOTIFICATION_ID, notification)
    }
}
