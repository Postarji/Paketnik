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
    }

    override fun getItemCount(): Int = historyList.size
}