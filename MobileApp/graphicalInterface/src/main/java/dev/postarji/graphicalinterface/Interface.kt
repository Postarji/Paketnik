package dev.postarji.graphicalinterface

import android.content.Context
import androidx.compose.desktop.ui.tooling.preview.Preview
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.material.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.PointMode
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Window
import androidx.compose.ui.window.application
import androidx.compose.ui.window.rememberWindowState
import dev.postarji.tsp.GeneticAlgorithm
import dev.postarji.tsp.TSP
import dev.postarji.tsp.Tour
import kotlinx.coroutines.launch

val files = listOf("bays29.tsp", "eil101.tsp", "a280.tsp", "pr1002.tsp", "dca1389.tsp")

@Composable
@Preview
fun App() {
    val scope = rememberCoroutineScope()

    var selectedFile by remember { mutableStateOf(files.firstOrNull() ?: "") }
    var populationSize by remember { mutableStateOf("200") }
    var mutationRate by remember { mutableStateOf("0.5") }
    var crossoverRate by remember { mutableStateOf("0.9") }

    var expanded by remember { mutableStateOf(false) }
    var bestTour by remember { mutableStateOf<Tour?>(null) }
    var isRunning by remember { mutableStateOf(false) }

    val tsp = remember {
        TSP(Context())
    }

    MaterialTheme(colors = darkColors()) {
        Surface(color = MaterialTheme.colors.background) {
            Column(Modifier.fillMaxSize().padding(16.dp)) {
                Card(elevation = 4.dp, modifier = Modifier.fillMaxWidth()) {
                    Row(
                        modifier = Modifier.padding(16.dp).fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box {
                            OutlinedTextField(
                                value = selectedFile,
                                onValueChange = {},
                                readOnly = true,
                                label = { Text("File") },
                                trailingIcon = {
                                    Text(
                                        text = "▼", modifier = Modifier.clickable { expanded = true }.padding(8.dp)
                                    )
                                },
                                modifier = Modifier.width(160.dp)
                            )
                            DropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
                                files.forEach { file ->
                                    DropdownMenuItem(onClick = {
                                        selectedFile = file
                                        expanded = false
                                    }) { Text(file) }
                                }
                            }
                        }

                        OutlinedTextField(
                            value = populationSize,
                            onValueChange = { if (it.all { c -> c.isDigit() }) populationSize = it },
                            label = { Text("Population Size") },
                            modifier = Modifier.width(120.dp)
                        )
                        OutlinedTextField(
                            value = mutationRate,
                            onValueChange = { mutationRate = it },
                            label = { Text("Mutation Probability") },
                            modifier = Modifier.width(120.dp)
                        )
                        OutlinedTextField(
                            value = crossoverRate,
                            onValueChange = { crossoverRate = it },
                            label = { Text("Crossing Probability") },
                            modifier = Modifier.width(120.dp)
                        )

                        Spacer(Modifier.weight(1f))

                        Button(
                            onClick = {
                                if (isRunning) {
                                    return@Button
                                }

                                scope.launch {
                                    isRunning = true
                                    bestTour = null

                                    tsp.loadData(selectedFile)

                                    val ga = GeneticAlgorithm(
                                        tsp,
                                        populationSize = populationSize.toInt(),
                                        mutationRate = mutationRate.toDouble(),
                                        crossoverRate = crossoverRate.toDouble(),
                                    )

                                    ga.runVisual { newBest ->
                                        bestTour = Tour(newBest)
                                    }

                                    isRunning = false
                                }
                            }, enabled = !isRunning, modifier = Modifier.height(56.dp)
                        ) {
                            Text("RUN")
                        }
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                Card(
                    elevation = 4.dp, modifier = Modifier.weight(1f).fillMaxWidth()
                ) {
                    Box(Modifier.fillMaxSize()) {
                        Canvas(modifier = Modifier.fillMaxSize()) {
                            val cities = bestTour?.cities

                            if (cities.isNullOrEmpty()) {
                                return@Canvas
                            }

                            val minX = cities.minOf { it.x }
                            val maxX = cities.maxOf { it.x }
                            val minY = cities.minOf { it.y }
                            val maxY = cities.maxOf { it.y }

                            val points = cities.map { city ->
                                val x = 25 + ((city.x - minX) / (maxX - minX)) * (size.width - 50)
                                val y = 25 + (((city.y - minY) / (maxY - minY))) * (size.height - 50)
                                return@map Offset(x.toFloat(), y.toFloat())
                            }

                            for (i in 0 until points.size - 1) {
                                drawLine(
                                    color = Color(0xFF979797), start = points[i], end = points[i + 1], strokeWidth = 2f
                                )
                            }

                            drawLine(
                                color = Color(0xFF979797), start = points.last(), end = points.first(), strokeWidth = 2f
                            )

                            drawPoints(
                                color = Color(0xFFbe8bfc),
                                points = points,
                                pointMode = PointMode.Points,
                                strokeWidth = 10f,
                                cap = StrokeCap.Round
                            )
                        }
                    }
                }
            }
        }
    }
}

fun main() = application {
    Window(
        onCloseRequest = ::exitApplication,
        title = "Visualizer",
        state = rememberWindowState(width = 1000.dp, height = 1000.dp)
    ) {
        App()
    }
}