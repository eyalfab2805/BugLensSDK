package com.buglens.sdk.shake

import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener

class ShakeDetector(
    private val onShake: () -> Unit
) : SensorEventListener {

    private var lastX = 0f
    private var lastY = 0f
    private var lastZ = 0f

    private var lastShakeTime = 0L
    private var initialized = false

    override fun onSensorChanged(event: SensorEvent?) {
        if (event?.sensor?.type != Sensor.TYPE_ACCELEROMETER) return

        val x = event.values[0]
        val y = event.values[1]
        val z = event.values[2]

        if (!initialized) {
            lastX = x
            lastY = y
            lastZ = z
            initialized = true
            return
        }

        val deltaX = kotlin.math.abs(x - lastX)
        val deltaY = kotlin.math.abs(y - lastY)
        val deltaZ = kotlin.math.abs(z - lastZ)

        lastX = x
        lastY = y
        lastZ = z

        val shakeStrength = deltaX + deltaY + deltaZ

        val now = System.currentTimeMillis()

        if (
            shakeStrength > SHAKE_THRESHOLD &&
            now - lastShakeTime > SHAKE_COOLDOWN_MS
        ) {
            lastShakeTime = now
            onShake()
        }
    }

    override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {}

    companion object {
        private const val SHAKE_THRESHOLD = 8f
        private const val SHAKE_COOLDOWN_MS = 1500L
    }
}