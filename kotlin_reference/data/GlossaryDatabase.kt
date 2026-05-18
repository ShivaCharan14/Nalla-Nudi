package com.nallanudi.data

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase

@Database(entities = [Glossary::class], version = 1, exportSchema = false)
abstract class GlossaryDatabase : RoomDatabase() {
    abstract fun dao(): GlossaryDao

    companion object {
        @Volatile private var INSTANCE: GlossaryDatabase? = null
        fun get(ctx: Context): GlossaryDatabase = INSTANCE ?: synchronized(this) {
            INSTANCE ?: Room.databaseBuilder(
                ctx.applicationContext,
                GlossaryDatabase::class.java,
                "nalla_nudi.db"
            ).build().also { INSTANCE = it }
        }
    }
}
