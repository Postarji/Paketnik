package com.example.postarjiapp

import android.annotation.SuppressLint
import android.content.Intent
import android.media.AudioAttributes
import android.media.AudioFormat
import android.media.AudioManager
import android.media.AudioTrack
import android.media.MediaPlayer
import android.os.Bundle
import android.util.Base64
import android.util.Log
import android.widget.Button
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import com.google.zxing.integration.android.IntentIntegrator
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.logging.HttpLoggingInterceptor
import org.json.JSONException
import org.json.JSONObject
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream
import java.io.IOException
import java.util.concurrent.TimeUnit
import java.util.zip.ZipInputStream

class MainActivity : AppCompatActivity() {
    private var boxId: String? = "540"
    private var mediaPlayer: MediaPlayer? = null
    private var currentBoxId: String? = null // Track current box ID for history

    private val TAG = "MainActivity"
    private val tokenFormat = 4
    private val apiUrl = "https://api-d4me-stage.direct4.me/sandbox/v1/Access/openbox"
    private val bearerToken = "Bearer 9ea96945-3a37-4638-a5d4-22e89fbc998f"

    @SuppressLint("SetTextI18n")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        val scanButton: Button = findViewById(R.id.scanButton)
        val openBoxButton: Button = findViewById(R.id.openBoxButton)
        val statusText: TextView = findViewById(R.id.statusText)
        val btnGoToLogin: TextView = findViewById(R.id.btnGoToLogin)
        val btnHistory: Button = findViewById(R.id.btnHistory)

        // Go to login screen
        btnGoToLogin.setOnClickListener {
            val intent = Intent(this, LoginActivity::class.java)
            startActivity(intent)
        }

        // Go to history screen
        btnHistory.setOnClickListener {
            val intent = Intent(this, HistoryActivity::class.java)
            startActivity(intent)
        }

        // Initial setup
        statusText.text = "Ready with Box ID: $boxId"
        openBoxButton.isEnabled = true

        scanButton.setOnClickListener { startScan() }

        openBoxButton.setOnClickListener {
            boxId?.let {
                currentBoxId = it // Store current box ID for history
                statusText.text = "Opening box $it..."
                openBox(it, tokenFormat)
            }
        }
    }

    //QR Code scanner launched
    private fun startScan() {
        IntentIntegrator(this).apply {
            setDesiredBarcodeFormats(IntentIntegrator.QR_CODE)
            setPrompt("Scan Box QR Code")
            setCameraId(0)
            setBeepEnabled(true)
            initiateScan()
        }
    }
    //Handling QR Code scan results
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        val result = IntentIntegrator.parseActivityResult(requestCode, resultCode, data)
        if (result != null && result.contents != null) {
            Log.d(TAG, "Scanned QR content: ${result.contents}")

            boxId = "540"
            updateStatus("Box ID: $boxId (from QR)")
            findViewById<Button>(R.id.openBoxButton).isEnabled = true
            Toast.makeText(this, "Ready to open box ID: $boxId", Toast.LENGTH_SHORT).show()
        } else {
            super.onActivityResult(requestCode, resultCode, data)
        }
    }
    //sending API request for opening the box
    private fun openBox(boxId: String, tokenFormat: Int) {
        val client = OkHttpClient.Builder()
            .addInterceptor(HttpLoggingInterceptor().apply {
                level = HttpLoggingInterceptor.Level.BODY
            })
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)
            .build()

        val json = """
            {
                "deliveryId": 0,
                "boxId": $boxId,
                "tokenFormat": $tokenFormat,
                "latitude": null,
                "longitude": null,
                "qrCodeInfo": null,
                "terminalSeed": null,
                "isMultibox": false,
                "doorIndex": null,
                "addAccessLog": false
            }
        """.trimIndent()

        Log.d(TAG, "Request JSON: $json")

        val request = Request.Builder()
            .url("https://api-d4me-stage.direct4.me/sandbox/v1/Access/openbox")
            .post(json.toRequestBody("application/json".toMediaType()))
            .addHeader("Authorization", "Bearer 9ea96945-3a37-4638-a5d4-22e89fbc998f")
            .addHeader("Content-Type", "application/json")
            .addHeader("User-Agent", "Direct4MeApp/1.0")
            .build()

        CoroutineScope(Dispatchers.IO).launch {
            updateStatus("Connecting to server...")
            try {
                val response = client.newCall(request).execute()
                val statusCode = response.code
                val responseBody = response.body?.string()

                if (!response.isSuccessful) {
                    val errorBody = responseBody ?: "No response body"
                    Log.e(TAG, "Error Response: $errorBody")
                    withContext(Dispatchers.Main) {
                        updateStatus("Server Error: $statusCode")
                        Toast.makeText(this@MainActivity, "Server Error: $statusCode - $errorBody", Toast.LENGTH_LONG).show()
                        currentBoxId?.let {
                            HistoryManager.addHistoryEntry(this@MainActivity, it, false, "API_ERROR")
                        }
                    }
                    return@launch
                }

                if (responseBody.isNullOrEmpty()) {
                    withContext(Dispatchers.Main) {
                        updateStatus("Empty response")
                        Toast.makeText(this@MainActivity, "Empty response from server", Toast.LENGTH_LONG).show()
                        currentBoxId?.let {
                            HistoryManager.addHistoryEntry(this@MainActivity, it, false, "EMPTY_RESPONSE")
                        }
                    }
                    return@launch
                }

                val jsonObj = JSONObject(responseBody)
                if (!jsonObj.has("data")) {
                    withContext(Dispatchers.Main) {
                        updateStatus("Invalid response format")
                        Toast.makeText(this@MainActivity, "No data field in response", Toast.LENGTH_LONG).show()
                        currentBoxId?.let {
                            HistoryManager.addHistoryEntry(this@MainActivity, it, false, "INVALID_RESPONSE")
                        }
                    }
                    return@launch
                }

                val result = jsonObj.getInt("result")
                val errorNumber = jsonObj.getInt("errorNumber")
                Log.d(TAG, "Result: $result, ErrorNumber: $errorNumber")

                if (result != 0 || errorNumber != 0) {
                    withContext(Dispatchers.Main) {
                        updateStatus("Error: result=$result, error=$errorNumber")
                        Toast.makeText(this@MainActivity, "Invalid token: result=$result, error=$errorNumber", Toast.LENGTH_LONG).show()
                        currentBoxId?.let {
                            HistoryManager.addHistoryEntry(this@MainActivity, it, false, "INVALID_TOKEN")
                        }
                    }
                    return@launch
                }

                val base64Data = jsonObj.getString("data")
                Log.d(TAG, "Base64 Data length: ${base64Data.length}")

                updateStatus("Processing token...")
                val tokenFile = processZipToken(base64Data)

                withContext(Dispatchers.Main) {
                    updateStatus("Playing token...")
                    playWav(tokenFile)
                    Toast.makeText(this@MainActivity, "Playing token audio", Toast.LENGTH_SHORT).show()
                }

            } catch (e: JSONException) {
                Log.e(TAG, "JSON error: ${e.message}", e)
                withContext(Dispatchers.Main) {
                    updateStatus("Invalid JSON response")
                    Toast.makeText(this@MainActivity, "Invalid JSON: ${e.message}", Toast.LENGTH_LONG).show()
                    currentBoxId?.let {
                        HistoryManager.addHistoryEntry(this@MainActivity, it, false, "JSON_ERROR")
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error: ${e.message}", e)
                withContext(Dispatchers.Main) {
                    updateStatus("Error: ${e.javaClass.simpleName}")
                    Toast.makeText(this@MainActivity, "Error: ${e.message}", Toast.LENGTH_LONG).show()
                    currentBoxId?.let {
                        HistoryManager.addHistoryEntry(this@MainActivity, it, false, "NETWORK_ERROR")
                    }
                }
            }
        }
    }
    //Decoding and unzipping the token into the WAV file
    private fun processZipToken(base64Data: String): File {
        val decodedBytes = Base64.decode(base64Data, Base64.DEFAULT)

        val zipFile = File.createTempFile("token", ".zip", cacheDir)
        FileOutputStream(zipFile).use { it.write(decodedBytes) }

        return extractWavFromZip(zipFile).also { zipFile.delete() }
    }

    //Extracting the WAV from a zip archive
    private fun extractWavFromZip(zipFile: File): File {
        ZipInputStream(FileInputStream(zipFile)).use { zipInput ->
            var entry = zipInput.nextEntry
            while (entry != null) {
                // Looking for WAV file in the ZIP
                if (!entry.isDirectory && entry.name.lowercase().endsWith(".wav")) {
                    // Creating output WAV file
                    val wavFile = File.createTempFile("extracted_token", ".wav", cacheDir)
                    FileOutputStream(wavFile).use { output ->
                        zipInput.copyTo(output)
                    }
                    return wavFile
                }
                zipInput.closeEntry()
                entry = zipInput.nextEntry
            }
        }
        throw IOException("No WAV file found in ZIP")
    }

    //Play WAV using a MediaPlayer
    private fun playWav(file: File) {
        try {
            // Release any existing MediaPlayer
            mediaPlayer?.release()
            mediaPlayer = null

            // Create new MediaPlayer
            mediaPlayer = MediaPlayer().apply {
                setDataSource(file.absolutePath)
                setAudioAttributes(
                    AudioAttributes.Builder()
                        .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                        .setUsage(AudioAttributes.USAGE_MEDIA)
                        .setLegacyStreamType(AudioManager.STREAM_MUSIC)
                        .build()
                )
                setVolume(1.0f, 1.0f)

                prepare()
                start()
            }

            // Handle completion
            mediaPlayer?.setOnCompletionListener {
                Log.d(TAG, "Playback finished")
                updateStatus("Token playback completed")

                showBoxOpeningResultDialog()

                it.release()
                mediaPlayer = null
                file.delete()
            }

            mediaPlayer?.setOnErrorListener { mp, what, extra ->
                Log.e(TAG, "MediaPlayer error: what=$what, extra=$extra")
                updateStatus("Playback error: $what")
                mp.release()
                mediaPlayer = null
                file.delete()

                currentBoxId?.let {
                    HistoryManager.addHistoryEntry(this@MainActivity, it, false, "PLAYBACK_ERROR")
                }
                true
            }

        } catch (e: IOException) {
            Log.e(TAG, "Playback error: ${e.message}", e)
            runOnUiThread {
                updateStatus("Playback error")
                Toast.makeText(this@MainActivity, "Playback error: ${e.message}", Toast.LENGTH_LONG).show()
                currentBoxId?.let {
                    HistoryManager.addHistoryEntry(this@MainActivity, it, false, "PLAYBACK_ERROR")
                }
            }
            file.delete()
            mediaPlayer?.release()
            mediaPlayer = null
        }
    }

    private fun showBoxOpeningResultDialog() {
        runOnUiThread {
            AlertDialog.Builder(this)
                .setTitle("Box Opening Result")
                .setMessage("Did you successfully open the box?")
                .setPositiveButton("Yes, it opened!") { _, _ ->
                    currentBoxId?.let {
                        HistoryManager.addHistoryEntry(this@MainActivity, it, true, "QR_SCAN")
                    }
                    updateStatus("Box opened successfully!")
                    Toast.makeText(this@MainActivity, "Success recorded in history", Toast.LENGTH_SHORT).show()
                }
                .setNegativeButton("No, it didn't open") { _, _ ->
                    currentBoxId?.let {
                        HistoryManager.addHistoryEntry(this@MainActivity, it, false, "USER_REPORTED_FAILURE")
                    }
                    updateStatus("Box opening failed")
                    Toast.makeText(this@MainActivity, "Failure recorded in history", Toast.LENGTH_SHORT).show()
                }
                .setCancelable(false)
                .show()
        }
    }

    private fun updateStatus(status: String) {
        runOnUiThread {
            findViewById<TextView>(R.id.statusText).text = status
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        mediaPlayer?.release()
        mediaPlayer = null
    }
}