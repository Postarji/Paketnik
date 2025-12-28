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

class DistanceMatrixResult(
    val distanceMatrix: Array<DoubleArray>,
    val durationMatrix: Array<DoubleArray>
)

class LocationProvider(private val context: Context) {

    // 1. Metoda za Študenta 3 (da napolni RecyclerView)
    fun getAllCityNames(): List<String> {
        val cities = loadCitiesFromCsv("direct4meLocations.csv")
        return cities.map { it.name }
    }

    suspend fun createRealWorldTSP(useTimeOptimization: Boolean): TSP = withContext(Dispatchers.IO) {
        val tsp = TSP(context)

        val csvCities = loadCitiesFromCsv("direct4meLocations.csv")

        val matrixResult = fetchDistanceMatrix(csvCities)

        tsp.name = "Direct4Me Real World"
        tsp.dimension = csvCities.size
        tsp.edgeWeightType = "EXPLICIT"
        tsp.edgeWeightFormat = "FULL_MATRIX"

        tsp.cities.clear()
        tsp.cities.addAll(csvCities)

        if (matrixResult != null) {
            tsp.weights = if (useTimeOptimization) {
                matrixResult.durationMatrix
            } else {
                matrixResult.distanceMatrix
            }
        }

        tsp
    }

    fun loadCitiesFromCsv(fileName: String): List<City> {
        val cities = mutableListOf<City>()
        var currentId = 1

        try {
            context.assets.open(fileName).bufferedReader().useLines { lines ->
                lines.drop(1).forEach { line ->
                    val tokens = line.split(",(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)".toRegex())
                    if (tokens.size >= 5) {
                        val cityName = tokens[0].replace("\"", "").trim()
                        val address = tokens[1].replace("\"", "").trim()
                        val postCode = tokens[4].replace("\"", "").trim()
                        val fullAddress = "$address, $postCode $cityName, Slovenia"

                        val coords = getCoordinatesFromAddress(fullAddress)

                        cities.add(City(
                            index = currentId++,
                            x = coords?.longitude ?: 0.0,
                            y = coords?.latitude ?: 0.0,
                            name = cityName,
                            address = address
                        ))
                    }
                }
            }
        } catch (e: Exception) { e.printStackTrace() }
        return cities
    }

    private fun getCoordinatesFromAddress(fullAddress: String): GeoPoint? {
        return try {
            val geocoder = Geocoder(context, Locale.getDefault())
            val addresses = geocoder.getFromLocationName(fullAddress, 1)
            if (!addresses.isNullOrEmpty()) {
                GeoPoint(addresses[0].latitude, addresses[0].longitude)
            } else null
        } catch (e: Exception) { null }
    }

    fun fetchDistanceMatrix(cities: List<City>): DistanceMatrixResult? {
        val client = OkHttpClient()
        val coordsString = cities.joinToString(";") { "${it.x},${it.y}" }
        val url = "https://router.project-osrm.org/table/v1/driving/$coordsString?annotations=distance,duration"

        return try {
            val request = Request.Builder().url(url).build()
            client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) return null
                val json = JSONObject(response.body?.string() ?: "")
                val dists = json.getJSONArray("distances")
                val durs = json.getJSONArray("durations")

                val n = cities.size
                val distM = Array(n) { DoubleArray(n) }
                val durM = Array(n) { DoubleArray(n) }

                for (i in 0 until n) {
                    val dRow = dists.getJSONArray(i)
                    val tRow = durs.getJSONArray(i)
                    for (j in 0 until n) {
                        distM[i][j] = dRow.getDouble(j)
                        durM[i][j] = tRow.getDouble(j)
                    }
                }

                Log.d("TSP_MATRIX", "Razdalja od ${cities[0].name} do ${cities[1].name}: ${distM[0][1]} metrov")
                Log.d("TSP_MATRIX", "Razdalja od ${cities[1].name} do ${cities[0].name}: ${distM[1][0]} metrov")
                DistanceMatrixResult(distM, durM)
            }
        } catch (e: Exception) { null }
    }
}