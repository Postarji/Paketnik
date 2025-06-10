package com.example.postarjiapp

import android.content.Context
import android.content.SharedPreferences
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import java.util.Date

object HistoryManager {
    private const val PREF_NAME = "box_opening_history"
    private const val HISTORY_KEY = "history_list"
    private val gson = Gson()

    fun addHistoryEntry(
        context: Context,
        boxId: String,
        wasSuccessful: Boolean,
        attemptType: String = "QR_SCAN",
        latitude: Double? = null,
        longitude: Double? = null,
        accuracy: Float? = null,
        address: String? = null
    ) {
        val history = getHistory(context).toMutableList()
        history.add(0, BoxOpeningHistory(
            boxId = boxId,
            timestamp = Date(),
            wasSuccessful = wasSuccessful,
            attemptType = attemptType,
            latitude = latitude,
            longitude = longitude,
            locationAccuracy = accuracy,
            address = address
        ))

        // Keep last 100 entries
        if (history.size > 100) {
            history.removeAt(history.size - 1)
        }

        saveHistory(context, history)
    }

    fun addHistoryEntryWithLocation(
        context: Context,
        boxId: String,
        wasSuccessful: Boolean,
        attemptType: String = "QR_SCAN",
        callback: (() -> Unit)? = null
    ) {
        // Get location and then add history entry
        LocationHelper.getCurrentLocation(context) { lat, lng, accuracy, address ->
            addHistoryEntry(context, boxId, wasSuccessful, attemptType, lat, lng, accuracy, address)
            callback?.invoke()
        }
    }

    fun getHistory(context: Context): List<BoxOpeningHistory> {
        val prefs = getPreferences(context)
        val jsonString = prefs.getString(HISTORY_KEY, null) ?: return emptyList()

        return try {
            val type = object : TypeToken<List<BoxOpeningHistory>>() {}.type
            gson.fromJson(jsonString, type) ?: emptyList()
        } catch (e: Exception) {
            emptyList()
        }
    }

    private fun saveHistory(context: Context, history: List<BoxOpeningHistory>) {
        val prefs = getPreferences(context)
        val jsonString = gson.toJson(history)
        prefs.edit().putString(HISTORY_KEY, jsonString).apply()
    }

    private fun getPreferences(context: Context): SharedPreferences {
        return context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)
    }

    fun clearHistory(context: Context) {
        getPreferences(context).edit().clear().apply()
    }
}