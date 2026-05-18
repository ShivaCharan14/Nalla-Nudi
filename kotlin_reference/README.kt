// ============================================================
// Nalla-Nudi — Jetpack Compose (Android Native) Reference Source
// ============================================================
// These are reference files matching the problem-statement request.
// They mirror the architecture shipped in the Expo React Native app
// in /app/frontend (which is the live preview used for demo).
//
// Copy this folder into an Android Studio project with these deps:
//   implementation "androidx.room:room-runtime:2.6.1"
//   implementation "androidx.room:room-ktx:2.6.1"
//   kapt          "androidx.room:room-compiler:2.6.1"
//   implementation "com.google.dagger:hilt-android:2.51"
//   kapt          "com.google.dagger:hilt-compiler:2.51"
//   implementation "androidx.hilt:hilt-navigation-compose:1.2.0"
//   implementation "androidx.compose.material3:material3:1.2.1"
//   implementation "androidx.navigation:navigation-compose:2.7.7"
// ============================================================
// File list:
//   1) data/Glossary.kt          – Room @Entity
//   2) data/GlossaryDao.kt       – Room @Dao
//   3) data/GlossaryDatabase.kt  – Room Database
//   4) domain/GlossaryRepository.kt – Repository interface + impl
//   5) ui/SearchUiState.kt       – Sealed state
//   6) ui/DictionaryViewModel.kt – Hilt ViewModel + StateFlow + TTS
//   7) ui/screens/Splash.kt
//   8) ui/screens/Dashboard.kt   – Word of Day + search + chips + list
//   9) ui/screens/Flashcard.kt   – 3D flip card
//  10) ui/NavGraph.kt            – NavHost wiring
//  11) di/AppModule.kt           – Hilt module
//  12) res/values/strings.xml    – English defaults
//  13) res/values-kn/strings.xml – Kannada
// ============================================================
