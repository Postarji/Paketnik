package com.example.postarjiapp

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Bundle
import android.util.Log
import android.widget.Button
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.camera.core.*
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.asRequestBody
import java.io.File
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

class FaceVerificationActivity : AppCompatActivity() {

    private lateinit var challengeId: String
    private lateinit var userId: String
    private lateinit var viewFinder: PreviewView
    private lateinit var captureButton: Button

    private var imageCapture: ImageCapture? = null
    private lateinit var cameraExecutor: ExecutorService

    companion object {
        private const val TAG = "FaceVerification"
        private const val REQUEST_CODE_PERMISSIONS = 10
        private val REQUIRED_PERMISSIONS = arrayOf(Manifest.permission.CAMERA)
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_face_verification)

        // Get data from intent
        challengeId = intent.getStringExtra("challenge_id") ?: ""
        userId = intent.getStringExtra("user_id") ?: ""

        if (challengeId.isEmpty() || userId.isEmpty()) {
            Toast.makeText(this, "Invalid verification data", Toast.LENGTH_SHORT).show()
            finish()
            return
        }

        viewFinder = findViewById(R.id.viewFinder)
        captureButton = findViewById(R.id.captureButton)

        captureButton.setOnClickListener {
            takePhoto()
        }

        // Request camera permissions
        if (allPermissionsGranted()) {
            startCamera()
        } else {
            ActivityCompat.requestPermissions(
                this, REQUIRED_PERMISSIONS, REQUEST_CODE_PERMISSIONS
            )
        }

        cameraExecutor = Executors.newSingleThreadExecutor()
    }

    private fun takePhoto() {
        // Get a stable reference of the modifiable image capture use case
        val imageCapture = imageCapture ?: return

        // Create time stamped name and MediaStore entry.
        val photoFile = File(
            externalCacheDir,
            "face_verification_${System.currentTimeMillis()}.jpg"
        )

        // Create output options object which contains file + metadata
        val outputOptions = ImageCapture.OutputFileOptions.Builder(photoFile).build()

        // Set up image capture listener, which is triggered after photo has been taken
        imageCapture.takePicture(
            outputOptions,
            ContextCompat.getMainExecutor(this),
            object : ImageCapture.OnImageSavedCallback {
                override fun onError(exception: ImageCaptureException) {
                    Log.e(TAG, "Photo capture failed: ${exception.message}", exception)
                    Toast.makeText(this@FaceVerificationActivity, "Photo capture failed", Toast.LENGTH_SHORT).show()
                }

                override fun onImageSaved(output: ImageCapture.OutputFileResults) {
                    Log.d(TAG, "Photo capture succeeded: ${output.savedUri}")
                    Toast.makeText(this@FaceVerificationActivity, "Photo captured! Verifying...", Toast.LENGTH_SHORT).show()

                    // Send image to API for verification
                    sendImageToAPI(photoFile)
                }
            }
        )
    }

    private fun sendImageToAPI(imageFile: File) {
        // Disable capture button during verification
        captureButton.isEnabled = false
        captureButton.text = "Verifying..."

        // Create request body for multipart upload
        val requestFile = imageFile.asRequestBody("image/jpeg".toMediaTypeOrNull())
        val body = MultipartBody.Part.createFormData("file", imageFile.name, requestFile)

        ApiClient.instance().verifyFace(challengeId, body).enqueue(object : retrofit2.Callback<VerifyFaceResponse> {
            override fun onResponse(
                call: retrofit2.Call<VerifyFaceResponse>,
                response: retrofit2.Response<VerifyFaceResponse>
            ) {
                captureButton.isEnabled = true
                captureButton.text = "Capture Face"

                if (response.isSuccessful && response.body() != null) {
                    val verificationResult = response.body()!!

                    if (response.code() == 200) {
                        // Verification successful
                        Toast.makeText(this@FaceVerificationActivity,
                            "Face verified successfully! Welcome ${verificationResult.verified_user}",
                            Toast.LENGTH_LONG).show()

                        // Go to MainActivity
                        val intent = Intent(this@FaceVerificationActivity, MainActivity::class.java)
                        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
                        startActivity(intent)
                        finish()
                    } else {
                        // Verification failed
                        Toast.makeText(this@FaceVerificationActivity,
                            "Face verification failed. Please try again.",
                            Toast.LENGTH_LONG).show()
                    }
                } else {
                    Toast.makeText(this@FaceVerificationActivity,
                        "Verification failed. Please try again.",
                        Toast.LENGTH_SHORT).show()
                }

                // Clean up image file
                imageFile.delete()
            }

            override fun onFailure(call: retrofit2.Call<VerifyFaceResponse>, t: Throwable) {
                captureButton.isEnabled = true
                captureButton.text = "Capture Face"

                Log.e(TAG, "API call failed: ${t.message}", t)
                Toast.makeText(this@FaceVerificationActivity,
                    "Network error: ${t.message}",
                    Toast.LENGTH_SHORT).show()

                // Clean up image file
                imageFile.delete()
            }
        })
    }

    private fun startCamera() {
        val cameraProviderFuture = ProcessCameraProvider.getInstance(this)

        cameraProviderFuture.addListener({
            // Used to bind the lifecycle of cameras to the lifecycle owner
            val cameraProvider: ProcessCameraProvider = cameraProviderFuture.get()

            // Preview
            val preview = Preview.Builder()
                .build()
                .also {
                    it.setSurfaceProvider(viewFinder.surfaceProvider)
                }

            imageCapture = ImageCapture.Builder().build()

            // Select front camera as a default
            val cameraSelector = CameraSelector.DEFAULT_FRONT_CAMERA

            try {
                // Unbind use cases before rebinding
                cameraProvider.unbindAll()

                // Bind use cases to camera
                cameraProvider.bindToLifecycle(
                    this, cameraSelector, preview, imageCapture
                )

            } catch (exc: Exception) {
                Log.e(TAG, "Use case binding failed", exc)
            }

        }, ContextCompat.getMainExecutor(this))
    }

    private fun allPermissionsGranted() = REQUIRED_PERMISSIONS.all {
        ContextCompat.checkSelfPermission(baseContext, it) == PackageManager.PERMISSION_GRANTED
    }

    override fun onRequestPermissionsResult(
        requestCode: Int, permissions: Array<String>, grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == REQUEST_CODE_PERMISSIONS) {
            if (allPermissionsGranted()) {
                startCamera()
            } else {
                Toast.makeText(this, "Permissions not granted by the user.", Toast.LENGTH_SHORT).show()
                finish()
            }
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        cameraExecutor.shutdown()
    }
}