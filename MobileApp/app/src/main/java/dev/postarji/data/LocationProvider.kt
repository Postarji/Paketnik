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

    private val BATCH_SIZE = 70

    suspend fun createRealWorldTSP(useTimeOptimization: Boolean, selectedCities: List<City>): TSP = withContext(Dispatchers.IO) {
        val tsp = TSP(context)

        val allCities = selectedCities
        tsp.cities.clear()
        tsp.cities.addAll(allCities)

        tsp.name = "Direct4Me Real World (Full 126 Locations)"
        tsp.dimension = allCities.size

        Log.d("RealWorld", "Fetching Matrix for ${allCities.size} cities using BATCHING...")

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
            Log.e("RealWorld", "Batching failed. Switching to Synthetic Fallback.")
            tsp.edgeWeightType = "EXPLICIT"
            tsp.edgeWeightFormat = "FULL_MATRIX"
            tsp.weights = generateSyntheticAsymmetricMatrix(allCities)
        }

        tsp
    }

    private fun fetchBatchedDistanceMatrix(cities: List<City>): DistanceMatrixResult? {
        val n = cities.size
        val finalDistM = Array(n) { DoubleArray(n) }
        val finalDurM = Array(n) { DoubleArray(n) }
        val client = OkHttpClient()

        for (startIndex in 0 until n step BATCH_SIZE) {
            val endIndex = kotlin.math.min(startIndex + BATCH_SIZE, n)
            val batchSourceIndices = (startIndex until endIndex).toList()

            Log.d("RealWorld", "Fetching batch rows $startIndex to ${endIndex - 1}...")

            val allCoords = cities.joinToString(";") { "${it.x},${it.y}" }
            val sourcesParam = batchSourceIndices.joinToString(";")

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

                    for (i in 0 until (endIndex - startIndex)) {
                        val matrixRowIndex = startIndex + i

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

//            Thread.sleep(100)
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
                    val base = cities[i].distanceTo(cities[j]) * 1300
                    matrix[i][j] = base * random.nextDouble(0.9, 1.1)
                }
            }
        }
        return matrix
    }


    fun loadCitiesFromCsvCoords(fileName: String): List<City> {
        val cities = mutableListOf<City>()
        var currentId = 1

        val csvRegex = ",(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)".toRegex()

        try {
            context.assets.open(fileName).bufferedReader().useLines { lines ->
                lines.drop(1).forEach { line ->
                    val tokens = line.split(csvRegex)

                    if (tokens.size >= 7) {
                        val cityName = tokens[0].replace("\"", "").trim()
                        val address = tokens[1].replace("\"", "").trim()

                        val lat = tokens[5].toDoubleOrNull() ?: 0.0
                        val lon = tokens[6].toDoubleOrNull() ?: 0.0

                        if (lat != 0.0 && lon != 0.0) {
                            cities.add(City(currentId++, lon, lat, cityName, address))
                        }
                    }
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }

        return cities
    }
}