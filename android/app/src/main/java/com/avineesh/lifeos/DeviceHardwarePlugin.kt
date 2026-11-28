package com.avineesh.lifeos

import android.app.ActivityManager
import android.content.Context
import android.os.Build
import android.os.Environment
import android.os.StatFs
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

@CapacitorPlugin(name = "DeviceHardware")
class DeviceHardwarePlugin : Plugin() {

    private fun normalizeRamGb(totalBytes: Long): Int {
        val rawGb = totalBytes.toDouble() / (1024.0 * 1024.0 * 1024.0)
        // Standard marketed mobile RAM capacities (Android kernel reserves ~3-8% below nominal)
        val nominalTiers = intArrayOf(2, 3, 4, 6, 8, 12, 16, 24, 32)
        for (tier in nominalTiers) {
            if (rawGb >= tier * 0.82 && rawGb <= tier * 1.05) {
                return tier
            }
        }
        return kotlin.math.max(1, kotlin.math.ceil(rawGb).toInt())
    }

    private fun formatDeviceModel(): String {
        val rawManufacturer = (Build.MANUFACTURER ?: "").trim()
        val rawModel = (Build.MODEL ?: "").trim()
        val brand = if (rawManufacturer.isNotEmpty()) {
            rawManufacturer.replaceFirstChar { it.uppercaseChar() }
        } else {
            ""
        }
        if (rawModel.isEmpty()) return if (brand.isNotEmpty()) brand else "Android Device"
        return if (brand.isNotEmpty() && !rawModel.lowercase().startsWith(brand.lowercase())) {
            "$brand $rawModel"
        } else {
            rawModel
        }
    }

    @PluginMethod
    fun getHardwareInfo(call: PluginCall) {
        val ctx = context ?: run {
            call.reject("Context unavailable")
            return
        }

        try {
            val actManager = ctx.getSystemService(Context.ACTIVITY_SERVICE) as? ActivityManager
            val memInfo = ActivityManager.MemoryInfo()
            actManager?.getMemoryInfo(memInfo)

            val totalRamBytes = memInfo.totalMem
            val totalRamGb = if (totalRamBytes > 0L) normalizeRamGb(totalRamBytes) else 4
            val cores = Runtime.getRuntime().availableProcessors().coerceAtLeast(1)

            val stat = StatFs(Environment.getDataDirectory().path)
            val freeBytes = stat.availableBytes
            val totalStorageBytes = stat.totalBytes

            val result = JSObject()
            result.put("model", Build.MODEL ?: "")
            result.put("manufacturer", Build.MANUFACTURER ?: "")
            result.put("deviceName", formatDeviceModel())
            result.put("androidVersion", Build.VERSION.RELEASE ?: "")
            result.put("totalRamBytes", totalRamBytes.toDouble())
            result.put("totalRamGb", totalRamGb)
            result.put("cores", cores)
            result.put("storageFreeBytes", freeBytes.toDouble())
            result.put("storageTotalBytes", totalStorageBytes.toDouble())

            call.resolve(result)
        } catch (e: Exception) {
            call.reject(e.message ?: "Failed to read device hardware info")
        }
    }
}
