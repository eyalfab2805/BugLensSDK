package com.buglens.sdk.reporter

import android.app.Activity
import android.app.AlertDialog
import android.content.Context
import android.widget.ArrayAdapter
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.Spinner
import com.buglens.sdk.capture.ScreenshotCapturer
import com.buglens.sdk.capture.ScreenshotStorage
import com.buglens.sdk.collectors.DeviceInfoCollector
import com.buglens.sdk.models.BugReport
import com.buglens.sdk.repository.ReportRepository
import java.util.UUID
import com.buglens.sdk.upload.ReportApiUploader

class BugReportDialog(
    private val context: Context,
    private val apiKey: String?,
    private val userId: String?,
    private val metadata: Map<String, String>
) {

    fun show() {
        val layout = LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(50, 40, 50, 40)
        }

        val titleInput = EditText(context).apply {
            hint = "Bug Title"
        }

        val descriptionInput = EditText(context).apply {
            hint = "Description"
            minLines = 3
        }

        val severitySpinner = Spinner(context)
        val severities = arrayOf("Low", "Medium", "High", "Critical")

        severitySpinner.adapter = ArrayAdapter(
            context,
            android.R.layout.simple_spinner_dropdown_item,
            severities
        )

        severitySpinner.setSelection(1)

        layout.addView(titleInput)
        layout.addView(descriptionInput)
        layout.addView(severitySpinner)

        AlertDialog.Builder(context)
            .setTitle("BugLens Report")
            .setView(layout)
            .setPositiveButton("Submit") { _, _ ->

                val screenshotPath =
                    if (context is Activity) {
                        val bitmap = ScreenshotCapturer.capture(context)
                        ScreenshotStorage.save(context, bitmap)
                    } else {
                        null
                    }

                val report = BugReport(
                    reportId = UUID.randomUUID().toString(),
                    apiKey = apiKey ?: "missing-api-key",
                    userId = userId,
                    title = titleInput.text.toString(),
                    description = descriptionInput.text.toString(),
                    severity = severitySpinner.selectedItem.toString(),
                    metadata = metadata,
                    deviceModel = DeviceInfoCollector.getDeviceModel(),
                    manufacturer = DeviceInfoCollector.getManufacturer(),
                    androidVersion = DeviceInfoCollector.getAndroidVersion(),
                    appVersion = DeviceInfoCollector.getAppVersion(context),
                    screenshotPath = screenshotPath,
                    reportType = "bug",
                    stackTrace = null,
                    createdAt = System.currentTimeMillis()
                )

                ReportRepository.save(report)
                ReportApiUploader.upload(context, report)

                AlertDialog.Builder(context)
                    .setTitle("Report Saved")
                    .setMessage(
                        """
                        Total Reports:
                        ${ReportRepository.getAll().size}

                        Severity:
                        ${report.severity}

                        Screenshot:
                        ${report.screenshotPath}
                        """.trimIndent()
                    )
                    .setPositiveButton("OK", null)
                    .show()
            }
            .setNegativeButton("Cancel", null)
            .show()
    }
}