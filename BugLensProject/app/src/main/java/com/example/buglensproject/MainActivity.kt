package com.example.buglensproject

import android.os.Bundle
import android.widget.Button
import android.widget.TextView
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import com.buglens.sdk.BugLens

class MainActivity : AppCompatActivity() {

    private var isCheckoutScreen = true

    private lateinit var titleText: TextView
    private lateinit var subtitleText: TextView
    private lateinit var switchScreenButton: Button

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        enableEdgeToEdge()
        setContentView(R.layout.activity_main)

        titleText = findViewById(R.id.tvTitle)
        subtitleText = findViewById(R.id.tvSubtitle)
        switchScreenButton = findViewById(R.id.btnSwitchScreen)

        BugLens.init(
            context = applicationContext,
            apiKey = "demo-api-key"
        )

        BugLens.setUserId("demo-user-123")

        updateDemoScreen()

        BugLens.enableShakeToReport(this)
        BugLens.enableCrashReporting()

        findViewById<Button>(R.id.btnBugLens).setOnClickListener {
            BugLens.showReporter(this)
        }

        findViewById<Button>(R.id.btnCrash).setOnClickListener {
            val screenName = if (isCheckoutScreen) {
                "Checkout"
            } else {
                "Product"
            }

            throw RuntimeException("BugLens simulated $screenName screen crash")
        }

        switchScreenButton.setOnClickListener {
            isCheckoutScreen = !isCheckoutScreen
            updateDemoScreen()
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

    private fun updateDemoScreen() {
        if (isCheckoutScreen) {
            titleText.text = "BugShop Checkout"
            subtitleText.text = "Screen: CheckoutScreen • Feature: Payments"
            switchScreenButton.text = "Switch to Product Screen"

            BugLens.setMetadata(
                key = "screen",
                value = "CheckoutScreen"
            )

            BugLens.setMetadata(
                key = "feature",
                value = "Payments"
            )
        } else {
            titleText.text = "BugShop Product"
            subtitleText.text = "Screen: ProductScreen • Feature: Product Catalog"
            switchScreenButton.text = "Switch to Checkout Screen"

            BugLens.setMetadata(
                key = "screen",
                value = "ProductScreen"
            )

            BugLens.setMetadata(
                key = "feature",
                value = "Product Catalog"
            )
        }
    }

    override fun onDestroy() {
        super.onDestroy()

        BugLens.disableShakeToReport()
    }
}