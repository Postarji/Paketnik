package dev.postarji.ui.theme.components

import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.viewinterop.AndroidView
import org.osmdroid.tileprovider.tilesource.TileSourceFactory
import org.osmdroid.util.GeoPoint
import org.osmdroid.views.MapView

@Composable
fun OpenStreetMap(
    modifier: Modifier = Modifier,
    points: List<GeoPoint> = emptyList() // Seznam tvojih koordinat iz koraka 2
) {
    val context = LocalContext.current

    AndroidView(
        modifier = modifier.fillMaxSize(),
        factory = { ctx ->
            MapView(ctx).apply {
                setTileSource(TileSourceFactory.MAPNIK)
                setMultiTouchControls(true)
                controller.setZoom(15.0)
                // Tu bo Študent 3 dodal izris poti [cite: 80]
            }
        },
        update = { mapView ->
            // Tu posodobiš markerje, ko dobiš nove podatke
        }
    )
}