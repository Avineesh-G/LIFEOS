package com.avineesh.lifeos

import android.app.Activity
import android.appwidget.AppWidgetManager
import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.util.Log
import android.widget.Button
import android.widget.CheckBox
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity

class WidgetConfigActivity : AppCompatActivity() {

    private var appWidgetId = AppWidgetManager.INVALID_APPWIDGET_ID

    private lateinit var checkStreak: CheckBox
    private lateinit var checkTasks: CheckBox
    private lateinit var checkStudy: CheckBox
    private lateinit var checkSchedule: CheckBox
    private lateinit var checkSpending: CheckBox

    private lateinit var itemStreak: LinearLayout
    private lateinit var itemTasks: LinearLayout
    private lateinit var itemStudy: LinearLayout
    private lateinit var itemSchedule: LinearLayout
    private lateinit var itemSpending: LinearLayout

    private lateinit var tvCounter: TextView
    private lateinit var btnSave: Button
    private lateinit var btnCancel: Button

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // 1. Crucial: Default to RESULT_CANCELED so backing out cancels widget placement
        setResult(Activity.RESULT_CANCELED)

        // 2. Read appWidgetId from launching Intent
        appWidgetId = intent?.extras?.getInt(
            AppWidgetManager.EXTRA_APPWIDGET_ID,
            AppWidgetManager.INVALID_APPWIDGET_ID
        ) ?: AppWidgetManager.INVALID_APPWIDGET_ID

        Log.d(TAG, "WidgetConfigActivity opened for appWidgetId: $appWidgetId")

        if (appWidgetId == AppWidgetManager.INVALID_APPWIDGET_ID) {
            Log.e(TAG, "Invalid appWidgetId received, finishing activity")
            finish()
            return
        }

        setContentView(R.layout.activity_widget_config)

        // Bind UI elements
        checkStreak = findViewById(R.id.config_check_streak)
        checkTasks = findViewById(R.id.config_check_tasks)
        checkStudy = findViewById(R.id.config_check_study)
        checkSchedule = findViewById(R.id.config_check_schedule)
        checkSpending = findViewById(R.id.config_check_spending)

        itemStreak = findViewById(R.id.item_streak)
        itemTasks = findViewById(R.id.item_tasks)
        itemStudy = findViewById(R.id.item_study)
        itemSchedule = findViewById(R.id.item_schedule)
        itemSpending = findViewById(R.id.item_spending)

        tvCounter = findViewById(R.id.config_counter)
        btnSave = findViewById(R.id.config_btn_save)
        btnCancel = findViewById(R.id.config_btn_cancel)

        // 3. Load existing config if available, else default to streak, tasks, study
        loadExistingConfig()

        // 4. Setup toggle listeners on cards
        setupCardToggle(itemStreak, checkStreak)
        setupCardToggle(itemTasks, checkTasks)
        setupCardToggle(itemStudy, checkStudy)
        setupCardToggle(itemSchedule, checkSchedule)
        setupCardToggle(itemSpending, checkSpending)

        updateCounterAndButton()

        btnCancel.setOnClickListener {
            finish()
        }

        btnSave.setOnClickListener {
            saveConfigAndFinish()
        }
    }

    private fun loadExistingConfig() {
        val prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val configStr = prefs.getString("widget_config_$appWidgetId", null)

        val selectedStats = if (!configStr.isNullOrEmpty()) {
            configStr.split(",").map { it.trim() }.filter { it.isNotEmpty() }
        } else {
            listOf("streak", "tasks", "study")
        }

        checkStreak.isChecked = selectedStats.contains("streak")
        checkTasks.isChecked = selectedStats.contains("tasks")
        checkStudy.isChecked = selectedStats.contains("study")
        checkSchedule.isChecked = selectedStats.contains("schedule")
        checkSpending.isChecked = selectedStats.contains("spending")
    }

    private fun setupCardToggle(card: LinearLayout, checkBox: CheckBox) {
        card.setOnClickListener {
            val isCurrentlyChecked = checkBox.isChecked
            if (!isCurrentlyChecked) {
                // Check if already 3 selected
                val count = getSelectedCount()
                if (count >= 3) {
                    Toast.makeText(this, "You can select at most 3 metrics.", Toast.LENGTH_SHORT).show()
                    return@setOnClickListener
                }
                checkBox.isChecked = true
            } else {
                checkBox.isChecked = false
            }
            updateCounterAndButton()
        }
    }

    private fun getSelectedCount(): Int {
        var count = 0
        if (checkStreak.isChecked) count++
        if (checkTasks.isChecked) count++
        if (checkStudy.isChecked) count++
        if (checkSchedule.isChecked) count++
        if (checkSpending.isChecked) count++
        return count
    }

    private fun getSelectedStatIds(): List<String> {
        val list = mutableListOf<String>()
        if (checkStreak.isChecked) list.add("streak")
        if (checkTasks.isChecked) list.add("tasks")
        if (checkStudy.isChecked) list.add("study")
        if (checkSchedule.isChecked) list.add("schedule")
        if (checkSpending.isChecked) list.add("spending")
        return list
    }

    private fun updateCounterAndButton() {
        val count = getSelectedCount()
        when (count) {
            in 2..3 -> {
                tvCounter.text = "Selected: $count / 3 (Ready)"
                tvCounter.setTextColor(0xFFA78BFA.toInt())
                btnSave.alpha = 1.0f
            }
            1 -> {
                tvCounter.text = "Selected: 1 / 3 (Select at least 2 metrics)"
                tvCounter.setTextColor(0xFFF87171.toInt())
                btnSave.alpha = 0.6f
            }
            else -> {
                tvCounter.text = "Selected: 0 / 3 (Select 2 or 3 metrics)"
                tvCounter.setTextColor(0xFF94A3B8.toInt())
                btnSave.alpha = 0.6f
            }
        }
    }

    private fun saveConfigAndFinish() {
        val selected = getSelectedStatIds()
        if (selected.size !in 2..3) {
            Toast.makeText(this, "Please select 2 or 3 metrics to display.", Toast.LENGTH_SHORT).show()
            return
        }

        // 1. Save per-widget configuration keyed by appWidgetId
        val prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        prefs.edit()
            .putString("widget_config_$appWidgetId", selected.joinToString(","))
            .apply()

        Log.d(TAG, "Saved config for widget $appWidgetId: $selected")

        // 2. Immediately trigger widget update for this instance
        val appWidgetManager = AppWidgetManager.getInstance(this)
        LifeOSWidgetProvider.updateAppWidget(this, appWidgetManager, appWidgetId)

        // 3. Critical: Set RESULT_OK with appWidgetId extra
        val resultValue = Intent().apply {
            putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId)
        }
        setResult(Activity.RESULT_OK, resultValue)
        finish()
    }

    companion object {
        private const val TAG = "WidgetConfigActivity"
        private const val PREFS_NAME = "CapacitorStorage"
    }
}
