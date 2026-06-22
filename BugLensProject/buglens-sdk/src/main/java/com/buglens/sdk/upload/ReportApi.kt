package com.buglens.sdk.upload

import retrofit2.Call
import retrofit2.http.Body
import retrofit2.http.POST

interface ReportApi {

    @POST("reports")
    fun submitReport(
        @Body report: ReportRequest
    ): Call<ReportResponse>
}