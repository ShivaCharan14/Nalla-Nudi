package com.nallanudi.domain

import com.nallanudi.data.Review

/**
 * SM-2 Spaced Repetition algorithm — used by DictionaryViewModel
 * when the user rates a flashcard Hard / Okay / Easy.
 *
 * Returns the next Review state for the given term.
 */
object Sm2 {
    private const val ONE_DAY_MS = 86_400_000L

    enum class Rating(val q: Int) { HARD(2), OKAY(4), EASY(5) }

    fun apply(prev: Review?, rating: Rating, termId: Int): Review {
        val current = prev ?: Review(termId = termId, nextDue = System.currentTimeMillis())
        val q = rating.q
        var ease = current.ease + (0.1f - (5 - q) * (0.08f + (5 - q) * 0.02f))
        if (ease < 1.3f) ease = 1.3f

        val (interval, streak) = if (q < 3) {
            1 to 0
        } else {
            val newStreak = current.streak + 1
            val days = when {
                current.intervalDays == 0 -> 1
                current.intervalDays == 1 -> if (rating == Rating.EASY) 4 else 3
                else -> Math.round(current.intervalDays * ease)
            }
            days to newStreak
        }

        return current.copy(
            ease = ease,
            intervalDays = interval,
            nextDue = System.currentTimeMillis() + interval * ONE_DAY_MS,
            streak = streak,
            lastRated = System.currentTimeMillis()
        )
    }
}
