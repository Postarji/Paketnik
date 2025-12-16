package dev.postarji

import android.content.Context
import android.media.AudioAttributes
import android.media.AudioManager
import android.media.MediaPlayer
import java.io.File

class TokenPlayer {
    private var mediaPlayer: MediaPlayer? = null

    fun play(
        context: Context,
        wavFile: File,
        onComplete: () -> Unit,
        onError: (String) -> Unit
    ) {
        stop()

        try {
            mediaPlayer = MediaPlayer().apply {
                setDataSource(wavFile.absolutePath)
                setAudioAttributes(
                    AudioAttributes.Builder()
                        .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                        .setUsage(AudioAttributes.USAGE_MEDIA)
                        .setLegacyStreamType(AudioManager.STREAM_MUSIC)
                        .build()
                )
                prepare()
                start()

                setOnCompletionListener {
                    stop()
                    onComplete()
                    wavFile.delete()
                }

                setOnErrorListener { mp, what, extra ->
                    stop()
                    wavFile.delete()
                    onError("MediaPlayer error: what=$what extra=$extra")
                    true
                }
            }
        } catch (e: Exception) {
            stop()
            wavFile.delete()
            onError(e.message ?: e.javaClass.simpleName)
        }
    }

    fun stop() {
        mediaPlayer?.release()
        mediaPlayer = null
    }
}
