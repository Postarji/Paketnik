package dev.postarji.history

data class HistoryEntry(
    val boxId: Int,
    val timestampMillis: Long,
    val success: Boolean,
    val locationText: String = "Location unavailable"
)
