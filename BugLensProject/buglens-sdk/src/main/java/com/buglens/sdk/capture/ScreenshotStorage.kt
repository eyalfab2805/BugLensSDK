package com.buglens.sdk.capture

import android.content.Context
import android.graphics.Bitmap
import java.io.File
import java.io.FileOutputStream
import java.util.UUID

object ScreenshotStorage {

    private const val DIRECTORY_NAME = "buglens_screenshots"

    fun save(
        context: Context,
        bitmap: Bitmap
    ): String {
        return saveToFile(context, bitmap).absolutePath
    }

    fun saveToFile(
        context: Context,
        bitmap: Bitmap
    ): File {

        val screenshotDirectory = File(
            context.filesDir,
            DIRECTORY_NAME
        )

        if (!screenshotDirectory.exists()) {
            screenshotDirectory.mkdirs()
        }

        val file = File(
            screenshotDirectory,
            "buglens_${UUID.randomUUID()}.png"
        )

        FileOutputStream(file).use {
            bitmap.compress(
                Bitmap.CompressFormat.PNG,
                100,
                it
            )
        }

        return file
    }

    fun deleteScreenshot(path: String?) {
        if (path.isNullOrBlank()) return

        val file = File(path)

        if (file.exists()) {
            file.delete()
        }
    }
}