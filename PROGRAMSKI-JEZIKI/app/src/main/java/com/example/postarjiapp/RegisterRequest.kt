package com.example.postarjiapp
import com.squareup.moshi.JsonClass
import com.squareup.moshi.Json

@JsonClass(generateAdapter = true)
data class RegisterRequest(
    @Json(name = "username")
    val username: String,
    @Json(name = "email")
    val email: String,
    @Json(name = "password")
    val password: String
)