package dev.postarji.tsp

import android.content.Context
import android.util.Log
import java.io.File
import java.io.FileOutputStream
import java.util.Locale

class BenchmarkRunner(private val context: Context) {

    private val files = listOf(
        "bays29.tsp",
        "eil101.tsp",
        "a280.tsp",
        "pr1002.tsp",
        "dca1389.tsp"
    )

    // REPLACE "TeamName" WITH YOUR ACTUAL TEAM NAME (e.g., "Postarji")
    private val teamName = "Postarji"

    fun runAllBenchmarks() {
        Thread {
            for (filename in files) {
                runSingleBenchmark(filename)
            }
        }.start()
    }

    private fun runSingleBenchmark(filename: String) {
        Log.d("Benchmark", "Starting benchmark for $filename...")

        // Setup the TSP
        val tsp = TSP(context)
        tsp.loadData(filename)

        val ga = GeneticAlgorithm(tsp)
        val results = ArrayList<Double>()
        var bestTourEver: Tour? = null

        [cite_start]// Run 30 times [cite: 37]
        for (i in 0 until 30) {
            // We set a random seed for each run so we get different results!
            RandomUtils.setSeedFromTime()

            val bestTour = ga.run()
            results.add(bestTour.distance)

            // Keep track of the absolute best tour found across all runs
            if (bestTourEver == null || bestTour.distance < bestTourEver!!.distance) {
                bestTourEver = bestTour
            }

            Log.d("Benchmark", "Run $i for $filename: ${bestTour.distance}")
        }

        [cite_start]// Save results to file [cite: 50, 51]
        saveResultsToFile(filename, results, bestTourEver)
    }

    private fun saveResultsToFile(originalFilename: String, results: List<Double>, bestTour: Tour?) {
        [cite_start]// Output format: TeamName_filename.txt [cite: 51]
        // Example: Postarji_bays29.txt
        // We remove the ".tsp" extension for the output name
        val nameWithoutExt = originalFilename.replace(".tsp", "")
        val outputName = "${teamName}_${nameWithoutExt}.txt"

        val sb = StringBuilder()
        sb.append("Benchmark Results for $originalFilename\n")
        sb.append("Runs: 30\n")
        sb.append("----------------------------\n")

        var min = Double.MAX_VALUE
        var max = Double.MIN_VALUE
        var sum = 0.0

        for ((index, score) in results.withIndex()) {
            sb.append("Run ${index + 1}: $score\n")
            if (score < min) min = score
            if (score > max) max = score
            sum += score
        }

        val avg = sum / results.size
        sb.append("----------------------------\n")
        sb.append(String.format(Locale.US, "Min: %.2f\n", min))
        sb.append(String.format(Locale.US, "Max: %.2f\n", max))
        sb.append(String.format(Locale.US, "Avg: %.2f\n", avg))

        if (bestTour != null) {
            sb.append("\nBest Tour Sequence:\n")
            sb.append(bestTour.toString())
        }

        // Save to internal app storage
        try {
            val file = File(context.filesDir, outputName)
            val fos = FileOutputStream(file)
            fos.write(sb.toString().toByteArray())
            fos.close()
            Log.i("Benchmark", "Saved results to: ${file.absolutePath}")
        } catch (e: Exception) {
            Log.e("Benchmark", "Failed to save file", e)
        }
    }
}