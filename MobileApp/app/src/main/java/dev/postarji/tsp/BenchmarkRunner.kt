package dev.postarji.tsp

import android.content.Context
import android.util.Log
import java.io.File
import java.io.FileOutputStream
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class BenchmarkRunner(private val context: Context) {

    private val files = listOf(
        "bays29.tsp",
        "eil101.tsp",
        "a280.tsp",
        "pr1002.tsp",
        "dca1389.tsp"
    )

    private val teamName = "Postarji"

    suspend fun runAllBenchmarks() = withContext(Dispatchers.IO) {
        for (filename in files) {
            runSingleBenchmark(filename)
        }
    }

    private fun runSingleBenchmark(filename: String) {
        Log.d("Benchmark", "Starting benchmark for $filename...")

        val tsp = TSP(context)
        tsp.loadData(filename)

        val ga = GeneticAlgorithm(tsp)
        val results = ArrayList<Double>()
        var bestTourEver: Tour? = null

        for (i in 0 until 30) {
            RandomUtils.setSeedFromTime()
            val bestTour = ga.run()
            results.add(bestTour.distance)

            if (bestTourEver == null || bestTour.distance < bestTourEver!!.distance) {
                bestTourEver = bestTour
            }

            if (i % 5 == 0) Log.d("Benchmark", "$filename Run $i/30: ${bestTour.distance}")
        }

        saveRawResults(filename, results)

        if (bestTourEver != null) {
            saveBestSolution(filename, bestTourEver)
        }
    }

    private fun saveRawResults(originalFilename: String, results: List<Double>) {
        val nameWithoutExt = originalFilename.replace(".tsp", "")
        val outputName = "${teamName}_${nameWithoutExt}.txt"

        val sb = StringBuilder()
        for (score in results) {
            sb.append("$score\n")
        }

        try {
            val file = File(context.filesDir, outputName)
            val fos = FileOutputStream(file)
            fos.write(sb.toString().toByteArray())
            fos.close()
            Log.i("Benchmark", "SAVED RAW: ${file.absolutePath}")
        } catch (e: Exception) {
            Log.e("Benchmark", "Failed to save raw file", e)
        }
    }

    private fun saveBestSolution(originalFilename: String, bestTour: Tour) {
        val nameWithoutExt = originalFilename.replace(".tsp", "")
        val outputName = "${teamName}_${nameWithoutExt}_SOLUTION.txt"

        val sb = StringBuilder()
        sb.append("Best Distance: ${bestTour.distance}\n")
        sb.append("Tour Sequence:\n")
        sb.append(bestTour.cities.joinToString(" ") { it.index.toString() })

        try {
            val file = File(context.filesDir, outputName)
            val fos = FileOutputStream(file)
            fos.write(sb.toString().toByteArray())
            fos.close()
        } catch (e: Exception) {
            Log.e("Benchmark", "Failed to save solution file", e)
        }
    }
}