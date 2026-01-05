package dev.postarji.screens

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.drawable.BitmapDrawable
import android.graphics.drawable.Drawable
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.MarkunreadMailbox
import androidx.compose.material.icons.filled.Remove
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Straighten
import androidx.compose.material.icons.filled.Timer
import androidx.compose.material3.*
import androidx.compose.material3.HorizontalDivider
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import dev.postarji.R
import dev.postarji.data.LocationProvider
import org.osmdroid.tileprovider.tilesource.TileSourceFactory
import org.osmdroid.util.GeoPoint
import org.osmdroid.views.MapView
import dev.postarji.tsp.City
import dev.postarji.tsp.GeneticAlgorithm
import dev.postarji.tsp.Tour
import kotlinx.coroutines.launch
import org.osmdroid.bonuspack.routing.OSRMRoadManager
import org.osmdroid.views.overlay.Marker
import org.osmdroid.views.overlay.Polyline
import android.graphics.Color as AndroidColor
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.osmdroid.views.CustomZoomButtonsController
import java.util.Locale

fun formatDuration(seconds: Double): String {
    val totalMinutes = (seconds / 60).toInt()
    val hours = totalMinutes / 60
    val minutes = totalMinutes % 60
    return if (hours > 0) "${hours}h ${minutes}min" else "${minutes}min"
}

fun formatDistance(km: Double): String {
    return String.format(Locale.US, "%.1f km", km)
}

fun resizeDrawable(context: android.content.Context, resId: Int, dstWidth: Int, dstHeight: Int): Drawable? {
    val drawable = ContextCompat.getDrawable(context, resId) ?: return null
    val bitmap = Bitmap.createBitmap(dstWidth, dstHeight, Bitmap.Config.ARGB_8888)
    val canvas = Canvas(bitmap)
    drawable.setBounds(0, 0, dstWidth, dstHeight)
    drawable.draw(canvas)
    return BitmapDrawable(context.resources, bitmap)
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun Map(
    modifier: Modifier = Modifier,
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var showMainDialog by remember { mutableStateOf(true) }
    var showSettingsDialog by remember { mutableStateOf(false) }

    var routePoints by remember { mutableStateOf<List<GeoPoint>>(emptyList()) }
    var selectedMarkers by remember { mutableStateOf<List<GeoPoint>>(emptyList()) }
    var routeStats by remember { mutableStateOf<Pair<Double, Double>?>(null) }

    var isExpanded by remember { mutableStateOf(false) }
    var selectedOption by remember { mutableStateOf("Time") }
    val options = listOf("Time", "Distance")

    val locationProvider = LocationProvider(context)
    val allCities = remember { locationProvider.loadCitiesFromCsvCoords("direct4meLocationsCoords.csv") }

    val cityList = remember {
        mutableStateListOf<City>().apply {
            addAll(allCities)
        }
    }

    val isAnySelected by remember { derivedStateOf { cityList.any { it.isSelected } } }
    val numberOfSelected by remember { derivedStateOf { cityList.count { it.isSelected } } }

    var populationSize by remember { mutableStateOf("200") }
    var crossingProbability by remember { mutableStateOf("0.9") }
    var mutationProbability by remember { mutableStateOf("0.5") }

    var isLoading by remember { mutableStateOf(false) }

    val mapView = remember {
        MapView(context).apply {
            setTileSource(TileSourceFactory.DEFAULT_TILE_SOURCE)
            setMultiTouchControls(true)
            zoomController.setVisibility(CustomZoomButtonsController.Visibility.NEVER)
            controller.setZoom(8.85)
            controller.setCenter(GeoPoint(46.1512, 14.9955))
        }
    }

    Box(modifier = modifier.fillMaxSize()) {
        AndroidView(
            modifier = Modifier.fillMaxSize(),
            factory = { mapView },
            update = { view ->

                view.overlays.clear()

                if (routePoints.isNotEmpty()) {
                    val line = Polyline().apply {
                        setPoints(routePoints)
                        outlinePaint.color = AndroidColor.BLUE
                        outlinePaint.strokeWidth = 5f
                    }

                    view.overlays.add(line)
                }

                if (selectedMarkers.isNotEmpty()) {
                    selectedMarkers.forEachIndexed { index, point ->
                        val marker = Marker(view).apply {
                            position = point
                            icon = resizeDrawable(context, R.drawable.mailbox, 100, 100)
                            setAnchor(Marker.ANCHOR_CENTER, Marker.ANCHOR_BOTTOM)
                            title = "Stop ${index + 1}"
                        }
                        view.overlays.add(marker)
                    }
                }

                view.invalidate()
            }
        )

        if (routeStats != null) {
            Card(
                modifier = Modifier
                    .align(Alignment.BottomStart)
                    .padding(16.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                elevation = CardDefaults.cardElevation(defaultElevation = 6.dp)
            ) {
                Column(
                    modifier = Modifier.padding(12.dp)
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = if (selectedOption == "Time") Icons.Default.Timer else Icons.Default.Straighten,
                            contentDescription = null,
                            modifier = Modifier.size(16.dp),
                            tint = MaterialTheme.colorScheme.primary
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = "Optimized by $selectedOption",
                            style = MaterialTheme.typography.labelMedium,
                            color = MaterialTheme.colorScheme.primary
                        )
                    }

                    Spacer(modifier = Modifier.height(4.dp))

                    Text(
                        text = if (selectedOption == "Time") {
                            formatDuration(routeStats!!.first)
                        } else {
                            formatDistance(routeStats!!.second)
                        },
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold
                    )

                    Text(
                        text = if (selectedOption == "Time") {
                            formatDistance(routeStats!!.second)
                        } else {
                            formatDuration(routeStats!!.first)
                        },
                        style = MaterialTheme.typography.bodySmall,
                        color = Color.Gray
                    )
                }
            }
        }

        Column(
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .padding(16.dp)
        ) {
            SmallFloatingActionButton(
                onClick = { mapView.controller.zoomIn() },
                containerColor = Color.White,
                contentColor = Color.Black,
            ) {
                Icon(Icons.Default.Add, contentDescription = "Zoom In")
            }
            SmallFloatingActionButton(
                onClick = { mapView.controller.zoomOut() },
                containerColor = Color.White,
                contentColor = Color.Black
            ) {
                Icon(Icons.Default.Remove, contentDescription = "Zoom Out")
            }
        }

        if (showMainDialog) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color.Black.copy(alpha = 0.5f))
                    .clickable(
                        interactionSource = remember { MutableInteractionSource() },
                        indication = null
                    ) { },
                contentAlignment = Alignment.Center
            ) {
                Card(
                    modifier = Modifier
                        .fillMaxWidth(0.9f)
                        .padding(16.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    elevation = CardDefaults.cardElevation(defaultElevation = 8.dp)
                ) {
                    Column(
                        modifier = Modifier.padding(24.dp)
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text("Select DeliveryBoxes", fontSize = 20.sp, fontWeight = FontWeight.Bold)
                            IconButton(onClick = { showSettingsDialog = true }) {
                                Icon(Icons.Default.Settings, contentDescription = "Settings")
                            }
                        }
                        Spacer(modifier = Modifier.height(8.dp))

                        ExposedDropdownMenuBox(
                            expanded = isExpanded,
                            onExpandedChange = { isExpanded = !isExpanded },
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 8.dp)
                        ) {
                            OutlinedTextField(
                                value = selectedOption,
                                onValueChange = {},
                                readOnly = true,
                                label = { Text("Sort By") },
                                trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = isExpanded) },
                                colors = ExposedDropdownMenuDefaults.outlinedTextFieldColors(),
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .menuAnchor()
                            )
                            ExposedDropdownMenu(expanded = isExpanded, onDismissRequest = { isExpanded = false }) {
                                options.forEach { option ->
                                    DropdownMenuItem(
                                        text = { Text(option) },
                                        onClick = { selectedOption = option; isExpanded = false })
                                }
                            }
                        }

                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable {
                                    val newState = !isAnySelected; for (i in cityList.indices) {
                                    cityList[i] = cityList[i].copy(isSelected = newState)
                                }
                                }
                                .padding(vertical = 8.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Checkbox(checked = isAnySelected, onCheckedChange = { newState ->
                                for (i in cityList.indices) {
                                    cityList[i] = cityList[i].copy(isSelected = newState)
                                }
                            })
                            Text(
                                text = if (isAnySelected) "Unselect All ($numberOfSelected)" else "Select All",
                                fontWeight = FontWeight.SemiBold,
                                modifier = Modifier.padding(start = 8.dp)
                            )
                        }
                        HorizontalDivider(color = Color.LightGray.copy(alpha = 0.5f))

                        LazyColumn(
                            modifier = Modifier.weight(1f, fill = false)
                        ) {
                            items(cityList) { city ->
                                Row(modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable {
                                        val index = cityList.indexOf(city);
                                        cityList[index] = city.copy(isSelected = !city.isSelected)
                                    }
                                    .padding(vertical = 12.dp), verticalAlignment = Alignment.CenterVertically) {
                                    Checkbox(
                                        checked = city.isSelected,
                                        onCheckedChange = {
                                            val index = cityList.indexOf(city); cityList[index] =
                                            city.copy(isSelected = it)
                                        })
                                    Text(
                                        text = "${city.name}, ${city.address}",
                                        modifier = Modifier.padding(start = 8.dp)
                                    )
                                }
                                HorizontalDivider(color = Color.LightGray.copy(alpha = 0.2f))
                            }
                        }
                        Spacer(modifier = Modifier.height(24.dp))

                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
                            Button(
                                enabled = isAnySelected,
                                onClick = {
                                    isLoading = true
                                    showMainDialog = false

                                    scope.launch {
                                        val selectedCitiesOriginal = cityList.filter { it.isSelected }

                                        val normalizedCities = selectedCitiesOriginal.mapIndexed { index, city ->
                                            city.copy(index = index + 1)
                                        }

                                        val tsp = if (selectedOption == "Time") {
                                            locationProvider.createRealWorldTSP(true, normalizedCities)
                                        } else {
                                            locationProvider.createRealWorldTSP(false, normalizedCities)
                                        }

                                        var globalBest: Tour = Tour()
                                        globalBest.distance = Double.MAX_VALUE
                                        for (i in 0 until 1) {
                                            val ga = GeneticAlgorithm(
                                                tsp = tsp,
                                                populationSize = populationSize.toInt(),
                                                crossoverRate = crossingProbability.toDouble(),
                                                mutationRate = mutationProbability.toDouble()
                                            )

                                            val runResult = ga.run()

                                            if (runResult.distance < globalBest.distance) {
                                                globalBest = runResult
                                            }
                                        }

                                        val stops = globalBest.cities.map { GeoPoint(it.y, it.x) }

                                        val (roadNodes, stats) = withContext(Dispatchers.IO) {
                                            val stops = globalBest.cities.map { GeoPoint(it.y, it.x) }

                                            val roadManager = OSRMRoadManager(context, "dev.postarji/1.0")
                                            roadManager.setMean(OSRMRoadManager.MEAN_BY_CAR)

                                            val road = roadManager.getRoad(ArrayList(stops))

                                            Pair(road.mRouteHigh, Pair(road.mDuration, road.mLength))
                                        }

                                        selectedMarkers = stops
                                        routePoints = roadNodes
                                        routeStats = stats
                                        isLoading = false
                                    }
                                }
                            ) { Text("Confirm Selection") }
                        }
                    }
                }
            }
        }

        if (showSettingsDialog) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color.Black.copy(alpha = 0.6f))
                    .clickable(
                        interactionSource = remember { MutableInteractionSource() },
                        indication = null
                    ) { showSettingsDialog = false },
                contentAlignment = Alignment.Center
            ) {
                Card(
                    modifier = Modifier.fillMaxWidth(0.85f),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                ) {
                    Column(modifier = Modifier.padding(24.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
                        Text("Algorithm Settings", fontSize = 18.sp, fontWeight = FontWeight.Bold)

                        OutlinedTextField(
                            value = populationSize,
                            onValueChange = { newValue ->
                                if (newValue.all { it.isDigit() }) {
                                    populationSize = newValue
                                }
                            },
                            label = { Text("Population Size") },
                            modifier = Modifier.fillMaxWidth(),
                            keyboardOptions = KeyboardOptions(
                                keyboardType = KeyboardType.Decimal
                            )
                        )

                        OutlinedTextField(
                            value = crossingProbability,
                            onValueChange = { newValue ->
                                val floatValue = newValue.toFloatOrNull()
                                if (floatValue != null && floatValue in 0.0..1.0) {
                                    crossingProbability = newValue
                                }
                            },
                            label = { Text("Crossing Probability (0.0 - 1.0)") },
                            modifier = Modifier.fillMaxWidth(),
                            keyboardOptions = KeyboardOptions(
                                keyboardType = KeyboardType.Decimal
                            )
                        )

                        OutlinedTextField(
                            value = mutationProbability,
                            onValueChange = { newValue ->
                                val floatValue = newValue.toFloatOrNull()
                                if (floatValue != null && floatValue in 0.0..1.0) {
                                    mutationProbability = newValue
                                }
                            },
                            label = { Text("Mutation Probability (0.0 - 1.0)") },
                            modifier = Modifier.fillMaxWidth(),
                            keyboardOptions = KeyboardOptions(
                                keyboardType = KeyboardType.Decimal
                            )
                        )

                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
                            TextButton(onClick = { showSettingsDialog = false }) { Text("Back") }
                            Spacer(modifier = Modifier.width(8.dp))
                            Button(onClick = { showSettingsDialog = false }) { Text("Save") }
                        }
                    }
                }
            }
        }

        if (isLoading) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color.Black.copy(alpha = 0.5f))
                    .clickable(enabled = false) {},
                contentAlignment = Alignment.Center
            ) {
                Card(
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    elevation = CardDefaults.cardElevation(defaultElevation = 8.dp)
                ) {
                    Column(
                        modifier = Modifier.padding(24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center
                    ) {
                        CircularProgressIndicator()
                        Spacer(modifier = Modifier.height(16.dp))
                        Text("Calculating best route...", fontWeight = FontWeight.Medium)
                    }
                }
            }
        }
    }
}