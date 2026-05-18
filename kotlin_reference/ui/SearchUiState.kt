package com.nallanudi.ui

import com.nallanudi.data.Glossary

sealed interface SearchUiState {
    object Loading : SearchUiState
    data class Success(val items: List<Glossary>) : SearchUiState
    object Empty : SearchUiState
    data class Error(val message: String) : SearchUiState
}
