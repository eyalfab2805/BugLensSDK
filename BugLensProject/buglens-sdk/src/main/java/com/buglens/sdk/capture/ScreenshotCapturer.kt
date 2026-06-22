package com.buglens.sdk.capture

import android.app.Activity
import android.graphics.Bitmap
import android.view.View

object ScreenshotCapturer {

    fun capture(activity: Activity): Bitmap {

        val rootView: View =
            activity.window.decorView.rootView

        rootView.isDrawingCacheEnabled = true

        val bitmap =
            Bitmap.createBitmap(rootView.drawingCache)

        rootView.isDrawingCacheEnabled = false

        return bitmap
    }
}