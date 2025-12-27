package dev.postarji.tsp

import java.util.Collections

// Seznam mest v določenem vrstmen redu (npr. 1 -> 5 -> 3 -> 2 -> 4 (te številke so "Index" v City.kt objektu))
class Tour {
    val cities: ArrayList<City> = ArrayList()
    var distance: Double = 0.0

    // Default konstruktor
    constructor()

    // Konstruktor iz seznama mest
    constructor(cities: List<City>) {
        this.cities.addAll(cities)
    }

    // Kopirni konstruktor
    constructor(other: Tour) {
        this.cities.addAll(other.cities)
        this.distance = other.distance
    }

    // Generate a random tour (shuffle)
    fun generateIndividual(allCities: List<City>) {
        cities.clear()
        cities.addAll(allCities)
        // Shuffle uporabe reproducible RandomUtils
        // Implementiramo custom shuffle, ki uporablja RandomUtils
        for (i in cities.indices.reversed()) {
            val j = RandomUtils.nextInt(i + 1)
            val temp = cities[i]
            cities[i] = cities[j]
            cities[j] = temp
        }
    }

    override fun toString(): String {
        return cities.joinToString(" -> ") { it.index.toString() }
    }
}