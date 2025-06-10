package com.example.postarjiapp

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.TextView
import androidx.core.content.ContextCompat
import androidx.recyclerview.widget.RecyclerView
import java.text.SimpleDateFormat
import java.util.Locale

class HistoryAdapter(private val historyList: List<BoxOpeningHistory>) :
    RecyclerView.Adapter<HistoryAdapter.HistoryViewHolder>() {

    private val dateFormat = SimpleDateFormat("MMM dd, yyyy - HH:mm", Locale.getDefault())

    class HistoryViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        val ivStatus: ImageView = itemView.findViewById(R.id.ivStatus)
        val tvBoxId: TextView = itemView.findViewById(R.id.tvBoxId)
        val tvTimestamp: TextView = itemView.findViewById(R.id.tvTimestamp)
        val tvResult: TextView = itemView.findViewById(R.id.tvResult)
        val tvLocation: TextView = itemView.findViewById(R.id.tvLocation)
        val tvCoordinates: TextView = itemView.findViewById(R.id.tvCoordinates)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): HistoryViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_history, parent, false)
        return HistoryViewHolder(view)
    }

    override fun onBindViewHolder(holder: HistoryViewHolder, position: Int) {
        val history = historyList[position]

        holder.tvBoxId.text = "Box ID: ${history.boxId}"
        holder.tvTimestamp.text = dateFormat.format(history.timestamp)

        // Set success/failure status
        if (history.wasSuccessful) {
            holder.tvResult.text = "SUCCESS"
            holder.tvResult.setBackgroundColor(
                ContextCompat.getColor(holder.itemView.context, android.R.color.holo_green_dark)
            )
            holder.ivStatus.setImageResource(android.R.drawable.ic_dialog_info)
            holder.ivStatus.setColorFilter(
                ContextCompat.getColor(holder.itemView.context, android.R.color.holo_green_dark)
            )
        } else {
            holder.tvResult.text = "FAILED"
            holder.tvResult.setBackgroundColor(
                ContextCompat.getColor(holder.itemView.context, android.R.color.holo_red_dark)
            )
            holder.ivStatus.setImageResource(android.R.drawable.ic_dialog_alert)
            holder.ivStatus.setColorFilter(
                ContextCompat.getColor(holder.itemView.context, android.R.color.holo_red_dark)
            )
        }

        // Display location information
        if (history.latitude != null && history.longitude != null) {
            // Show address if available, otherwise show coordinates
            if (!history.address.isNullOrEmpty()) {
                holder.tvLocation.text = "${history.address}"
                holder.tvLocation.visibility = View.VISIBLE

                // Show coordinates in smaller text
                holder.tvCoordinates.text = "Lat: ${String.format("%.6f", history.latitude)}, Lng: ${String.format("%.6f", history.longitude)}"
                if (history.locationAccuracy != null) {
                    holder.tvCoordinates.text = "${holder.tvCoordinates.text} (±${String.format("%.0f", history.locationAccuracy)}m)"
                }
                holder.tvCoordinates.visibility = View.VISIBLE
            } else {
                // No address, just show coordinates
                holder.tvLocation.text = "Lat: ${String.format("%.6f", history.latitude)}, Lng: ${String.format("%.6f", history.longitude)}"
                if (history.locationAccuracy != null) {
                    holder.tvLocation.text = "${holder.tvLocation.text} (±${String.format("%.0f", history.locationAccuracy)}m)"
                }
                holder.tvLocation.visibility = View.VISIBLE
                holder.tvCoordinates.visibility = View.GONE
            }
        } else {
            // No location data
            holder.tvLocation.text = "Location unavailable"
            holder.tvLocation.visibility = View.VISIBLE
            holder.tvCoordinates.visibility = View.GONE
        }
    }

    override fun getItemCount(): Int = historyList.size
}