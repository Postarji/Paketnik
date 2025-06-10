package com.example.postarjiapp
import com.squareup.moshi.JsonClass
import com.squareup.moshi.Json

@JsonClass(generateAdapter = true)
data class UserResponse(
    @Json(name = "username")
    val username: String,
    @Json(name = "email")
    val email: String,
    @Json(name = "faceData")
    val faceData: String?
)
