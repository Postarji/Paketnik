package dev.postarji.ucbenikiui

import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Window
import androidx.compose.ui.window.application
import androidx.compose.ui.window.rememberWindowState

fun main() = application {
    val books = DataLoader.loadBooks()
    val windowState = rememberWindowState(width = 1920.dp, height = 1080.dp)

    Window(
        onCloseRequest = ::exitApplication,
        state = windowState,
        title = "ucbenikiui",
    ) {
        App(initialBooks = books)
    }
}