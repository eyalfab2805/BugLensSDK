package com.buglens.sdk.capture

import android.content.Context
import android.graphics.Bitmap
import java.io.File
import java.io.FileOutputStream
import java.util.UUID

object ScreenshotStorage {

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
        val file = File(
            context.cacheDir,
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
}