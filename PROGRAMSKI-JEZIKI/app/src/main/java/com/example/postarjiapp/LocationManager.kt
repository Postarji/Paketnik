package com.example.postarjiapp

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.location.Address
import android.location.Geocoder
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.os.Bundle
import android.util.Log
import androidx.core.app.ActivityCompat
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.util.Locale

class LocationHelper private constructor() {
    companion object {
        private const val TAG = "LocationHelper"

        fun getCurrentLocation(
            context: Context,
            callback: (latitude: Double?, longitude: Double?, accuracy: Float?, address: String?) -> Unit
        ) {
            // Check if location permissions are granted
            if (ActivityCompat.checkSelfPermission(
                    context,
                    Manifest.permission.ACCESS_FINE_LOCATION
                ) != PackageManager.PERMISSION_GRANTED &&
                ActivityCompat.checkSelfPermission(
                    context,
                    Manifest.permission.ACCESS_COARSE_LOCATION
                ) != PackageManager.PERMISSION_GRANTED
            ) {
                Log.w(TAG, "Location permissions not granted")
                callback(null, null, null, null)
                return
            }

            val locationManager = context.getSystemService(Context.LOCATION_SERVICE) as LocationManager

            // Check if GPS is enabled
            if (!locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER) &&
                !locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)) {
                Log.w(TAG, "No location providers enabled")
                callback(null, null, null, null)
                return
            }

            // Try to get last known location first
            val lastKnownLocation = getLastKnownLocation(context, locationManager)
            if (lastKnownLocation != null) {
                Log.d(TAG, "Using last known location")
                getAddressFromLocation(context, lastKnownLocation.latitude, lastKnownLocation.longitude) { address ->
                    callback(lastKnownLocation.latitude, lastKnownLocation.longitude, lastKnownLocation.accuracy, address)
                }
                return
            }

            // Request single location update
            val locationListener = object : LocationListener {
                override fun onLocationChanged(location: Location) {
                    Log.d(TAG, "New location received: ${location.latitude}, ${location.longitude}")
                    locationManager.removeUpdates(this)

                    getAddressFromLocation(context, location.latitude, location.longitude) { address ->
                        callback(location.latitude, location.longitude, location.accuracy, address)
                    }
                }

                override fun onStatusChanged(provider: String?, status: Int, extras: Bundle?) {}
                override fun onProviderEnabled(provider: String) {}
                override fun onProviderDisabled(provider: String) {}
            }

            try {
                // Request location from both GPS and Network providers
                if (locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER)) {
                    locationManager.requestSingleUpdate(LocationManager.GPS_PROVIDER, locationListener, null)
                }
                if (locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)) {
                    locationManager.requestSingleUpdate(LocationManager.NETWORK_PROVIDER, locationListener, null)
                }

                // Timeout fallback
                CoroutineScope(Dispatchers.Main).launch {
                    kotlinx.coroutines.delay(10000) // 10 second timeout
                    try {
                        locationManager.removeUpdates(locationListener)
                        Log.w(TAG, "Location request timed out")
                        callback(null, null, null, null)
                    } catch (e: Exception) {
                        // Listener might already be removed
                    }
                }
            } catch (e: SecurityException) {
                Log.e(TAG, "Security exception: ${e.message}")
                callback(null, null, null, null)
            }
        }

        private fun getLastKnownLocation(context: Context, locationManager: LocationManager): Location? {
            if (ActivityCompat.checkSelfPermission(
                    context,
                    Manifest.permission.ACCESS_FINE_LOCATION
                ) != PackageManager.PERMISSION_GRANTED &&
                ActivityCompat.checkSelfPermission(
                    context,
                    Manifest.permission.ACCESS_COARSE_LOCATION
                ) != PackageManager.PERMISSION_GRANTED
            ) {
                return null
            }

            val providers = listOf(LocationManager.GPS_PROVIDER, LocationManager.NETWORK_PROVIDER)
            var bestLocation: Location? = null

            for (provider in providers) {
                try {
                    val location = locationManager.getLastKnownLocation(provider)
                    if (location != null) {
                        if (bestLocation == null || location.accuracy < bestLocation.accuracy) {
                            bestLocation = location
                        }
                    }
                } catch (e: Exception) {
                    Log.w(TAG, "Error getting last known location from $provider: ${e.message}")
                }
            }

            return bestLocation
        }

        private fun getAddressFromLocation(
            context: Context,
            latitude: Double,
            longitude: Double,
            callback: (String?) -> Unit
        ) {
            CoroutineScope(Dispatchers.IO).launch {
                try {
                    val geocoder = Geocoder(context, Locale.getDefault())
                    val addresses: List<Address>? = geocoder.getFromLocation(latitude, longitude, 1)

                    val address = if (!addresses.isNullOrEmpty()) {
                        val addr = addresses[0]
                        buildString {
                            if (!addr.thoroughfare.isNullOrEmpty()) {
                                append(addr.thoroughfare)
                            }
                            if (!addr.locality.isNullOrEmpty()) {
                                if (isNotEmpty()) append(", ")
                                append(addr.locality)
                            }
                            if (!addr.countryName.isNullOrEmpty()) {
                                if (isNotEmpty()) append(", ")
                                append(addr.countryName)
                            }
                        }.takeIf { it.isNotEmpty() }
                    } else null

                    withContext(Dispatchers.Main) {
                        callback(address)
                    }
                } catch (e: Exception) {
                    Log.e(TAG, "Error getting address: ${e.message}")
                    withContext(Dispatchers.Main) {
                        callback(null)
                    }
                }
            }
        }
    }
}