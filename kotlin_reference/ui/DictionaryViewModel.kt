package com.nallanudi.ui

import android.app.Application
import android.speech.tts.TextToSpeech
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.nallanudi.data.Glossary
import com.nallanudi.domain.GlossaryRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.FlowPreview
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.util.Locale
import javax.inject.Inject

@OptIn(FlowPreview::class)
@HiltViewModel
class DictionaryViewModel @Inject constructor(
    app: Application,
    private val repo: GlossaryRepository
) : AndroidViewModel(app) {

    private val _query = MutableStateFlow("")
    val query: StateFlow<String> = _query.asStateFlow()

    private val _category = MutableStateFlow("") // "" means All
    val category: StateFlow<String> = _category.asStateFlow()

    private val _wordOfTheDay = MutableStateFlow<Glossary?>(null)
    val wordOfTheDay: StateFlow<Glossary?> = _wordOfTheDay.asStateFlow()

    val uiState: StateFlow<SearchUiState> = combine(
        _query.debounce(120),
        _category
    ) { q, c -> q to c }
        .flatMapLatest { (q, c) -> repo.search(q, c) }
        .map { list -> if (list.isEmpty()) SearchUiState.Empty else SearchUiState.Success(list) }
        .catch { e -> emit(SearchUiState.Error(e.message ?: "error")) }
        .stateIn(viewModelScope, SharingStarted.Eagerly, SearchUiState.Loading)

    private val tts: TextToSpeech = TextToSpeech(getApplication()) { }

    init { viewModelScope.launch { _wordOfTheDay.value = repo.wordOfTheDay() } }

    fun onQueryChange(q: String) { _query.value = q }
    fun onCategoryChange(c: String) { _category.value = c }

    fun toggleBookmark(id: Int, current: Boolean) {
        viewModelScope.launch { repo.setSaved(id, !current) }
    }

    /** Trigger Android TTS for pronunciation. lang = "en" or "kn". */
    fun speak(text: String, lang: String = "en") {
        val locale = if (lang == "kn") Locale("kn", "IN") else Locale("en", "IN")
        tts.language = locale
        tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, text)
    }

    override fun onCleared() {
        tts.stop(); tts.shutdown(); super.onCleared()
    }
}
