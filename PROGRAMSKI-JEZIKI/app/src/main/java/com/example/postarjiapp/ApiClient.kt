package com.example.postarjiapp

import com.squareup.moshi.Moshi
import com.squareup.moshi.kotlin.reflect.KotlinJsonAdapterFactory
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.converter.moshi.MoshiConverterFactory

object ApiClient {
    private const val BASE_URL = "http://10.0.2.2:3000/" // TODO

    private fun provideMoshi(): Moshi = Moshi.Builder()
        .add(KotlinJsonAdapterFactory())
        .build()

    val moshi:Moshi by lazy { Moshi.Builder().add(KotlinJsonAdapterFactory())
        .build() }
    val retrofit:Retrofit by lazy {
        Retrofit.Builder().baseUrl(BASE_URL)
            .addConverterFactory(MoshiConverterFactory.create(moshi))
            .build() }

    /*inline fun <reified T> createService(): T{
        return retrofit.create(T::class.java)
    }*/
    fun instance() : ApiService {
        return retrofit.create(ApiService::class.java)
    }
}