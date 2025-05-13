package com.example.postarjiapp

import android.content.Intent
import android.media.MediaPlayer
import android.os.Bundle
import android.util.Base64
import android.widget.Button
import android.widget.Toast
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import com.google.zxing.integration.android.IntentIntegrator
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.RequestBody
import org.json.JSONObject
import java.io.File
import java.io.FileInputStream
import java.io.FileNotFoundException
import java.io.FileOutputStream
import java.util.zip.ZipEntry
import java.util.zip.ZipInputStream
import okhttp3.Request
import okhttp3.logging.HttpLoggingInterceptor
import org.json.JSONException

class MainActivity : AppCompatActivity() {
    private var boxId: String? = null
    private val tokenFormat = 1 // for example, use 1

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

        val json = """
        {
            "boxId": "$boxId",
            "tokenFormat": $tokenFormat
        }
    """.trimIndent()

        val request = Request.Builder()
            .url("https://api-d4me-stage.direct4.me/sandbox/v1/Access/openbox")
            .post(RequestBody.create("application/json".toMediaType(), json))
            .addHeader("Authorization", "Bearer a96945-3a37-4638-a5d4-22e89fbc998f") // Use Postman’s token
            .addHeader("Content-Type", "application/json")
            .build()

        CoroutineScope(Dispatchers.IO).launch {
            try {
                val response = client.newCall(request).execute()
                val statusCode = response.code
                val responseBody = response.body?.string()

                println("Status Code: $statusCode")
                println("Response Body: $responseBody")

                if (!response.isSuccessful) {
                    withContext(Dispatchers.Main) {
                        Toast.makeText(this@MainActivity, "Server Error: $statusCode", Toast.LENGTH_LONG).show()
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

                val base64Data = jsonObj.getString("data")
                println("Base64 Data: $base64Data")

                val zipBytes = Base64.decode(base64Data, Base64.DEFAULT)
                val tempZip = File(cacheDir, "token.zip")
                tempZip.writeBytes(zipBytes)

                val tokenFile = unzipAndGetWavFile(tempZip)

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

    private fun unzipAndGetWavFile(zipFile: File): File {
        val destDir = File(cacheDir, "unzipped")
        destDir.mkdirs()

        ZipInputStream(FileInputStream(zipFile)).use { zis ->
            var entry: ZipEntry? = zis.nextEntry
            while (entry != null) {
                val newFile = File(destDir, entry.name)
                FileOutputStream(newFile).use { fos ->
                    zis.copyTo(fos)
                }
                if (entry.name.endsWith(".wav")) return newFile
                zis.closeEntry()
                entry = zis.nextEntry
            }
        }
        throw FileNotFoundException("No WAV file found in zip.")
    }

    private fun playWav(file: File) {
        val mediaPlayer = MediaPlayer()
        mediaPlayer.setDataSource(file.absolutePath)
        mediaPlayer.prepare()
        mediaPlayer.start()
    }
}