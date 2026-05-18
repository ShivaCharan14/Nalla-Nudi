package com.nallanudi.data

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import kotlinx.coroutines.flow.Flow

@Dao
interface GlossaryDao {

    /** Search by English word. Empty category string means "All". */
    @Query(
        """
        SELECT * FROM glossary
        WHERE eng_word LIKE '%' || :query || '%'
          AND (:category = '' OR subject_category = :category)
        ORDER BY eng_word COLLATE NOCASE
        LIMIT 100
        """
    )
    fun search(query: String, category: String): Flow<List<Glossary>>

    @Query("SELECT * FROM glossary ORDER BY eng_word COLLATE NOCASE")
    fun getAll(): Flow<List<Glossary>>

    @Query("SELECT * FROM glossary WHERE is_saved = 1 ORDER BY eng_word COLLATE NOCASE")
    fun getBookmarks(): Flow<List<Glossary>>

    @Query("SELECT * FROM glossary ORDER BY id LIMIT 1 OFFSET :offset")
    suspend fun wordOfTheDay(offset: Int): Glossary?

    @Query("SELECT COUNT(*) FROM glossary")
    suspend fun count(): Int

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(items: List<Glossary>)

    @Update
    suspend fun update(item: Glossary)

    @Query("UPDATE glossary SET is_saved = :saved WHERE id = :id")
    suspend fun setSaved(id: Int, saved: Boolean)
}
