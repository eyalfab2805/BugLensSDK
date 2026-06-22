package com.example.buglensproject

import android.os.Bundle
import android.widget.Button
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import com.buglens.sdk.BugLens

class MainActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        enableEdgeToEdge()
        setContentView(R.layout.activity_main)

        BugLens.init(
            context = applicationContext,
            apiKey = "demo-api-key"
        )

        BugLens.setUserId("demo-user-123")

        BugLens.setMetadata(
            key = "screen",
            value = "MainActivity"
        )

        BugLens.setMetadata(
            key = "feature",
            value = "Bug Reporting Demo"
        )

        BugLens.enableShakeToReport(this)

        findViewById<Button>(R.id.btnBugLens).setOnClickListener {
            BugLens.showReporter(this)
        }

        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main)) { view, insets ->
            val systemBars =
                insets.getInsets(WindowInsetsCompat.Type.systemBars())

            view.setPadding(
                systemBars.left,
                systemBars.top,
                systemBars.right,
                systemBars.bottom
            )

            insets
        }
    }

    override fun onDestroy() {
        super.onDestroy()

        BugLens.disableShakeToReport()
    }
}