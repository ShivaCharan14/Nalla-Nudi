package com.nallanudi.domain

import com.nallanudi.data.Glossary
import com.nallanudi.data.GlossaryDao
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject

interface GlossaryRepository {
    fun search(query: String, category: String): Flow<List<Glossary>>
    fun bookmarks(): Flow<List<Glossary>>
    suspend fun setSaved(id: Int, saved: Boolean)
    suspend fun wordOfTheDay(): Glossary?
    suspend fun seedIfEmpty(seed: List<Glossary>)
}

class GlossaryRepositoryImpl @Inject constructor(
    private val dao: GlossaryDao
) : GlossaryRepository {

    override fun search(query: String, category: String) = dao.search(query, category)
    override fun bookmarks() = dao.getBookmarks()
    override suspend fun setSaved(id: Int, saved: Boolean) = dao.setSaved(id, saved)

    override suspend fun wordOfTheDay(): Glossary? {
        val count = dao.count()
        if (count == 0) return null
        val dayOfYear = java.time.LocalDate.now().dayOfYear
        return dao.wordOfTheDay(dayOfYear % count)
    }

    override suspend fun seedIfEmpty(seed: List<Glossary>) {
        if (dao.count() == 0) dao.insertAll(seed)
    }
}
