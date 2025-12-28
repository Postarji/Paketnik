package dev.postarji

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.tooling.preview.Preview
import androidx.navigation.compose.rememberNavController
import dev.postarji.screens.MainScreen
import dev.postarji.ui.theme.PostarjiTheme

import org.osmdroid.config.Configuration
import android.content.Context

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // --- OSMDROID KONFIGURACIJA ---
        Configuration.getInstance().load(
            this,
            getSharedPreferences("osm_pref", Context.MODE_PRIVATE)
        )
        // Nastavimo userAgentValue, da se identificiramo na OSM strežnikih.
        Configuration.getInstance().userAgentValue = "PametniPaketnik_v1"
        enableEdgeToEdge()

        // --- DOMEN TEMP CODE START ---
        // Samo 1x run, da naredimo txt files za algoritme
        /*
        val runner = dev.postarji.tsp.BenchmarkRunner(this)
        runner.runAllBenchmarks()
        */

        setContent {
            PostarjiTheme {
                App()
            }
        }
    }
}
@Composable
@Preview(showSystemUi = true, showBackground = true)
fun App() {
    val navController = rememberNavController()
    val context = LocalContext.current

    Surface(modifier = Modifier.fillMaxSize()) {
        MainScreen(navController)
    }
}
