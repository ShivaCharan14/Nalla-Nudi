package com.nallanudi.ui.screens

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.launch

/**
 * 3D Flip Card for Flashcard Revision module.
 * Front = English term. Back = Kannada meaning. Flip triggered on tap.
 */
@Composable
fun FlipCard(
    engWord: String,
    knMeaning: String,
    category: String,
    modifier: Modifier = Modifier
) {
    val rotation = remember { Animatable(0f) }
    val scope = rememberCoroutineScope()

    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(420.dp)
            .testTag("flip-card")
    ) {
        // Front
        Card(
            modifier = Modifier
                .fillMaxSize()
                .graphicsLayer {
                    rotationY = rotation.value
                    cameraDistance = 12f * density
                    alpha = if (rotation.value <= 90f) 1f else 0f
                },
            shape = RoundedCornerShape(28.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White)
        ) {
            Box(Modifier.fillMaxSize().padding(32.dp), contentAlignment = Alignment.Center) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("EN", color = Color(0xFF525B56), fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    Spacer(Modifier.height(24.dp))
                    Text(
                        engWord,
                        color = Color(0xFF1B4332),
                        fontSize = 40.sp,
                        fontWeight = FontWeight.ExtraBold
                    )
                    Spacer(Modifier.height(16.dp))
                    Box(
                        Modifier
                            .clip(RoundedCornerShape(50))
                            .background(Color(0xFFF4A26122))
                            .padding(horizontal = 12.dp, vertical = 6.dp)
                    ) { Text(category, color = Color(0xFFE07A5F), fontSize = 11.sp, fontWeight = FontWeight.Bold) }
                }
            }
        }
        // Back
        Card(
            modifier = Modifier
                .fillMaxSize()
                .graphicsLayer {
                    rotationY = rotation.value - 180f
                    cameraDistance = 12f * density
                    alpha = if (rotation.value > 90f) 1f else 0f
                },
            shape = RoundedCornerShape(28.dp),
            colors = CardDefaults.cardColors(containerColor = Color(0xFF1B4332))
        ) {
            Box(Modifier.fillMaxSize().padding(32.dp), contentAlignment = Alignment.Center) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("ಕನ್ನಡ", color = Color(0xFFF4A261), fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    Spacer(Modifier.height(24.dp))
                    Text(
                        knMeaning,
                        color = Color.White,
                        fontSize = 40.sp,
                        fontWeight = FontWeight.ExtraBold
                    )
                }
            }
        }
        // Tap overlay
        Box(
            Modifier
                .matchParentSize()
        ) {
            TextButton(
                onClick = {
                    scope.launch {
                        rotation.animateTo(
                            if (rotation.value == 0f) 180f else 0f,
                            tween(650)
                        )
                    }
                },
                modifier = Modifier.matchParentSize()
            ) {}
        }
    }
}
