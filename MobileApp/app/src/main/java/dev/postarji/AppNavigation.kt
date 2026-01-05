package dev.postarji

import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import dev.postarji.screens.HistoryScreen
import dev.postarji.screens.HomeScreen
import dev.postarji.screens.Map
import dev.postarji.screens.OpenScreen

@Composable
fun AppNavigation(navController: NavHostController, padding: PaddingValues) {
    NavHost(navController = navController, startDestination = "home") {
        composable("home") { HomeScreen(modifier = Modifier.padding(padding)) }
        composable("open") { OpenScreen(modifier = Modifier.padding(padding)) }
        composable("history") { HistoryScreen(modifier = Modifier.padding(padding)) }
        composable("path") { Map(modifier = Modifier.padding(padding)) }
    }
}