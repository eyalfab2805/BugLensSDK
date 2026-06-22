package com.buglens.sdk.collectors

import android.content.Context
import android.os.Build

object DeviceInfoCollector {

    fun getDeviceModel(): String {
        return Build.MODEL
    }

    fun getManufacturer(): String {
        return Build.MANUFACTURER
    }

    fun getAndroidVersion(): String {
        return Build.VERSION.RELEASE
    }

    fun getAppVersion(context: Context): String {
        return try {
            val packageInfo =
                context.packageManager.getPackageInfo(
                    context.packageName,
                    0
                )

            packageInfo.versionName ?: "Unknown"

        } catch (e: Exception) {
            "Unknown"
        }
    }
}