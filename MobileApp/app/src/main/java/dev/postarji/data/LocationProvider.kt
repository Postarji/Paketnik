package dev.postarji.data

import android.content.Context
import android.location.Geocoder
import android.util.Log
import dev.postarji.tsp.City
import dev.postarji.tsp.TSP
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.osmdroid.util.GeoPoint
import java.util.Locale
import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONObject
import kotlin.random.Random

class DistanceMatrixResult(
    val distanceMatrix: Array<DoubleArray>,
    val durationMatrix: Array<DoubleArray>
)

class LocationProvider(private val context: Context) {

    // Now we use ALL cities because we have a smart batching system!
    private val MAX_CITIES_TO_LOAD = 126

    // We fetch 10 rows at a time to stay under the free API limit per request
    private val BATCH_SIZE = 10

    fun getAllCityNames(): List<String> {
        val cities = loadCitiesFromCsv("direct4meLocations.csv")
        return cities.map { it.name }
    }

    suspend fun createRealWorldTSP(useTimeOptimization: Boolean): TSP = withContext(Dispatchers.IO) {
        val tsp = TSP(context)

        // 1. Load ALL Cities
        val allCities = loadCitiesFromCsv("direct4meLocations.csv")
        tsp.cities.clear()
        tsp.cities.addAll(allCities)

        tsp.name = "Direct4Me Real World (Full 126 Locations)"
        tsp.dimension = allCities.size

        // 2. Fetch Real Road Data using Smart Batching
        Log.d("RealWorld", "Fetching Matrix for ${allCities.size} cities using BATCHING...")

        // This might take ~10-15 seconds, but it gets the full data
        val matrixResult = fetchBatchedDistanceMatrix(allCities)

        if (matrixResult != null) {
            Log.d("RealWorld", "OSRM Batch Success! We have the full 126x126 matrix.")
            tsp.edgeWeightType = "EXPLICIT"
            tsp.edgeWeightFormat = "FULL_MATRIX"
            tsp.weights = if (useTimeOptimization) {
                matrixResult.durationMatrix
            } else {
                matrixResult.distanceMatrix
            }
        } else {
            // Fallback only if internet is totally dead
            Log.e("RealWorld", "Batching failed. Switching to Synthetic Fallback.")
            tsp.edgeWeightType = "EXPLICIT"
            tsp.edgeWeightFormat = "FULL_MATRIX"
            tsp.weights = generateSyntheticAsymmetricMatrix(allCities)
        }

        tsp
    }

    // --- SMART BATCHING LOGIC ---
    private fun fetchBatchedDistanceMatrix(cities: List<City>): DistanceMatrixResult? {
        val n = cities.size
        val finalDistM = Array(n) { DoubleArray(n) }
        val finalDurM = Array(n) { DoubleArray(n) }
        val client = OkHttpClient()

        // We loop through the cities in small chunks (e.g., 0..9, 10..19)
        for (startIndex in 0 until n step BATCH_SIZE) {
            val endIndex = kotlin.math.min(startIndex + BATCH_SIZE, n)
            val batchSourceIndices = (startIndex until endIndex).toList()

            // Log progress
            Log.d("RealWorld", "Fetching batch rows $startIndex to ${endIndex - 1}...")

            // 1. Build URL
            // Sources: The 10 cities in this batch
            // Destinations: ALL 126 cities (columns)
            // OSRM format: /table/v1/driving/{all_coords}?sources={batch_indices}&annotations=distance,duration

            val allCoords = cities.joinToString(";") { "${it.x},${it.y}" }
            val sourcesParam = batchSourceIndices.joinToString(";")

            // Note: We don't specify 'destinations' param, which means "all" by default, which is what we want.
            // But we MUST specify 'sources' to limit the computation complexity.
            val url = "https://router.project-osrm.org/table/v1/driving/$allCoords?sources=$sourcesParam&annotations=distance,duration"

            try {
                val request = Request.Builder().url(url).build()
                client.newCall(request).execute().use { response ->
                    if (!response.isSuccessful) {
                        Log.e("RealWorld", "Batch failed: HTTP ${response.code}")
                        return null
                    }
                    val json = JSONObject(response.body?.string() ?: "")

                    if (!json.has("distances")) return null

                    val dists = json.getJSONArray("distances")
                    val durs = json.getJSONArray("durations")

                    // 2. Fill the big matrix with this small chunk
                    for (i in 0 until (endIndex - startIndex)) {
                        val matrixRowIndex = startIndex + i // Where this goes in the big matrix

                        val dRow = dists.getJSONArray(i)
                        val tRow = durs.getJSONArray(i)

                        for (col in 0 until n) {
                            finalDistM[matrixRowIndex][col] = dRow.getDouble(col)
                            finalDurM[matrixRowIndex][col] = tRow.getDouble(col)
                        }
                    }
                }
            } catch (e: Exception) {
                Log.e("RealWorld", "Batch error: ${e.message}")
                return null
            }

            // Sleep slightly to be nice to the free server
            Thread.sleep(100)
        }

        return DistanceMatrixResult(finalDistM, finalDurM)
    }

    private fun generateSyntheticAsymmetricMatrix(cities: List<City>): Array<DoubleArray> {
        val n = cities.size
        val matrix = Array(n) { DoubleArray(n) }
        val random = Random(12345)
        for (i in 0 until n) {
            for (j in 0 until n) {
                if (i == j) matrix[i][j] = 0.0
                else {
                    val base = cities[i].distanceTo(cities[j]) * 1300 // rough meters
                    matrix[i][j] = base * random.nextDouble(0.9, 1.1)
                }
            }
        }
        return matrix
    }

    private fun loadCitiesFromCsv(fileName: String): List<City> {
        val cities = mutableListOf<City>()
        var currentId = 1
        try {
            context.assets.open(fileName).bufferedReader().useLines { lines ->
                lines.drop(1).forEach { line ->
                    val tokens = line.split(",(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)".toRegex())
                    if (tokens.size >= 5) {
                        val cityName = tokens[0].replace("\"", "").trim()
                        val address = tokens[1].replace("\"", "").trim()
                        val fullAddress = "$cityName, Slovenia" // Simplified for speed
                        val coords = getCoordinatesFromAddress(fullAddress)
                        if (coords != null) {
                            cities.add(City(currentId++, coords.longitude, coords.latitude, cityName, address))
                        }
                    }
                }
            }
        } catch (e: Exception) { e.printStackTrace() }
        return cities
    }

    private fun getCoordinatesFromAddress(fullAddress: String): GeoPoint? {
        return try {
            val geocoder = Geocoder(context, Locale.getDefault())
            val addressList = geocoder.getFromLocationName(fullAddress, 1)
            if (!addressList.isNullOrEmpty()) {
                GeoPoint(addressList[0].latitude, addressList[0].longitude)
            } else null
        } catch (e: Exception) { null }
    }
}