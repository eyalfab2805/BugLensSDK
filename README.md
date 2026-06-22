# BugLens SDK

BugLens SDK is an Android bug reporting and crash reporting SDK inspired by tools such as Instabug, Sentry, and Firebase Crashlytics.

The project was developed as part of an Android SDK university course and demonstrates the complete lifecycle of bug and crash collection, backend processing, and developer-facing analytics.

---

## Overview

BugLens enables Android applications to:

* Report bugs directly from within the application
* Capture and upload screenshots
* Collect device and application information
* Attach custom metadata
* Automatically report application crashes
* Analyze reports through a dedicated developer portal

The project includes three major components:

1. Android SDK (Kotlin)
2. FastAPI Backend (Python)
3. React Developer Portal (TypeScript)

---

## Features

### Bug Reporting

Users can manually submit bug reports directly from the application.

Each report includes:

* Title
* Description
* Screenshot
* Device information
* App information
* Custom metadata
* Severity level

---

### Automatic Crash Reporting

BugLens automatically captures unhandled application crashes.

Collected crash information includes:

* Exception type
* Error message
* Full stack trace
* Device information
* App version
* Custom metadata

Crash reports are uploaded automatically and appear in the developer portal.

---

### Screenshot Capture

BugLens automatically captures screenshots when a report is submitted.

Flow:

Activity → Screenshot → Upload → Backend Storage → Developer Portal

---

### Metadata Collection

Applications can attach custom metadata to reports.

Example:

```kotlin
BugLens.setMetadata("screen", "CheckoutScreen")
BugLens.setMetadata("feature", "Payments")
```

This metadata is available for analytics in the portal.

---

### Severity Levels

Supported severity levels:

* Low
* Medium
* High
* Critical

Severity information is stored and visualized in the dashboard.

---

### Shake To Report

BugLens supports opening the reporting dialog by physically shaking the device.

Flow:

Device Shake → Accelerometer Detection → Report Dialog

---

## Architecture

```text
Android Demo App
        ↓
    BugLens SDK
        ↓
   Retrofit REST API
        ↓
    FastAPI Backend
        ↓
      SQLite
        ↓
React Developer Portal
```

---

## SDK Public API

```kotlin
BugLens.init(context, apiKey)

BugLens.showReporter(activity)

BugLens.setUserId(userId)

BugLens.setMetadata(key, value)

BugLens.enableShakeToReport(activity)

BugLens.enableCrashReporting()
```

---

## Backend

The backend is implemented using FastAPI and SQLAlchemy.

### Responsibilities

* Store bug reports
* Store crash reports
* Upload screenshots
* Manage report status
* Provide analytics data
* Serve screenshots to the developer portal

### Supported Endpoints

```http
POST   /reports

GET    /reports

GET    /reports/{report_id}

GET    /reports/status/{status}

GET    /reports/type/{report_type}

PATCH  /reports/{report_id}/status

POST   /upload-screenshot
```

---

## Database

Current database:

```text
SQLite
```

Stored information includes:

* Report ID
* User ID
* Title
* Description
* Severity
* Report Type
* Stack Trace
* Device Information
* App Information
* Metadata
* Screenshot URL
* Status
* Timestamp

---

## Developer Portal

The developer portal is built using:

* React
* TypeScript
* Vite
* Recharts
* Axios

### Dashboard Features

* Total Reports
* Total Crashes
* Critical Reports
* Resolution Rate
* Device Analytics
* Android Version Analytics
* App Version Analytics
* Severity Analytics
* Metadata Analytics
* Bug vs Crash Analytics

---

### Report Management

Developers can:

* View all reports
* Filter reports
* Change report status
* View screenshots
* View crash stack traces
* Inspect metadata

---

## Technologies Used

### Android SDK

* Kotlin
* Android SDK
* Retrofit
* Gson

### Backend

* Python
* FastAPI
* SQLAlchemy
* SQLite

### Developer Portal

* React
* TypeScript
* Vite
* Recharts
* Axios

---

## Demo Application

The project includes a sample Android application called BugShop.

The demo app simulates:

* Checkout Screen
* Product Screen
* Bug Reporting
* Crash Reporting

This allows realistic metadata analytics inside the developer portal.

---

## Future Improvements

Potential future enhancements include:

* PostgreSQL support
* Offline report queue
* Network request logging
* User session recording
* ANR detection
* Crash grouping
* Email notifications
* Authentication and multi-project support

---

## Project Status


Implemented Features:

✅ Bug Reporting

✅ Crash Reporting

✅ Screenshot Capture

✅ Screenshot Upload

✅ Metadata Collection

✅ Severity Levels

✅ Shake To Report

✅ FastAPI Backend

✅ Developer Portal

✅ Analytics Dashboard

---

Developed as part of an Android SDK course project.
