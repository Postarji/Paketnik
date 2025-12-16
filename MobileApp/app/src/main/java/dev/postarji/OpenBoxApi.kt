package dev.postarji

import android.content.Context
import android.util.Base64
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.logging.HttpLoggingInterceptor
import org.json.JSONObject
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream
import java.io.IOException
import java.util.concurrent.TimeUnit
import java.util.zip.ZipInputStream

data class OpenBoxResult(
    val wavFile: File,
    val rawQrText: String? = null
)

private const val API_URL = "https://api-d4me-stage.direct4.me/sandbox/v1/Access/openbox"
private const val BEARER_TOKEN = "Bearer 9ea96945-3a37-4638-a5d4-22e89fbc998f"

private fun buildClient(): OkHttpClient {
    val logging = HttpLoggingInterceptor().apply { level = HttpLoggingInterceptor.Level.BODY }
    return OkHttpClient.Builder()
        .addInterceptor(logging)
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .writeTimeout(30, TimeUnit.SECONDS)
        .build()
}

suspend fun openBoxFetchWav(
    context: Context,
    boxId: Int,
    tokenFormat: Int = 4
): Result<File> {
    return runCatching {
        val client = buildClient()

        val json = """
            {
              "boxId": $boxId,
              "tokenFormat": $tokenFormat
            }
        """.trimIndent()

        val request = Request.Builder()
            .url(API_URL)
            .post(json.toRequestBody("application/json".toMediaType()))
            .addHeader("Authorization", BEARER_TOKEN)
            .addHeader("Content-Type", "application/json")
            .addHeader("User-Agent", "Direct4MeApp/1.0")
            .build()

        val response = client.newCall(request).execute()
        val body = response.body?.string()

        if (!response.isSuccessful) {
            throw IOException("HTTP ${response.code}: ${body ?: "No body"}")
        }
        if (body.isNullOrBlank()) throw IOException("Empty response body")

        val jsonObj = JSONObject(body)

        val result = jsonObj.optInt("result", 0)
        val errorNumber = jsonObj.optInt("errorNumber", 0)
        if (result != 0 || errorNumber != 0) {
            throw IOException("API error: result=$result errorNumber=$errorNumber")
        }

        val base64Data = jsonObj.getString("data")
        val zipFile = decodeBase64ZipToTemp(context, base64Data)
        try {
            extractWavFromZipToTemp(context, zipFile)
        } finally {
            zipFile.delete()
        }
    }
}

private fun decodeBase64ZipToTemp(context: Context, base64Data: String): File {
    val decodedBytes = Base64.decode(base64Data, Base64.DEFAULT)
    val zipFile = File.createTempFile("token_", ".zip", context.cacheDir)
    FileOutputStream(zipFile).use { it.write(decodedBytes) }
    return zipFile
}

private fun extractWavFromZipToTemp(context: Context, zipFile: File): File {
    ZipInputStream(FileInputStream(zipFile)).use { zipInput ->
        var entry = zipInput.nextEntry
        while (entry != null) {
            if (!entry.isDirectory && entry.name.lowercase().endsWith(".wav")) {
                val wavFile = File.createTempFile("token_", ".wav", context.cacheDir)
                FileOutputStream(wavFile).use { out ->
                    zipInput.copyTo(out)
                }
                return wavFile
            }
            zipInput.closeEntry()
            entry = zipInput.nextEntry
        }
    }
    throw IOException("No WAV file found in ZIP")
}
