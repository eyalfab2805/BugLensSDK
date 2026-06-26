package com.buglens.sdk.offline

import android.content.Context
import com.buglens.sdk.models.BugReport
import com.google.gson.Gson
import java.io.File

object OfflineReportStore {

    private const val DIRECTORY_NAME = "buglens_pending_reports"
    private val gson = Gson()

    private fun getQueueDir(context: Context): File {
        val dir = File(context.filesDir, DIRECTORY_NAME)
        if (!dir.exists()) {
            dir.mkdirs()
        }
        return dir
    }

    fun save(context: Context, report: BugReport) {
        val file = File(getQueueDir(context), "${report.reportId}.json")
        file.writeText(gson.toJson(report))
    }

    fun getAll(context: Context): List<BugReport> {
        val dir = getQueueDir(context)

        return dir.listFiles()
            ?.filter { it.extension == "json" }
            ?.mapNotNull { file ->
                try {
                    gson.fromJson(file.readText(), BugReport::class.java)
                } catch (e: Exception) {
                    null
                }
            }
            ?: emptyList()
    }

    fun delete(context: Context, report: BugReport) {
        val file = File(getQueueDir(context), "${report.reportId}.json")
        if (file.exists()) {
            file.delete()
        }
    }
}