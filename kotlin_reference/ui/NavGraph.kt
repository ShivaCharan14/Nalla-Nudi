package com.nallanudi.ui

import androidx.compose.runtime.Composable
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.nallanudi.ui.screens.DashboardScreen
import com.nallanudi.ui.screens.FlipCard
import com.nallanudi.ui.screens.SplashScreen

object Routes {
    const val SPLASH = "splash"
    const val DASHBOARD = "dashboard"
    const val FLASHCARDS = "flashcards"
}

@Composable
fun NallaNudiNavGraph() {
    val nav = rememberNavController()
    NavHost(navController = nav, startDestination = Routes.SPLASH) {
        composable(Routes.SPLASH) {
            SplashScreen(onContinue = { nav.navigate(Routes.DASHBOARD) { popUpTo(Routes.SPLASH) { inclusive = true } } })
        }
        composable(Routes.DASHBOARD) {
            DashboardScreen(onOpenFlashcards = { nav.navigate(Routes.FLASHCARDS) })
        }
        composable(Routes.FLASHCARDS) {
            // Demo single card — in production this wires to a list & swipe.
            FlipCard(
                engWord = "Photosynthesis",
                knMeaning = "ದ್ಯುತಿಸಂಶ್ಲೇಷಣೆ",
                category = "Science"
            )
        }
    }
}
