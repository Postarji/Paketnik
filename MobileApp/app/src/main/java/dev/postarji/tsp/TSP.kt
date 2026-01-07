package dev.postarji.tsp

import android.content.Context
import java.io.BufferedReader
import java.io.InputStreamReader
import kotlin.math.sqrt

class TSP(private val context: Context) {
    var name: String = ""
    var dimension: Int = 0
    var edgeWeightType: String = "" // EUC_2D, EXPLICIT
    var edgeWeightFormat: String = "" // Matix shape

    val cities = ArrayList<City>()

    var weights: Array<DoubleArray>? = null

    fun loadData(filename: String) {
        cities.clear()
        weights = null

        try {
            val inputStream = context.assets.open(filename)
            val reader = BufferedReader(InputStreamReader(inputStream))

            var line: String?
            var section = "HEADER"

            while (reader.readLine().also { line = it } != null) {
                val cleanLine = line!!.trim()
                if (cleanLine == "EOF") break
                if (cleanLine.isEmpty()) continue

                if (cleanLine == "NODE_COORD_SECTION") {
                    section = "NODES"
                    continue
                }
                if (cleanLine == "EDGE_WEIGHT_SECTION") {
                    section = "WEIGHTS"
                    continue
                }
                if (cleanLine == "DISPLAY_DATA_SECTION") {
                    section = "DISPLAY"
                    continue
                }

                if (section == "HEADER") {
                    if (cleanLine.startsWith("NAME")) name = cleanLine.split(":")[1].trim()
                    if (cleanLine.startsWith("DIMENSION")) dimension = cleanLine.split(":")[1].trim().toInt()
                    if (cleanLine.startsWith("EDGE_WEIGHT_TYPE")) edgeWeightType = cleanLine.split(":")[1].trim()
                    if (cleanLine.startsWith("EDGE_WEIGHT_FORMAT")) edgeWeightFormat = cleanLine.split(":")[1].trim()
                }
                else if (section == "NODES") {
                    val parts = cleanLine.split("\\s+".toRegex()).filter { it.isNotEmpty() }
                    if (parts.size >= 3) {
                        val index = parts[0].toInt()
                        val x = parts[1].toDouble()
                        val y = parts[2].toDouble()
                        cities.add(City(index, x, y))
                    }
                }
                else if (section == "DISPLAY") {
                    val parts = cleanLine.split("\\s+".toRegex()).filter { it.isNotEmpty() }
                    if (parts.size >= 3) {
                        val index = parts[0].toInt()
                        val x = parts[1].toDouble()
                        val y = parts[2].toDouble()
                        cities.add(City(index, x, y))
                    }
                }
            }

            if (edgeWeightType == "EXPLICIT" && edgeWeightFormat == "FULL_MATRIX") {
                loadMatrixData(filename)
            }

            reader.close()
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private fun loadMatrixData(filename: String) {
        val inputStream = context.assets.open(filename)
        val scanner = java.util.Scanner(inputStream)

        var inWeights = false
        var count = 0
        weights = Array(dimension) { DoubleArray(dimension) }

        if (cities.isEmpty()) {
            for (i in 1..dimension) {
                cities.add(City(i, 0.0, 0.0))
            }
        }

        while (scanner.hasNext()) {
            val token = scanner.next()
            if (token == "EDGE_WEIGHT_SECTION") {
                inWeights = true
                continue
            }
            if (token == "EOF") break

            if (inWeights) {
                try {
                    val value = token.toDouble()
                    val row = count / dimension
                    val col = count % dimension
                    if (row < dimension) {
                        weights!![row][col] = value
                    }
                    count++
                } catch (e: NumberFormatException) {
                }
            }
        }
        scanner.close()
    }

    fun calculateDistance(tour: Tour): Double {
        var dist = 0.0
        for (i in 0 until tour.cities.size - 1) {
            dist += getDistance(tour.cities[i], tour.cities[i+1])
        }
        // Hamiltonov ciklus
        dist += getDistance(tour.cities.last(), tour.cities.first())

        tour.distance = dist
        return dist
    }

    private fun getDistance(c1: City, c2: City): Double {
        return if (edgeWeightType == "EXPLICIT") {
            val i = c1.index - 1
            val j = c2.index - 1
            weights!![i][j]
        } else {
            val dx = c1.x - c2.x
            val dy = c1.y - c2.y
            sqrt(dx * dx + dy * dy)
        }
    }
}