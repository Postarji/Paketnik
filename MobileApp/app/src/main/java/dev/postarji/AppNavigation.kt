package dev.postarji

import androidx.compose.runtime.Composable
import androidx.compose.ui.platform.LocalContext
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import dev.postarji.screens.HistoryScreen
import dev.postarji.screens.HomeScreen
import dev.postarji.screens.OpenScreen

@Composable
fun AppNavigation(navController: NavHostController) {
    val context = LocalContext.current

    NavHost(navController = navController, startDestination = "home") {
        composable("home") { HomeScreen(navController) }
        composable("open") { OpenScreen(navController) }
        composable("history") { HistoryScreen(navController) }
    }
}