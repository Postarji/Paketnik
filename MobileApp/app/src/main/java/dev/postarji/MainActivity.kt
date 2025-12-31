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
import android.util.Log
import androidx.lifecycle.lifecycleScope
import dev.postarji.data.LocationProvider
import dev.postarji.tsp.TSP
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        Configuration.getInstance().load(this, getSharedPreferences("osm_pref", Context.MODE_PRIVATE))
        Configuration.getInstance().userAgentValue = "PametniPaketnik_v1"
        enableEdgeToEdge()

        lifecycleScope.launch {
            val provider = LocationProvider(this@MainActivity)

            val realProblem = withContext(Dispatchers.IO) {
                provider.createRealWorldTSP(useTimeOptimization = false)
            }

            Log.d("TSP_STATUS", "Problem pripravljen! Število mest: ${realProblem.dimension}")
        }

        /*lifecycleScope.launch {
            val provider = LocationProvider(this@MainActivity)
            val realProblem = provider.createRealWorldTSP(useTimeOptimization = false)

            Log.d("TSP_STATUS", "Uspešno naloženih ${realProblem.dimension} lokacij.")
        }*/

        // --- DOMEN TEMP CODE START ---
        // Samo 1x run, da naredimo txt files za algoritme
        /*
        val runner = dev.postarji.tsp.BenchmarkRunner(this)
        runner.runAllBenchmarks()
        */
        // -- DOMEN TEMP CODE END ---

        // --- STUDENT 2 REAL WORLD DATA EXPERIMENT START ---
        // Run this once to see logs, then verify it works
        /*
        lifecycleScope.launch {
            try {
                val runner = dev.postarji.tsp.RealWorldRunner(this@MainActivity)
                runner.runExperiments()
            } catch(e: Exception) {
                android.util.Log.e("RealWorld", "Error", e)
            }
        }
        */
        // --- STUDENT 2 REAL WORLD DATA EXPERIMENT END ---

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
