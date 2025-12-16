package dev.postarji.history

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject

object HistoryStore {
    private const val PREFS = "postarji_history"
    private const val KEY = "entries_json"

    fun addEntry(context: Context, entry: HistoryEntry) {
        val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val current = prefs.getString(KEY, "[]") ?: "[]"
        val arr = JSONArray(current)

        val obj = JSONObject().apply {
            put("boxId", entry.boxId)
            put("timestampMillis", entry.timestampMillis)
            put("success", entry.success)
            put("locationText", entry.locationText)
        }
        val newArr = JSONArray().apply {
            put(obj)
            for (i in 0 until arr.length()) put(arr.getJSONObject(i))
        }

        prefs.edit().putString(KEY, newArr.toString()).apply()
    }

    fun loadEntries(context: Context): List<HistoryEntry> {
        val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val raw = prefs.getString(KEY, "[]") ?: "[]"
        val arr = JSONArray(raw)
        val out = ArrayList<HistoryEntry>(arr.length())
        for (i in 0 until arr.length()) {
            val o = arr.getJSONObject(i)
            out.add(
                HistoryEntry(
                    boxId = o.getInt("boxId"),
                    timestampMillis = o.getLong("timestampMillis"),
                    success = o.getBoolean("success"),
                    locationText = o.optString("locationText", "Location unavailable")
                )
            )
        }
        return out
    }

    fun clear(context: Context) {
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .edit().putString(KEY, "[]").apply()
    }
}
