package com.buglens.sdk.upload

import okhttp3.MultipartBody
import retrofit2.Call
import retrofit2.http.Multipart
import retrofit2.http.POST
import retrofit2.http.Part

interface ScreenshotApi {

    @Multipart
    @POST("upload-screenshot")
    fun uploadScreenshot(
        @Part file: MultipartBody.Part
    ): Call<ScreenshotUploadResponse>
}