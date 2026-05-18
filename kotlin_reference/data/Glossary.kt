package com.nallanudi.data

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "glossary")
data class Glossary(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    @ColumnInfo(name = "eng_word") val engWord: String,
    @ColumnInfo(name = "kn_meaning") val knMeaning: String,
    @ColumnInfo(name = "english_meaning") val englishMeaning: String? = null,
    @ColumnInfo(name = "kannada_explanation") val kannadaExplanation: String? = null,
    @ColumnInfo(name = "phonetic_kn") val phoneticKn: String? = null,
    @ColumnInfo(name = "subject_category") val subjectCategory: String, // Science | Math | Commerce
    @ColumnInfo(name = "difficulty") val difficulty: String = "Beginner",
    @ColumnInfo(name = "example") val example: String? = null,
    @ColumnInfo(name = "is_saved") val isSaved: Boolean = false,
    @ColumnInfo(name = "ai_generated") val aiGenerated: Boolean = false
)
