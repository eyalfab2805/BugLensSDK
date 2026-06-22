package com.buglens.sdk

import android.app.Activity
import android.content.Context
import android.hardware.Sensor
import android.hardware.SensorManager
import android.widget.Toast
import com.buglens.sdk.reporter.BugReportDialog
import com.buglens.sdk.shake.ShakeDetector

object BugLens {

    private var appContext: Context? = null
    private var apiKey: String? = null
    private var userId: String? = null
    private val metadata = mutableMapOf<String, String>()

    private var sensorManager: SensorManager? = null
    private var shakeDetector: ShakeDetector? = null

    fun init(context: Context, apiKey: String) {
        this.appContext = context.applicationContext
        this.apiKey = apiKey
    }

    fun showReporter(activity: Activity) {
        BugReportDialog(
            context = activity,
            apiKey = apiKey,
            userId = userId,
            metadata = metadata.toMap()
        ).show()
    }

    fun setUserId(userId: String) {
        this.userId = userId
    }

    fun setMetadata(key: String, value: String) {
        metadata[key] = value
    }

    fun enableShakeToReport(activity: Activity) {
        sensorManager = activity.getSystemService(Context.SENSOR_SERVICE) as SensorManager

        val accelerometer = sensorManager?.getDefaultSensor(Sensor.TYPE_ACCELEROMETER)

        if (accelerometer == null) {
            Toast.makeText(activity, "BugLens: Accelerometer not available", Toast.LENGTH_SHORT).show()
            return
        }

        shakeDetector = ShakeDetector {
            activity.runOnUiThread {
                showReporter(activity)
            }
        }

        sensorManager?.registerListener(
            shakeDetector,
            accelerometer,
            SensorManager.SENSOR_DELAY_UI
        )

        Toast.makeText(activity, "BugLens shake-to-report enabled", Toast.LENGTH_SHORT).show()
    }

    fun disableShakeToReport() {
        shakeDetector?.let {
            sensorManager?.unregisterListener(it)
        }

        shakeDetector = null
        sensorManager = null
    }

    fun enableCrashReporting() {
        // TODO
    }
}