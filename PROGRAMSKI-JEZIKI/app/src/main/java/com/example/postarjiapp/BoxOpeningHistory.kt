package com.example.postarjiapp

import java.util.Date

data class BoxOpeningHistory(
    val boxId: String,
    val timestamp: Date,
    val wasSuccessful: Boolean,
    val attemptType: String = "QR_SCAN",
    val latitude: Double? = null,
    val longitude: Double? = null,
    val locationAccuracy: Float? = null,
    val address: String? = null
)