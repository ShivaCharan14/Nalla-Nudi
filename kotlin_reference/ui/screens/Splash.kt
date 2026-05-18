package com.nallanudi.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.material3.Button
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.delay

@Composable
fun SplashScreen(onContinue: () -> Unit) {
    LaunchedEffect(Unit) { delay(2500); onContinue() }

    Column(
        Modifier.fillMaxSize().testTag("splash-screen"),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text("ನಲ್ಲ-ನುಡಿ", fontSize = 48.sp, fontWeight = FontWeight.ExtraBold)
        Text("Nalla-Nudi", fontSize = 18.sp, fontWeight = FontWeight.Bold)
        Spacer(Modifier.height(8.dp))
        Text("Bridge-Dictionary for STEM Students")
        Spacer(Modifier.height(32.dp))
        Button(onClick = onContinue, modifier = Modifier.testTag("splash-get-started-btn")) {
            Text("Get Started")
        }
    }
}
