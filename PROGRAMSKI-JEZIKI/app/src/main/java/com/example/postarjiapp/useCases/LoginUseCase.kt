package com.example.postarjiapp.useCases

import com.example.postarjiapp.ApiClient
import com.example.postarjiapp.LoginRequest
import com.example.postarjiapp.UserResponse

class LoginUseCase {
    operator fun invoke(loginRequest: LoginRequest) : UserResponse{
        return ApiClient.instance().login(loginRequest)
    }
}