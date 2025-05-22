package com.example.postarjiapp

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
import java.io.FileOutputStream
import java.io.IOException
import java.util.concurrent.TimeUnit

class MainActivity : AppCompatActivity() {
    private var boxId: String? = null
    private val tokenFormat = 4
    private var mediaPlayer: MediaPlayer? = null
    private val TAG = "MainActivity"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        val scanButton: Button = findViewById(R.id.scanButton)
        val openBoxButton: Button = findViewById(R.id.openBoxButton)
        val statusText: TextView = findViewById(R.id.statusText)

        boxId = "540"
        statusText.text = "Ready with Box ID: $boxId"
        openBoxButton.isEnabled = true

        scanButton.setOnClickListener {
            startScan()
        }

        openBoxButton.setOnClickListener {
            boxId?.let { id ->
                statusText.text = "Opening box $id..."
                openBox(id, tokenFormat)
            }
        }
    }

    private fun startScan() {
        IntentIntegrator(this).apply {
            setDesiredBarcodeFormats(IntentIntegrator.QR_CODE)
            setPrompt("Scan Box QR Code")
            setCameraId(0)
            setBeepEnabled(true)
            initiateScan()
        }
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        val result = IntentIntegrator.parseActivityResult(requestCode, resultCode, data)
        if (result != null && result.contents != null) {
            try {
                //extract box ID from QR code content
                val qrContent = result.contents
                Log.d(TAG, "Scanned QR content: $qrContent")

                boxId = "540"

                // Save the full QR content for reference
                val qrInfo = qrContent

                findViewById<TextView>(R.id.statusText).text = "Box ID: $boxId (from QR)"
                findViewById<Button>(R.id.openBoxButton).isEnabled = true
                Toast.makeText(this, "Ready to open box ID: $boxId", Toast.LENGTH_SHORT).show()
            } catch (e: Exception) {
                Log.e(TAG, "Error parsing QR: ${e.message}")
                Toast.makeText(this, "Failed to parse QR: ${e.message}", Toast.LENGTH_LONG).show()
            }
        } else {
            super.onActivityResult(requestCode, resultCode, data)
        }
    }

    private fun openBox(boxId: String, tokenFormat: Int) {
        val logging = HttpLoggingInterceptor().apply {
            setLevel(HttpLoggingInterceptor.Level.BODY)
        }

        val client = OkHttpClient.Builder()
            .addInterceptor(logging)
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)
            .build()

        val json = """
            {
                "deliveryId": 0,
                "boxId": 540,
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
            try {
                updateStatus("Connecting to server...")
                val response = client.newCall(request).execute()
                val statusCode = response.code
                val responseBody = response.body?.string()

                Log.d(TAG, "Status Code: $statusCode")
                Log.d(TAG, "Response Body: ${responseBody?.take(100)}...")

                if (!response.isSuccessful) {
                    val errorBody = responseBody ?: "No response body"
                    Log.e(TAG, "Error Response: $errorBody")
                    withContext(Dispatchers.Main) {
                        updateStatus("Server Error: $statusCode")
                        Toast.makeText(this@MainActivity, "Server Error: $statusCode - $errorBody", Toast.LENGTH_LONG).show()
                    }
                    return@launch
                }

                if (responseBody.isNullOrEmpty()) {
                    withContext(Dispatchers.Main) {
                        updateStatus("Empty response")
                        Toast.makeText(this@MainActivity, "Empty response from server", Toast.LENGTH_LONG).show()
                    }
                    return@launch
                }

                val jsonObj = JSONObject(responseBody)
                if (!jsonObj.has("data")) {
                    withContext(Dispatchers.Main) {
                        updateStatus("Invalid response format")
                        Toast.makeText(this@MainActivity, "No data field in response", Toast.LENGTH_LONG).show()
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
                    }
                    return@launch
                }

                val base64Data = jsonObj.getString("data")
                Log.d(TAG, "Base64 Data length: ${base64Data.length}")

                updateStatus("Processing token...")
                val tokenFile = processToken(base64Data)

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
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error: ${e.message}", e)
                withContext(Dispatchers.Main) {
                    updateStatus("Error: ${e.javaClass.simpleName}")
                    Toast.makeText(this@MainActivity, "Error: ${e.message}", Toast.LENGTH_LONG).show()
                }
            }
        }
    }

    private fun updateStatus(status: String) {
        runOnUiThread {
            findViewById<TextView>(R.id.statusText).text = status
        }
    }

    private fun processToken(base64Data: String): File {
        var paddedBase64Data = base64Data
        // Add padding if necessary
        while (paddedBase64Data.length % 4 != 0) {
            paddedBase64Data += "="
        }

        val decodedBytes = try {
            Base64.decode(base64Data, Base64.DEFAULT)
        } catch (e: IllegalArgumentException) {
            Log.e(TAG, "Base64 decode error: ${e.message}")
            throw IOException("Invalid base64 data: ${e.message}")
        }

        Log.d(TAG, "Decoded bytes length: ${decodedBytes.size}")

        // Write to temporary file in cache directory with .wav extension
        val tempFile = File.createTempFile("token", ".wav", cacheDir)
        try {
            FileOutputStream(tempFile).use { fos ->
                fos.write(decodedBytes)
                fos.flush()
            }
        } catch (e: IOException) {
            Log.e(TAG, "File write error: ${e.message}")
            tempFile.delete()
            throw IOException("Failed to write WAV file: ${e.message}")
        }

        // Validate file size
        if (tempFile.length() != decodedBytes.size.toLong()) {
            Log.e(TAG, "File size mismatch: expected ${decodedBytes.size}, got ${tempFile.length()}")
            tempFile.delete()
            throw IOException("File size mismatch during write")
        }

        Log.d(TAG, "Saved token to: ${tempFile.absolutePath}")
        return tempFile
    }

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
                // Set maximum volume
                setVolume(1.0f, 1.0f)

                prepare()
                start()
                Log.d(TAG, "Playing WAV file: ${file.absolutePath}")
            }

            // Handle completion
            mediaPlayer?.setOnCompletionListener {
                Log.d(TAG, "Audio playback completed")
                runOnUiThread {
                    updateStatus("Box opened successfully!")
                    Toast.makeText(this@MainActivity, "Audio playback completed", Toast.LENGTH_SHORT).show()
                }
                it.release()
                mediaPlayer = null
                file.delete()
            }

            // Handle errors
            mediaPlayer?.setOnErrorListener { mp, what, extra ->
                Log.e(TAG, "MediaPlayer error: what=$what, extra=$extra")
                runOnUiThread {
                    updateStatus("Playback error: $what")
                    Toast.makeText(this@MainActivity, "MediaPlayer error: $what", Toast.LENGTH_LONG).show()
                }
                mp.release()
                mediaPlayer = null
                file.delete()
                true
            }

        } catch (e: IOException) {
            Log.e(TAG, "Playback error: ${e.message}", e)
            runOnUiThread {
                updateStatus("Playback error")
                Toast.makeText(this@MainActivity, "Playback error: ${e.message}", Toast.LENGTH_LONG).show()
            }
            file.delete()
            mediaPlayer?.release()
            mediaPlayer = null
        }
    }

    // Alternative audio playback method using AudioTrack for direct control
    private fun playWavWithAudioTrack(file: File) {
        try {
            val fileBytes = file.readBytes()

            // Skip WAV header (typically 44 bytes)
            val headerSize = 44
            val audioData = fileBytes.copyOfRange(headerSize, fileBytes.size)

            // Configure AudioTrack
            val sampleRate = 44100 // Standard sample rate
            val channelConfig = AudioFormat.CHANNEL_OUT_MONO
            val audioFormat = AudioFormat.ENCODING_PCM_16BIT

            val bufferSize = AudioTrack.getMinBufferSize(sampleRate, channelConfig, audioFormat)

            val audioTrack = AudioTrack.Builder()
                .setAudioAttributes(AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_MEDIA)
                    .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                    .build())
                .setAudioFormat(AudioFormat.Builder()
                    .setEncoding(audioFormat)
                    .setSampleRate(sampleRate)
                    .setChannelMask(channelConfig)
                    .build())
                .setBufferSizeInBytes(bufferSize)
                .build()

            audioTrack.play()
            audioTrack.write(audioData, 0, audioData.size)

            audioTrack.stop()
            audioTrack.release()
            file.delete()

        } catch (e: Exception) {
            Log.e(TAG, "AudioTrack error: ${e.message}", e)
            runOnUiThread {
                updateStatus("AudioTrack error")
                Toast.makeText(this, "AudioTrack error: ${e.message}", Toast.LENGTH_LONG).show()
            }
            file.delete()
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        mediaPlayer?.release()
        mediaPlayer = null
    }
}