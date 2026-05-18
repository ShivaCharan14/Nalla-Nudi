package com.nallanudi.data

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.PrimaryKey

/**
 * SM-2 Spaced Repetition state for each studied term.
 * Mastery = streak >= 3 (configurable).
 */
@Entity(tableName = "review")
data class Review(
    @PrimaryKey @ColumnInfo(name = "term_id") val termId: Int,
    @ColumnInfo(name = "ease") val ease: Float = 2.5f,
    @ColumnInfo(name = "interval_days") val intervalDays: Int = 0,
    @ColumnInfo(name = "next_due") val nextDue: Long,        // epoch ms
    @ColumnInfo(name = "streak") val streak: Int = 0,
    @ColumnInfo(name = "last_rated") val lastRated: Long = 0
)
