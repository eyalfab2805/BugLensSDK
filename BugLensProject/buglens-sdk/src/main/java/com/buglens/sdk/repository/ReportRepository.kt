package com.buglens.sdk.repository

import android.content.Context
import android.util.Log
import com.buglens.sdk.models.BugReport
import com.buglens.sdk.offline.OfflineReportStore
import com.buglens.sdk.upload.ReportApiUploader

object ReportRepository {

    fun submit(context: Context, report: BugReport) {
        ReportApiUploader.upload(context, report) { success ->
            if (success) {
                Log.d("BugLens", "Report submitted successfully")
                uploadPendingReports(context)
            } else {
                Log.e("BugLens", "Report upload failed. Saving offline.")
                OfflineReportStore.save(context, report)
            }
        }
    }

    fun uploadPendingReports(context: Context) {
        val pendingReports = OfflineReportStore.getAll(context)

        if (pendingReports.isEmpty()) {
            Log.d("BugLens", "No pending offline reports")
            return
        }

        Log.d("BugLens", "Trying to upload ${pendingReports.size} pending reports")

        pendingReports.forEach { report ->
            ReportApiUploader.upload(context, report) { success ->
                if (success) {
                    Log.d("BugLens", "Pending report uploaded: ${report.reportId}")
                    OfflineReportStore.delete(context, report)
                } else {
                    Log.e("BugLens", "Pending report still failed: ${report.reportId}")
                }
            }
        }
    }
}