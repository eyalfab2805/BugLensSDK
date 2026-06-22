package com.buglens.sdk.upload

data class ReportRequest(
    val report_id: String,
    val api_key: String,
    val user_id: String?,
    val title: String,
    val description: String,
    val severity: String,
    val device_model: String,
    val manufacturer: String,
    val android_version: String,
    val app_version: String,
    val screenshot_path: String?,
    val created_at: Long,
    val metadata: Map<String, String>
)