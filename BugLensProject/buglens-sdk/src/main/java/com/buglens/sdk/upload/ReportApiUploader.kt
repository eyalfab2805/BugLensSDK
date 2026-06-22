package com.buglens.sdk.upload

import android.content.Context
import android.util.Log
import com.buglens.sdk.models.BugReport
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.asRequestBody
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.io.File

object ReportApiUploader {

    private val retrofit = Retrofit.Builder()
        .baseUrl("http://10.0.2.2:8000/")
        .addConverterFactory(GsonConverterFactory.create())
        .build()

    private val reportApi = retrofit.create(ReportApi::class.java)
    private val screenshotApi = retrofit.create(ScreenshotApi::class.java)

    fun upload(context: Context, report: BugReport) {
        val screenshotPath = report.screenshotPath

        if (screenshotPath.isNullOrBlank()) {
            uploadReport(report, null)
            return
        }

        val screenshotFile = File(screenshotPath)

        if (!screenshotFile.exists()) {
            Log.e("BugLens", "Screenshot file does not exist: $screenshotPath")
            uploadReport(report, null)
            return
        }

        val requestBody = screenshotFile
            .asRequestBody("image/png".toMediaTypeOrNull())

        val multipartFile = MultipartBody.Part.createFormData(
            name = "file",
            filename = screenshotFile.name,
            body = requestBody
        )

        screenshotApi.uploadScreenshot(multipartFile)
            .enqueue(object : Callback<ScreenshotUploadResponse> {
                override fun onResponse(
                    call: Call<ScreenshotUploadResponse>,
                    response: Response<ScreenshotUploadResponse>
                ) {
                    if (response.isSuccessful) {
                        val screenshotUrl = response.body()?.url
                        Log.d("BugLens", "Screenshot uploaded: $screenshotUrl")
                        uploadReport(report, screenshotUrl)
                    } else {
                        Log.e("BugLens", "Screenshot upload failed: ${response.code()}")
                        Log.e("BugLens", "Screenshot error body: ${response.errorBody()?.string()}")
                        uploadReport(report, null)
                    }
                }

                override fun onFailure(call: Call<ScreenshotUploadResponse>, t: Throwable) {
                    Log.e("BugLens", "Screenshot upload error", t)
                    uploadReport(report, null)
                }
            })
    }

    private fun uploadReport(report: BugReport, screenshotUrl: String?) {
        val request = ReportRequest(
            report_id = report.reportId,
            api_key = report.apiKey,
            user_id = report.userId,
            title = report.title,
            description = report.description,
            severity = report.severity,
            device_model = report.deviceModel,
            manufacturer = report.manufacturer,
            android_version = report.androidVersion,
            app_version = report.appVersion,
            screenshot_path = screenshotUrl ?: report.screenshotPath,
            created_at = report.createdAt,
            metadata = report.metadata
        )

        reportApi.submitReport(request).enqueue(object : Callback<ReportResponse> {
            override fun onResponse(
                call: Call<ReportResponse>,
                response: Response<ReportResponse>
            ) {
                if (response.isSuccessful) {
                    Log.d("BugLens", "Report uploaded to FastAPI: ${response.body()}")
                } else {
                    Log.e("BugLens", "FastAPI upload failed: ${response.code()}")
                    Log.e("BugLens", "FastAPI error body: ${response.errorBody()?.string()}")
                }
            }

            override fun onFailure(call: Call<ReportResponse>, t: Throwable) {
                Log.e("BugLens", "FastAPI upload error", t)
            }
        })
    }
}