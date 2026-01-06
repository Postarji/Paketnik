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
