package com.nallanudi.di

import android.content.Context
import com.nallanudi.data.GlossaryDao
import com.nallanudi.data.GlossaryDatabase
import com.nallanudi.domain.GlossaryRepository
import com.nallanudi.domain.GlossaryRepositoryImpl
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object AppModule {

    @Provides @Singleton
    fun provideDb(@ApplicationContext ctx: Context): GlossaryDatabase = GlossaryDatabase.get(ctx)

    @Provides @Singleton
    fun provideDao(db: GlossaryDatabase): GlossaryDao = db.dao()

    @Provides @Singleton
    fun provideRepo(dao: GlossaryDao): GlossaryRepository = GlossaryRepositoryImpl(dao)
}
