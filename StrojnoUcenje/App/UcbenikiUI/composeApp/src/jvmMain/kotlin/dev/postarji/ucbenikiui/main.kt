package dev.postarji.ucbenikiui

import androidx.compose.ui.window.Window
import androidx.compose.ui.window.application

fun main() = application {
    val books = DataLoader.loadBooks()

    Window(
        onCloseRequest = ::exitApplication,
        title = "ucbenikiui",
    ) {
        App()
    }
}