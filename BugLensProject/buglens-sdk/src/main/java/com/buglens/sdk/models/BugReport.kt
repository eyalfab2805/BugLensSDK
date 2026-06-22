package com.buglens.sdk.models

data class BugReport(

    val reportId: String,

    val apiKey: String,

    val userId: String?,

    val title: String,

    val description: String,

    val severity: String,

    val metadata: Map<String, String>,

    val deviceModel: String,

    val manufacturer: String,

    val androidVersion: String,

    val appVersion: String,

    val createdAt: Long,

    val screenshotPath: String?
)