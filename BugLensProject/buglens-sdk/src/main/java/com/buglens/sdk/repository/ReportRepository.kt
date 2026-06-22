package com.buglens.sdk.repository

import com.buglens.sdk.models.BugReport

object ReportRepository {

    private val reports = mutableListOf<BugReport>()

    fun save(report: BugReport) {
        reports.add(report)
    }

    fun getAll(): List<BugReport> {
        return reports
    }
}