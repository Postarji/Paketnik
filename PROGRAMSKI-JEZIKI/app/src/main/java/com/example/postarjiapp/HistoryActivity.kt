package com.example.postarjiapp

import android.os.Bundle
import android.view.View
import android.widget.Button
import android.widget.TextView
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView

class HistoryActivity : AppCompatActivity() {

    private lateinit var recyclerViewHistory: RecyclerView
    private lateinit var tvEmptyMessage: TextView
    private lateinit var btnClearHistory: Button
    private lateinit var btnBack: Button

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_history)

        initViews()
        setupRecyclerView()
        setupButtons()
        loadHistory()
    }

    private fun initViews() {
        recyclerViewHistory = findViewById(R.id.recyclerViewHistory)
        tvEmptyMessage = findViewById(R.id.tvEmptyMessage)
        btnClearHistory = findViewById(R.id.btnClearHistory)
        btnBack = findViewById(R.id.btnBack)
    }

    private fun setupRecyclerView() {
        recyclerViewHistory.layoutManager = LinearLayoutManager(this)
    }

    private fun setupButtons() {
        btnBack.setOnClickListener {
            finish()
        }

        btnClearHistory.setOnClickListener {
            showClearHistoryDialog()
        }
    }

    private fun loadHistory() {
        val history = HistoryManager.getHistory(this)

        if (history.isEmpty()) {
            tvEmptyMessage.visibility = View.VISIBLE
            recyclerViewHistory.visibility = View.GONE
            btnClearHistory.isEnabled = false
        } else {
            tvEmptyMessage.visibility = View.GONE
            recyclerViewHistory.visibility = View.VISIBLE
            btnClearHistory.isEnabled = true

            val adapter = HistoryAdapter(history)
            recyclerViewHistory.adapter = adapter
        }
    }

    private fun showClearHistoryDialog() {
        AlertDialog.Builder(this)
            .setTitle("Clear History")
            .setMessage("Are you sure you want to clear all history? This action cannot be undone.")
            .setPositiveButton("Clear") { _, _ ->
                HistoryManager.clearHistory(this)
                loadHistory()
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    override fun onResume() {
        super.onResume()
        loadHistory() // Refresh history when returning to this activity
    }
}