package dev.postarji.tsp

import java.util.Collections

class Tour {
    val cities: ArrayList<City> = ArrayList()
    var distance: Double = 0.0

    // Create an empty tour
    constructor()

    // Create a tour from a list of cities
    constructor(cities: List<City>) {
        this.cities.addAll(cities)
    }

    // Copy constructor (crucial for genetic algorithms)
    constructor(other: Tour) {
        this.cities.addAll(other.cities)
        this.distance = other.distance
    }

    // Generate a random tour (shuffle)
    fun generateIndividual(allCities: List<City>) {
        cities.clear()
        cities.addAll(allCities)
        // Shuffle using our reproducible RandomUtils
        // We implement a custom shuffle to use our RandomUtils
        for (i in cities.indices.reversed()) {
            val j = RandomUtils.nextInt(i + 1)
            val temp = cities[i]
            cities[i] = cities[j]
            cities[j] = temp
        }
    }

    // We will implement calculateDistance logic in the TSP class or here.
    // Usually, the TSP class holds the weights, so we might just store the value here.

    override fun toString(): String {
        return cities.joinToString(" -> ") { it.index.toString() }
    }
}