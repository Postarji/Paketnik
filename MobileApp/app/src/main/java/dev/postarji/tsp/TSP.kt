package dev.postarji.tsp

import android.content.Context
import java.io.BufferedReader
import java.io.InputStreamReader
import kotlin.math.sqrt

// Class prebere .tsp files in je naš "map manager"
class TSP(private val context: Context) {
    var name: String = ""
    var dimension: Int = 0 // Število mest
    var edgeWeightType: String = "" // Is it GPS coordinates (EUC_2D) or a distance table (EXPLICIT)?
    var edgeWeightFormat: String = "" // If it's a table, is it a FULL_MATRIX?

    val cities = ArrayList<City>()
    var weights: Array<DoubleArray>? = null // This holds the distance table if we are using EXPLICIT mode

    [cite_start]// Opens a .tsp file from the assets folder and reads it line by line [cite: 18, 19]
    fun loadData(filename: String) {
        cities.clear()
        weights = null

        try {
            val inputStream = context.assets.open(filename)
            val reader = BufferedReader(InputStreamReader(inputStream))

            var line: String?
            var section = "HEADER" // We start reading the top info section

            while (reader.readLine().also { line = it } != null) {
                val cleanLine = line!!.trim()
                if (cleanLine == "EOF") break // Stop at End Of File
                if (cleanLine.isEmpty()) continue

                // Switch modes when we hit a section header
                if (cleanLine == "NODE_COORD_SECTION") {
                    section = "NODES"
                    continue
                }
                if (cleanLine == "EDGE_WEIGHT_SECTION") {
                    section = "WEIGHTS"
                    continue
                }

                // Parse the Header info (Name, Type, Size)
                if (section == "HEADER") {
                    if (cleanLine.startsWith("NAME")) name = cleanLine.split(":")[1].trim()
                    if (cleanLine.startsWith("DIMENSION")) dimension = cleanLine.split(":")[1].trim().toInt()
                    if (cleanLine.startsWith("EDGE_WEIGHT_TYPE")) edgeWeightType = cleanLine.split(":")[1].trim()
                    if (cleanLine.startsWith("EDGE_WEIGHT_FORMAT")) edgeWeightFormat = cleanLine.split(":")[1].trim()
                }
                // Parse the City Coordinates (EUC_2D mode)
                else if (section == "NODES") {
                    // Line looks like: "1 25.0 10.0" (Index X Y)
                    val parts = cleanLine.split("\\s+".toRegex()).filter { it.isNotEmpty() }
                    if (parts.size >= 3) {
                        val index = parts[0].toInt()
                        val x = parts[1].toDouble()
                        val y = parts[2].toDouble()
                        cities.add(City(index, x, y))
                    }
                }
                // Note: We skip reading weights here because matrix data is messy to read line-by-line.
                // We handle it in 'loadMatrixData' below.
            }

            // If this is a Matrix file (table of distances), use the special reader
            if (edgeWeightType == "EXPLICIT" && edgeWeightFormat == "FULL_MATRIX") {
                loadMatrixData(filename)
            }

            reader.close()
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    [cite_start]// Helper to read the big table of numbers for matrix problems (like bays29.tsp) [cite: 24]
    private fun loadMatrixData(filename: String) {
        val inputStream = context.assets.open(filename)
        val scanner = java.util.Scanner(inputStream) // Scanner is better for reading numbers one by one

        var inWeights = false
        var count = 0
        weights = Array(dimension) { DoubleArray(dimension) } // Create empty grid

        // Create fake cities because matrix files don't give coordinates, just IDs
        cities.clear()
        for (i in 1..dimension) {
            cities.add(City(i, 0.0, 0.0))
        }

        while (scanner.hasNext()) {
            val token = scanner.next()
            if (token == "EDGE_WEIGHT_SECTION") {
                inWeights = true
                continue
            }
            if (token == "EOF") break

            if (inWeights) {
                // Read the next number and put it in the grid
                try {
                    val value = token.toDouble()
                    val row = count / dimension
                    val col = count % dimension
                    if (row < dimension) {
                        weights!![row][col] = value
                    }
                    count++
                } catch (e: NumberFormatException) {
                    // Skip weird text that isn't a number
                }
            }
        }
        scanner.close()
    }

    [cite_start]// Calculates the total length of a tour (Solution) [cite: 16]
    fun calculateDistance(tour: Tour): Double {
        var dist = 0.0
        // Sum distance from city A -> B -> C...
        for (i in 0 until tour.cities.size - 1) {
            dist += getDistance(tour.cities[i], tour.cities[i+1])
        }
        // Add distance from Last City -> First City (Closing the loop)
        dist += getDistance(tour.cities.last(), tour.cities.first())

        tour.distance = dist
        return dist
    }

    // Gets the distance between two specific cities
    private fun getDistance(c1: City, c2: City): Double {
        return if (edgeWeightType == "EXPLICIT") {
            // Case 1: Matrix mode. Just look up the value in the table.
            val i = c1.index - 1
            val j = c2.index - 1
            weights!![i][j]
        } else {
            // Case 2: Coordinate mode (EUC_2D). [cite_start]Calculate math distance. [cite: 25]
            val dx = c1.x - c2.x
            val dy = c1.y - c2.y
            sqrt(dx * dx + dy * dy)
        }
    }
}