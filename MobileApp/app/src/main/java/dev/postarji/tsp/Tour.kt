package dev.postarji.tsp

import java.util.Collections

class Tour {
    // Student 3: This is the final list of cities you need to draw on the map in this order.
    val cities: ArrayList<City> = ArrayList()
    var distance: Double = 0.0

    constructor()

    constructor(cities: List<City>) {
        this.cities.addAll(cities)
    }

    constructor(other: Tour) {
        this.cities.addAll(other.cities)
        this.distance = other.distance
    }

    fun generateIndividual(allCities: List<City>) {
        cities.clear()
        cities.addAll(allCities)
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