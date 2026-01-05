package android.content

import java.io.File
import java.io.FileInputStream
import java.io.FileNotFoundException
import java.io.InputStream

open class Context {
    val assets = Open()
}

class Open {
    fun open(fileName: String): InputStream {
        val file = File("app/src/main/assets", fileName)

        if (!file.exists()) {
            throw FileNotFoundException("Asset not found at: ${file.absolutePath}")
        }

        return FileInputStream(file)
    }
}