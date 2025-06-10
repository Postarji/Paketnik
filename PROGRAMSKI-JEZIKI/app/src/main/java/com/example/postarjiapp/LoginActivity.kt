package com.example.postarjiapp

import android.content.Intent
import android.os.Bundle
import android.util.Log
import android.widget.Button
import android.widget.EditText
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.example.postarjiapp.useCases.LoginUseCase
import com.example.postarjiapp.useCases.RegisterUseCase

class LoginActivity : AppCompatActivity() {

    private lateinit var etEmail: EditText
    private lateinit var etPassword: EditText
    private lateinit var btnLogin: Button

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_login)

        etEmail = findViewById(R.id.etEmail)
        etPassword = findViewById(R.id.etPassword)
        btnLogin = findViewById(R.id.btnLogin)

        val btnGoToRegister: TextView = findViewById(R.id.btnGoToRegister)

        btnGoToRegister.setOnClickListener {
            val intent = Intent(this, RegisterActivity::class.java)
            startActivity(intent)
        }

        btnLogin.setOnClickListener {
            val username = etEmail.text.toString().trim()
            val password = etPassword.text.toString().trim()

            if (username.isEmpty() || password.isEmpty()) {
                Toast.makeText(this, "Please fill all fields", Toast.LENGTH_SHORT).show()
            } else {
                val request = LoginRequest(username, password)
                val loginUseCase = LoginUseCase()

                try {
                    val userResponse = loginUseCase(request)
                    Toast.makeText(this@LoginActivity, "Credentials verified. Initiating 2FA...", Toast.LENGTH_SHORT).show()

                    val intent = Intent(this@LoginActivity, MainActivity::class.java)
                    startActivity(intent)
                    finish()
                } catch (e:Exception){
                    Toast.makeText(this@LoginActivity, "Login failed", Toast.LENGTH_SHORT).show()
                }

                /*ApiClient.instance.login(request).enqueue(object : retrofit2.Callback<UserResponse> {
                    override fun onResponse(
                        call: retrofit2.Call<UserResponse>,
                        response: retrofit2.Response<UserResponse>
                    ) {
                        if (response.isSuccessful && response.body() != null) {
                            val user = response.body()!!
                            Toast.makeText(this@LoginActivity, "Credentials verified. Initiating 2FA...", Toast.LENGTH_SHORT).show()

                            initiate2FA(user.username)
                        } else {
                            Toast.makeText(this@LoginActivity, "Login failed", Toast.LENGTH_SHORT).show()
                        }
                    }

                    override fun onFailure(call: retrofit2.Call<UserResponse>, t: Throwable) {
                        Toast.makeText(this@LoginActivity, "Error: ${t.message}", Toast.LENGTH_SHORT).show()
                    }
                })*/
            }
        }
    }

    private fun initiate2FA(userId: String) {
        ApiClient.instance().initiate2FA(userId).enqueue(object : retrofit2.Callback<InitiateTwoFAResponse> {
            override fun onResponse(
                call: retrofit2.Call<InitiateTwoFAResponse>,
                response: retrofit2.Response<InitiateTwoFAResponse>
            ) {
                if (response.isSuccessful && response.body() != null) {
                    val twoFAResponse = response.body()!!
                    val challengeId = twoFAResponse.challenge_id

                    // Start Face Verification Activity
                    val intent = Intent(this@LoginActivity, FaceVerificationActivity::class.java)
                    intent.putExtra("challenge_id", challengeId)
                    intent.putExtra("user_id", userId)
                    startActivity(intent)
                } else {
                    Toast.makeText(this@LoginActivity, "Failed to initiate 2FA", Toast.LENGTH_SHORT).show()
                }
            }

            override fun onFailure(call: retrofit2.Call<InitiateTwoFAResponse>, t: Throwable) {
                Toast.makeText(this@LoginActivity, "2FA Error: ${t.message}", Toast.LENGTH_SHORT).show()
            }
        })
    }
}