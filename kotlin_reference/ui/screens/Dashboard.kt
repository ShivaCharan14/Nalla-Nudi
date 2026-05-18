package com.nallanudi.ui.screens

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.nallanudi.data.Glossary
import com.nallanudi.ui.DictionaryViewModel
import com.nallanudi.ui.SearchUiState

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardScreen(
    vm: DictionaryViewModel = hiltViewModel(),
    onOpenFlashcards: () -> Unit
) {
    val query by vm.query.collectAsState()
    val category by vm.category.collectAsState()
    val state by vm.uiState.collectAsState()
    val wod by vm.wordOfTheDay.collectAsState()

    Column(Modifier.fillMaxSize().padding(16.dp).testTag("dashboard-screen")) {
        Text("Nalla-Nudi", fontSize = 28.sp, fontWeight = FontWeight.ExtraBold, color = Color(0xFF1B4332))
        Spacer(Modifier.height(12.dp))

        // Word of the Day
        wod?.let { w ->
            Card(
                Modifier.fillMaxWidth().testTag("wod-card"),
                shape = RoundedCornerShape(24.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFF1B4332))
            ) {
                Column(Modifier.padding(20.dp)) {
                    Text("WORD OF THE DAY", color = Color(0xFFF4A261), fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    Spacer(Modifier.height(8.dp))
                    Text(w.engWord, color = Color.White, fontSize = 28.sp, fontWeight = FontWeight.ExtraBold)
                    Text(w.knMeaning, color = Color(0xFFF4A261), fontSize = 22.sp, fontWeight = FontWeight.Bold)
                    Spacer(Modifier.height(8.dp))
                    Button(onClick = { vm.speak(w.engWord, "en"); vm.speak(w.knMeaning, "kn") }) {
                        Text("Listen")
                    }
                }
            }
        }
        Spacer(Modifier.height(16.dp))
        Button(onClick = onOpenFlashcards, modifier = Modifier.testTag("open-flashcards-btn")) {
            Text("Flashcards")
        }
        Spacer(Modifier.height(16.dp))

        // Search
        OutlinedTextField(
            value = query,
            onValueChange = { vm.onQueryChange(it) },
            leadingIcon = { Icon(Icons.Default.Search, null) },
            placeholder = { Text("Search a term in English...") },
            singleLine = true,
            keyboardOptions = KeyboardOptions.Default,
            modifier = Modifier.fillMaxWidth().testTag("search-input")
        )
        Spacer(Modifier.height(8.dp))

        // Filter chips
        Row {
            listOf("" to "All", "Science" to "Science", "Math" to "Math", "Commerce" to "Commerce").forEach { (key, label) ->
                FilterChip(
                    selected = category == key,
                    onClick = { vm.onCategoryChange(key) },
                    label = { Text(label) },
                    modifier = Modifier.padding(end = 8.dp).testTag("filter-chip-$label")
                )
            }
        }
        Spacer(Modifier.height(12.dp))

        when (val s = state) {
            SearchUiState.Loading -> CircularProgressIndicator()
            SearchUiState.Empty -> Text("No terms found")
            is SearchUiState.Error -> Text("Error: ${s.message}")
            is SearchUiState.Success -> LazyColumn {
                items(s.items, key = { it.id }) { item -> TermRow(item, vm) }
            }
        }
    }
}

@Composable
private fun TermRow(item: Glossary, vm: DictionaryViewModel) {
    Card(
        Modifier.fillMaxWidth().padding(vertical = 4.dp).testTag("term-card-${item.id}"),
        shape = RoundedCornerShape(16.dp)
    ) {
        Row(
            Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(Modifier.weight(1f)) {
                Text(item.engWord, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                Text(item.knMeaning, color = Color(0xFF1B4332), fontSize = 16.sp, fontWeight = FontWeight.SemiBold)
                Text(item.subjectCategory, fontSize = 11.sp, color = Color(0xFF525B56))
            }
            IconButton(onClick = { vm.speak(item.engWord, "en") }, modifier = Modifier.testTag("listen-btn-${item.id}")) {
                Text("🔊")
            }
            IconButton(
                onClick = { vm.toggleBookmark(item.id, item.isSaved) },
                modifier = Modifier.testTag("bookmark-btn-${item.id}")
            ) {
                Text(if (item.isSaved) "★" else "☆")
            }
        }
    }
}
