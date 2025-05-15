package com.example.postarjiapp

import android.content.Intent
import android.media.AudioAttributes
import android.media.MediaPlayer
import android.os.Bundle
import android.util.Base64
import android.widget.Button
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
import okhttp3.RequestBody
import okhttp3.logging.HttpLoggingInterceptor
import org.json.JSONException
import org.json.JSONObject
import java.io.File
import java.io.FileOutputStream

class MainActivity : AppCompatActivity() {
    private var boxId: String? = null
    private val tokenFormat = 5

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        val scanButton: Button = findViewById(R.id.scanButton)
        val openBoxButton: Button = findViewById(R.id.openBoxButton)

        scanButton.setOnClickListener {
            startActivityForResult(IntentIntegrator(this).apply {
                setDesiredBarcodeFormats(IntentIntegrator.QR_CODE)
                setPrompt("Scan Box QR Code")
                setCameraId(0)
                setBeepEnabled(true)
            }.createScanIntent(), IntentIntegrator.REQUEST_CODE)
        }

        openBoxButton.setOnClickListener {
            boxId?.let { id -> openBox(id, tokenFormat) }
        }
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        val result = IntentIntegrator.parseActivityResult(requestCode, resultCode, data)
        if (result != null && result.contents != null) {
            boxId = result.contents
            findViewById<Button>(R.id.openBoxButton).isEnabled = true
            Toast.makeText(this, "Box ID: $boxId", Toast.LENGTH_SHORT).show()
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
            .build()

        // Process boxId
        val path = boxId.substringAfter("HTTPS://B.DIRECT4.ME/")
        val pathWithoutTrailingSlash = path.removeSuffix("/")
        val parts = pathWithoutTrailingSlash.split("/")
        val boxIdWithLeadingZeros = parts[1]
        val splitBoxId = boxIdWithLeadingZeros.trimStart('0')
        val qrCodeInfo = pathWithoutTrailingSlash

        val json = """
            {
                "deliveryId": 0,
                "boxId": $splitBoxId,
                "tokenFormat": $tokenFormat,
                "latitude": null,
                "longitude": null,
                "qrCodeInfo": "$qrCodeInfo",
                "terminalSeed": null,
                "isMultibox": false,
                "doorIndex": null,
                "addAccessLog": false
            }
        """.trimIndent()

        val request = Request.Builder()
            .url("https://api-d4me-stage.direct4.me/sandbox/v1/Access/openbox")
            .post(RequestBody.create("application/json".toMediaType(), json))
            .addHeader("Authorization", "Bearer 9ea96945-3a37-4638-a5d4-22e89fbc998f")
            .addHeader("Content-Type", "application/json")
            .addHeader("User-Agent", "YourApp/1.0")
            .build()

        CoroutineScope(Dispatchers.IO).launch {
            try {
                val response = client.newCall(request).execute()
                val statusCode = response.code
                val responseBody = response.body?.string()

                println("Status Code: $statusCode")
                println("Response Body: $responseBody")

                if (!response.isSuccessful) {
                    val errorBody = responseBody ?: "No response body"
                    println("Error Response: $errorBody")
                    withContext(Dispatchers.Main) {
                        Toast.makeText(this@MainActivity, "Server Error: $statusCode - $errorBody", Toast.LENGTH_LONG).show()
                    }
                    return@launch
                }

                if (responseBody.isNullOrEmpty()) {
                    withContext(Dispatchers.Main) {
                        Toast.makeText(this@MainActivity, "Empty response from server", Toast.LENGTH_LONG).show()
                    }
                    return@launch
                }

                val jsonObj = JSONObject(responseBody)
                if (!jsonObj.has("data")) {
                    withContext(Dispatchers.Main) {
                        Toast.makeText(this@MainActivity, "No data field in response", Toast.LENGTH_LONG).show()
                    }
                    return@launch
                }

                val result = jsonObj.getInt("result")
                val errorNumber = jsonObj.getInt("errorNumber")
                println("Result: $result, ErrorNumber: $errorNumber")
                if (result != 0 || errorNumber != 0) {
                    withContext(Dispatchers.Main) {
                        Toast.makeText(this@MainActivity, "Invalid token: result=$result, error=$errorNumber", Toast.LENGTH_LONG).show()
                    }
                    return@launch
                }

                val base64Data = jsonObj.getString("data")
                println("Base64 Data: ${base64Data.take(20)}...")

                val tokenFile = processToken(base64Data)

                withContext(Dispatchers.Main) {
                    playWav(tokenFile)
                    Toast.makeText(this@MainActivity, "Playing token audio", Toast.LENGTH_SHORT).show()
                }

            } catch (e: JSONException) {
                e.printStackTrace()
                withContext(Dispatchers.Main) {
                    Toast.makeText(this@MainActivity, "Invalid JSON: ${e.message}", Toast.LENGTH_LONG).show()
                }
            } catch (e: Exception) {
                e.printStackTrace()
                withContext(Dispatchers.Main) {
                    Toast.makeText(this@MainActivity, "Error: ${e.message}", Toast.LENGTH_LONG).show()
                }
            }
        }
    }

    private fun processToken(base64Data: String): File {
        val decodedBytes = Base64.decode(base64Data, Base64.DEFAULT)
        println("Decoded bytes length: ${decodedBytes.size}")
        println("First 10 bytes: ${decodedBytes.take(10).joinToString(",")}")

        val tempFile = File(cacheDir, "token.wav")
        FileOutputStream(tempFile).use { it.write(decodedBytes) }

        val externalFile = File(getExternalFilesDir(null), "token_output.wav")
        FileOutputStream(externalFile).use { it.write(decodedBytes) }
        println("Saved token to: ${externalFile.absolutePath}")

        return tempFile // Assume raw .wav
    }

    private fun playWav(file: File) {
        try {
            // Test Postman’s WAV if available
            val postmanFile = File(getExternalFilesDir(null), "postman_token.wav")
            val testFile = if (postmanFile.exists()) postmanFile else file
            println("Playing file: ${testFile.absolutePath}")

            val mediaPlayer = MediaPlayer()
            mediaPlayer.setDataSource(testFile.absolutePath)
            mediaPlayer.setVolume(1.0f, 1.0f)
            mediaPlayer.setAudioAttributes(
                AudioAttributes.Builder()
                    .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                    .setUsage(AudioAttributes.USAGE_MEDIA)
                    .build()
            )
            mediaPlayer.prepare()
            mediaPlayer.start()
            mediaPlayer.setOnCompletionListener {
                it.release()
                println("Audio playback completed")
                Toast.makeText(this@MainActivity, "Audio playback completed", Toast.LENGTH_SHORT).show()
            }
            mediaPlayer.setOnErrorListener { mp, what, extra ->
                println("MediaPlayer error: what=$what, extra=$extra")
                Toast.makeText(this@MainActivity, "MediaPlayer error: $what", Toast.LENGTH_LONG).show()
                true
            }
        } catch (e: Exception) {
            println("Playback error: ${e.message}")
            Toast.makeText(this@MainActivity, "Playback error: ${e.message}", Toast.LENGTH_LONG).show()
        }
    }
}