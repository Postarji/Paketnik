package com.example.postarjiapp

import okhttp3.MultipartBody
import retrofit2.Call
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.Multipart
import retrofit2.http.POST
import retrofit2.http.Part
import retrofit2.http.Path
import retrofit2.http.Query

interface ApiService {
    // Your existing login method
    @POST("login") // or whatever your login endpoint is
    fun login(@Body request: LoginRequest): Call<UserResponse>

    // New 2FA endpoints
    @POST("initiate_2fa")
    fun initiate2FA(@Query("user_id") userId: String): Call<InitiateTwoFAResponse>

    @Multipart
    @POST("verify_face/{challenge_id}")
    fun verifyFace(
        @Path("challenge_id") challengeId: String,
        @Part file: MultipartBody.Part
    ): Call<VerifyFaceResponse>

    @GET("check_2fa_status/{challenge_id}")
    fun check2FAStatus(@Path("challenge_id") challengeId: String): Call<TwoFAStatusResponse>
    @POST("register")
    fun register(@Body request: RegisterRequest): Call<UserResponse>
}

// Data classes for 2FA API responses
data class InitiateTwoFAResponse(
    val message: String,
    val challenge_id: String
)

data class VerifyFaceResponse(
    val message: String,
    val verified_user: String?,
    val expected_user: String?,
    val confidence: Double?
)

data class TwoFAStatusResponse(
    val status: String, // "VERIFIED" or "PENDING"
    val user_id: String?
)
