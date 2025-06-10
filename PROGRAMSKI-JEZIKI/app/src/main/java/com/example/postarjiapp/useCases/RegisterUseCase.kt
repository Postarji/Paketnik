package com.example.postarjiapp.useCases

import com.example.postarjiapp.ApiClient
import com.example.postarjiapp.LoginRequest
import com.example.postarjiapp.RegisterRequest
import com.example.postarjiapp.UserResponse

class RegisterUseCase {
    //Invoke => used for calling function with registerUseCase()
    operator fun invoke(registerRequest: RegisterRequest) : UserResponse {
        val apiClient=ApiClient;
        return apiClient.instance().register(registerRequest)
    }
}