package com.arcadisfit

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.compose.rememberNavController
import com.arcadisfit.ui.theme.ArcadisFitTheme
import com.arcadisfit.ui.theme.darkColorScheme
import com.arcadisfit.ui.theme.lightColorScheme
import com.arcadisfit.ui.navigation.ArcadisFitNavHost
import com.arcadisfit.ui.viewmodels.MainViewModel
import com.arcadisfit.di.AppModule
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.delay

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        // Install splash screen
        installSplashScreen()
        
        super.onCreate(savedInstanceState)
        
        setContent {
            val mainViewModel: MainViewModel = viewModel()
            val uiState by mainViewModel.uiState.collectAsState()
            
            // Determine theme based on user preference or system
            val isDarkTheme = remember {
                derivedStateOf {
                    uiState.isDarkMode ?: isSystemInDarkTheme()
                }
            }
            
            ArcadisFitTheme(
                darkTheme = isDarkTheme.value,
                colorScheme = if (isDarkTheme.value) darkColorScheme else lightColorScheme
            ) {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    val navController = rememberNavController()
                    
                    ArcadisFitNavHost(
                        navController = navController,
                        mainViewModel = mainViewModel
                    )
                }
            }
        }
    }
}

// MARK: - App Entry Point
@Composable
fun ArcadisFitApp(
    mainViewModel: MainViewModel = viewModel()
) {
    val uiState by mainViewModel.uiState.collectAsState()
    
    LaunchedEffect(Unit) {
        // Initialize app
        mainViewModel.initializeApp()
        
        // Simulate splash screen delay
        delay(2000)
    }
    
    // Show splash screen while loading
    if (uiState.isLoading) {
        SplashScreen()
    } else {
        // Main app content
        MainAppContent(mainViewModel = mainViewModel)
    }
}

@Composable
fun SplashScreen() {
    // Splash screen implementation
    Surface(
        modifier = Modifier.fillMaxSize(),
        color = MaterialTheme.colorScheme.primary
    ) {
        // Splash screen content
        // This would include the app logo and loading indicator
    }
}

@Composable
fun MainAppContent(mainViewModel: MainViewModel) {
    val navController = rememberNavController()
    
    ArcadisFitNavHost(
        navController = navController,
        mainViewModel = mainViewModel
    )
}