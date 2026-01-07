package dev.postarji.tsp

import java.util.Random


object RandomUtils {

    private var seed: Long = 123
    private val random = Random(seed)

    fun setSeed(newSeed: Long) {
        seed = newSeed
        random.setSeed(seed)
    }

    fun setSeedFromTime() {
        seed = System.currentTimeMillis()
        random.setSeed(seed)
    }

    fun getSeed(): Long {
        return seed
    }

    fun nextDouble(): Double {
        return random.nextDouble()
    }

    fun nextInt(upperBound: Int): Int {
        return random.nextInt(upperBound)
    }

    fun nextInt(lowerBound: Int, upperBound: Int): Int {
        return lowerBound + random.nextInt(upperBound - lowerBound)
    }

    fun checkProbability(probability: Double): Boolean {
        return nextDouble() < probability
    }
}