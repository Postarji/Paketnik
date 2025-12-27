package dev.postarji.tsp

import java.util.Random

object RandomUtils {
    private var random = Random()

    fun setSeedFromTime() {
        random = Random(System.currentTimeMillis())
    }

    fun setSeed(seed: Long) {
        random = Random(seed)
    }

    fun nextInt(bound: Int): Int {
        return random.nextInt(bound)
    }

    fun nextDouble(): Double {
        return random.nextDouble()
    }

    // Helper for probability checks
    fun checkProbability(probability: Double): Boolean {
        return random.nextDouble() < probability
    }
}