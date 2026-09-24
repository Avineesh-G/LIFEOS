package com.avineesh.lifeos

import android.content.Context
import android.util.Log
import androidx.work.Constraints
import androidx.work.ExistingWorkPolicy
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

@CapacitorPlugin(name = "SyncManager")
class SyncManagerPlugin : Plugin() {

    companion object {
        const val WORK_NAME = "LifeOSBackgroundSync"
        const val TAG = "SyncManagerPlugin"
    }

    @PluginMethod
    fun enqueueBackgroundSync(call: PluginCall) {
        val ctx = context ?: run {
            call.reject("Context unavailable")
            return
        }

        try {
            // Set pending sync flag in CapacitorStorage
            val prefs = ctx.getSharedPreferences("CapacitorStorage", Context.MODE_PRIVATE)
            prefs.edit().putString("lifeos_pending_background_sync", "true").apply()

            // Define network-connectivity requirement
            val constraints = Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .build()

            val workRequest = OneTimeWorkRequestBuilder<BackgroundSyncWorker>()
                .setConstraints(constraints)
                .addTag(WORK_NAME)
                .build()

            WorkManager.getInstance(ctx).enqueueUniqueWork(
                WORK_NAME,
                ExistingWorkPolicy.REPLACE,
                workRequest
            )

            Log.d(TAG, "Enqueued WorkManager background sync task on network connection")
            call.resolve()
        } catch (e: Exception) {
            Log.e(TAG, "Failed to enqueue background sync: ${e.message}", e)
            call.reject(e.message)
        }
    }

    @PluginMethod
    fun cancelBackgroundSync(call: PluginCall) {
        val ctx = context ?: run {
            call.reject("Context unavailable")
            return
        }

        try {
            val prefs = ctx.getSharedPreferences("CapacitorStorage", Context.MODE_PRIVATE)
            prefs.edit().putString("lifeos_pending_background_sync", "false").apply()

            WorkManager.getInstance(ctx).cancelUniqueWork(WORK_NAME)
            Log.d(TAG, "Cancelled WorkManager background sync task")
            call.resolve()
        } catch (e: Exception) {
            Log.e(TAG, "Failed to cancel background sync: ${e.message}", e)
            call.reject(e.message)
        }
    }
}
