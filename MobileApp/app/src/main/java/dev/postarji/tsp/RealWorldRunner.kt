package dev.postarji.tsp

import android.content.Context
import android.util.Log
import dev.postarji.data.LocationProvider
import java.io.File
import java.io.FileOutputStream

class RealWorldRunner(private val context: Context) {

    suspend fun runExperiments() {
        Log.d("RealWorld", "--- STARTING 10 PARAMETER EXPERIMENTS ---")

        val provider = LocationProvider(context)
        // Optimization: Set to 'true' if you want to minimize Time, 'false' for Distance
        val allCities = provider.loadCitiesFromCsvCoords("direct4meLocations.csv")
        val tsp = provider.createRealWorldTSP(useTimeOptimization = false, allCities)

        Log.d("RealWorld", "Loaded ${tsp.dimension} cities from Direct4Me list.")

        // We define 10 different "Personalities" for the algorithm to fight against each other
        data class Config(val name: String, val pop: Int, val mut: Double, val cross: Double)

        val configs = listOf(
            Config("1. Baseline", 100, 0.1, 0.8),
            Config("2. High Mutation", 100, 0.3, 0.8),
            Config("3. Low Mutation", 100, 0.05, 0.8),
            Config("4. High Crossover", 100, 0.1, 0.95),
            Config("5. Low Crossover", 100, 0.1, 0.6),
            Config("6. Large Population", 300, 0.1, 0.8), // Slower, but smarter
            Config("7. Small Population", 50, 0.1, 0.8),  // Fast, maybe dumb
            Config("8. Chaos Mode", 200, 0.5, 0.9),       // Very random
            Config("9. Conservative", 200, 0.01, 0.8),    // Very careful
            Config("10. Balanced Large", 200, 0.15, 0.85)
        )

        // Prepare the text report
        val sb = StringBuilder()
        sb.append("Direct4.me Real World Experiment Report\n")
        sb.append("========================================\n")
        sb.append("City Count: ${tsp.dimension}\n")
        sb.append("Optimization Goal: ${if (tsp.edgeWeightFormat == "DURATION") "Time" else "Distance"}\n")
        sb.append("========================================\n\n")

        var globalBestTour: Tour? = null
        var globalBestConfig = ""

        // Run all 10
        configs.forEachIndexed { index, config ->
            Log.d("RealWorld", "Running Experiment ${index + 1}/${configs.size}: ${config.name}...")

            val ga = GeneticAlgorithm(
                tsp,
                populationSize = config.pop,
                mutationRate = config.mut,
                crossoverRate = config.cross
            )

            val startTime = System.currentTimeMillis()
            val bestTour = ga.run()
            val endTime = System.currentTimeMillis()
            val duration = (endTime - startTime) / 1000.0

            // Format result for log and file
            val resultLine = "Exp ${index + 1} [${config.name}]: Best=${bestTour.distance} | Time=${duration}s | (Pop=${config.pop}, Mut=${config.mut}, Cross=${config.cross})"
            Log.d("RealWorld", "FINISHED: $resultLine")
            sb.append(resultLine).append("\n")

            // Keep track of the winner
            if (globalBestTour == null || bestTour.distance < globalBestTour!!.distance) {
                globalBestTour = bestTour
                globalBestConfig = config.name
            }
        }

        sb.append("\n========================================\n")
        sb.append("WINNER CONFIGURATION: $globalBestConfig\n")
        sb.append("WINNING DISTANCE: ${globalBestTour?.distance}\n")
        sb.append("========================================\n")
        sb.append("Best Path Sequence (Indices):\n")
        sb.append(globalBestTour.toString())

        // Save to file so you can download it
        saveReport(sb.toString())
    }

    private fun saveReport(content: String) {
        try {
            val filename = "RealWorld_Experiments.txt"
            val file = File(context.filesDir, filename)
            val fos = FileOutputStream(file)
            fos.write(content.toByteArray())
            fos.close()
            Log.i("RealWorld", "REPORT SAVED SUCCESSFULLY TO: ${file.absolutePath}")
            Log.i("RealWorld", "Use Device File Explorer to download it!")
        } catch (e: Exception) {
            Log.e("RealWorld", "Failed to save report", e)
        }
    }
}