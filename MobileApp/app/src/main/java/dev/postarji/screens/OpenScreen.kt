package dev.postarji.screens

import android.widget.Toast
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.navigation.NavHostController
import dev.postarji.TokenPlayer
import dev.postarji.extractBoxIdFromDirect4
import dev.postarji.history.HistoryEntry
import dev.postarji.history.HistoryStore
import dev.postarji.openBoxFetchWav
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

@Composable
fun OpenScreen(
    navController: NavHostController,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    var scannedBoxId by remember { mutableStateOf<Int?>(null) }
    var scanning by remember { mutableStateOf(false) }

    var isOpening by remember { mutableStateOf(false) }
    var showResultDialog by remember { mutableStateOf(false) }

    val player = remember { TokenPlayer() }

    DisposableEffect(Unit) {
        onDispose { player.stop() }
    }

    if (scanning) {
        QrScannerScreen(
            onQrScanned = { qrText ->
                val id = extractBoxIdFromDirect4(qrText)
                if (id != null) {
                    scannedBoxId = id
                    scanning = false
                    Toast.makeText(context, "Scanned box ID: $id", Toast.LENGTH_SHORT).show()
                } else {
                    Toast.makeText(context, "Invalid QR code", Toast.LENGTH_LONG).show()
                }
            },
            onCancel = { scanning = false },
            modifier = modifier
        )
        return
    }

    Box(
        modifier = modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Text("Currently scanned box", style = MaterialTheme.typography.titleMedium)

            Text(
                text = scannedBoxId?.let { "ID: $it" } ?: "No box scanned",
                style = MaterialTheme.typography.headlineMedium
            )

            Spacer(Modifier.height(24.dp))

            Button(
                onClick = { scanning = true },
                enabled = !isOpening,
                modifier = Modifier.fillMaxWidth(0.7f)
            ) {
                Text("Scan QR Code")
            }

            Button(
                onClick = {
                    val boxId = scannedBoxId ?: return@Button
                    isOpening = true

                    scope.launch(Dispatchers.IO) {
                        val result = openBoxFetchWav(
                            context = context,
                            boxId = boxId,
                            tokenFormat = 4
                        )

                        withContext(Dispatchers.Main) {
                            result.fold(
                                onSuccess = { wavFile ->
                                    player.play(
                                        context = context,
                                        wavFile = wavFile,
                                        onComplete = {
                                            isOpening = false
                                            showResultDialog = true
                                        },
                                        onError = { msg ->
                                            isOpening = false
                                            Toast.makeText(context, "Playback error: $msg", Toast.LENGTH_LONG).show()
                                        }
                                    )
                                },
                                onFailure = { e ->
                                    isOpening = false
                                    Toast.makeText(context, "API error: ${e.message}", Toast.LENGTH_LONG).show()
                                }
                            )
                        }
                    }
                },
                enabled = scannedBoxId != null && !isOpening,
                modifier = Modifier.fillMaxWidth(0.7f)
            ) {
                Text(if (isOpening) "Opening..." else "Open Box")
            }
        }
    }

    if (showResultDialog) {
        AlertDialog(
            onDismissRequest = { },
            title = { Text("Box Opening Result") },
            text = { Text("Did the box open?") },
            confirmButton = {
                TextButton(onClick = {
                    showResultDialog = false
                    scannedBoxId?.let { id ->
                        HistoryStore.addEntry(
                            context,
                            HistoryEntry(
                                boxId = id,
                                timestampMillis = System.currentTimeMillis(),
                                success = true,
                                locationText = "Location unavailable"
                            )
                        )
                    }
                    Toast.makeText(context, "Recorded: YES", Toast.LENGTH_SHORT).show()
                }) { Text("Yes") }
            },
            dismissButton = {
                TextButton(onClick = {
                    showResultDialog = false
                    scannedBoxId?.let { id ->
                        HistoryStore.addEntry(
                            context,
                            HistoryEntry(
                                boxId = id,
                                timestampMillis = System.currentTimeMillis(),
                                success = false,
                                locationText = "Location unavailable"
                            )
                        )
                    }
                    Toast.makeText(context, "Recorded: NO", Toast.LENGTH_SHORT).show()
                }) { Text("No") }
            }

        )
    }
}
