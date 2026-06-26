package com.buglens.sdk

import android.app.Activity
import android.content.Context
import android.hardware.Sensor
import android.hardware.SensorManager
import android.widget.Toast
import com.buglens.sdk.collectors.DeviceInfoCollector
import com.buglens.sdk.models.BugReport
import com.buglens.sdk.reporter.BugReportDialog
import com.buglens.sdk.repository.ReportRepository
import com.buglens.sdk.shake.ShakeDetector
import java.io.PrintWriter
import java.io.StringWriter
import java.util.UUID

object BugLens {

    private var appContext: Context? = null
    private var apiKey: String? = null
    private var userId: String? = null
    private val metadata = mutableMapOf<String, String>()

    private var sensorManager: SensorManager? = null
    private var shakeDetector: ShakeDetector? = null

    private var previousCrashHandler: Thread.UncaughtExceptionHandler? = null

    fun init(context: Context, apiKey: String) {
        val applicationContext = context.applicationContext

        this.appContext = applicationContext
        this.apiKey = apiKey

        ReportRepository.uploadPendingReports(applicationContext)
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
            Toast.makeText(
                activity,
                "BugLens: Accelerometer not available",
                Toast.LENGTH_SHORT
            ).show()
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

        Toast.makeText(
            activity,
            "BugLens shake-to-report enabled",
            Toast.LENGTH_SHORT
        ).show()
    }

    fun disableShakeToReport() {
        shakeDetector?.let {
            sensorManager?.unregisterListener(it)
        }

        shakeDetector = null
        sensorManager = null
    }

    fun enableCrashReporting() {
        val context = appContext ?: return

        if (previousCrashHandler != null) {
            return
        }

        previousCrashHandler = Thread.getDefaultUncaughtExceptionHandler()

        Thread.setDefaultUncaughtExceptionHandler { thread, throwable ->

            val stackTrace = getStackTrace(throwable)

            val crashReport = BugReport(
                reportId = UUID.randomUUID().toString(),
                apiKey = apiKey ?: "missing-api-key",
                userId = userId,
                title = "Crash: ${throwable.javaClass.simpleName}",
                description = throwable.message ?: "Application crashed",
                severity = "Critical",
                reportType = "crash",
                stackTrace = stackTrace,
                metadata = metadata.toMap(),
                deviceModel = DeviceInfoCollector.getDeviceModel(),
                manufacturer = DeviceInfoCollector.getManufacturer(),
                androidVersion = DeviceInfoCollector.getAndroidVersion(),
                appVersion = DeviceInfoCollector.getAppVersion(context),
                createdAt = System.currentTimeMillis(),
                screenshotPath = null
            )

            ReportRepository.submit(context, crashReport)

            Thread.sleep(1000)

            previousCrashHandler?.uncaughtException(thread, throwable)
        }
    }

    private fun getStackTrace(throwable: Throwable): String {
        val stringWriter = StringWriter()
        val printWriter = PrintWriter(stringWriter)
        throwable.printStackTrace(printWriter)
        return stringWriter.toString()
    }
}