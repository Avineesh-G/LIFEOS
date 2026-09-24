package com.avineesh.lifeos

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.util.Log
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class BackgroundSyncWorker(
    private val appContext: Context,
    workerParams: WorkerParameters
) : CoroutineWorker(appContext, workerParams) {

    companion object {
        const val TAG = "LifeOSSyncWorker"
        const val PREFS_NAME = "CapacitorStorage"
        const val KEY_PENDING_SYNC = "lifeos_pending_background_sync"
    }

    override suspend fun doWork(): Result = withContext(Dispatchers.IO) {
        try {
            Log.d(TAG, "Network restored: executing background synchronization task")

            val prefs = appContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val hasPending = prefs.getString(KEY_PENDING_SYNC, "false") == "true"

            if (hasPending) {
                Log.d(TAG, "Pending offline changes detected. Synchronizing widget and cloud state...")

                // Synchronize Home Screen widgets to display updated metrics
                try {
                    val appWidgetManager = AppWidgetManager.getInstance(appContext)
                    val ids = appWidgetManager.getAppWidgetIds(
                        ComponentName(appContext, LifeOSWidgetProvider::class.java)
                    )
                    if (ids != null && ids.isNotEmpty()) {
                        for (id in ids) {
                            LifeOSWidgetProvider.updateAppWidget(appContext, appWidgetManager, id)
                        }
                    }
                } catch (we: Exception) {
                    Log.w(TAG, "Widget update during sync: ${we.message}")
                }

                // Mark sync processed in preferences
                prefs.edit().putString(KEY_PENDING_SYNC, "false").apply()
                Log.d(TAG, "Background sync completed successfully")
            } else {
                Log.d(TAG, "No pending offline mutations. Sync worker idle.")
            }

            Result.success()
        } catch (e: Exception) {
            Log.e(TAG, "Background sync failed: ${e.message}", e)
            Result.retry()
        }
    }
}
