package dev.postarji.tsp

class GeneticAlgorithm(private val tsp: TSP) {

    // Parameters from instructions [cite: 37-41]
    private var populationSize = 100
    private var mutationRate = 0.1
    private var crossoverRate = 0.8
    private var elitism = true // Keep the best one
    private var tournamentSize = 5 // Common default, can be tweaked

    private var population = ArrayList<Tour>()

    // Run the algorithm
    // maxEvaluations = 1000 * number of cities [cite: 38]
    fun run(): Tour {
        // 1. Initialize Population
        population.clear()
        for (i in 0 until populationSize) {
            val t = Tour()
            t.generateIndividual(tsp.cities)
            tsp.calculateDistance(t) // Calculate how good it is
            population.add(t)
        }

        // Find initial best
        var bestTour = population.minByOrNull { it.distance } ?: Tour()
        var evaluations = populationSize

        val maxEvaluations = 1000 * tsp.dimension

        // 2. Main Loop
        while (evaluations < maxEvaluations) {
            val newPopulation = ArrayList<Tour>()

            // Elitism: Keep the absolute best one from previous generation
            if (elitism) {
                newPopulation.add(Tour(bestTour))
            }

            // Fill the rest of the new population
            while (newPopulation.size < populationSize) {
                // A. Selection
                val parent1 = tournamentSelection()
                val parent2 = tournamentSelection()

                // B. Crossover
                var child = if (RandomUtils.checkProbability(crossoverRate)) {
                    pmxCrossover(parent1, parent2)
                } else {
                    Tour(parent1) // Just copy if no crossover
                }

                // C. Mutation
                if (RandomUtils.checkProbability(mutationRate)) {
                    swapMutation(child)
                }

                // Calculate fitness (distance) for the new child
                tsp.calculateDistance(child)
                evaluations++

                newPopulation.add(child)
            }

            // Replace old population
            population = newPopulation

            // Update Best Tour
            val currentBest = population.minByOrNull { it.distance }
            if (currentBest != null && currentBest.distance < bestTour.distance) {
                bestTour = Tour(currentBest) // Save a copy
            }
        }

        return bestTour
    }

    // --- OPERATORS ---

    // 1. Tournament Selection
    // Pick k random individuals, return the best one.
    private fun tournamentSelection(): Tour {
        val tournament = ArrayList<Tour>()
        for (i in 0 until tournamentSize) {
            val randomId = RandomUtils.nextInt(populationSize)
            tournament.add(population[randomId])
        }
        // Return the one with the smallest distance
        return tournament.minByOrNull { it.distance }!!
    }

    // 2. Swap Mutation
    // Swap two random cities in the tour.
    private fun swapMutation(tour: Tour) {
        val pos1 = RandomUtils.nextInt(tour.cities.size)
        val pos2 = RandomUtils.nextInt(tour.cities.size)

        val city1 = tour.cities[pos1]
        val city2 = tour.cities[pos2]

        tour.cities[pos1] = city2
        tour.cities[pos2] = city1
    }

    // 3. PMX Crossover (Partially Mapped Crossover)
    // This is complex. It swaps a segment and then fixes duplicates.
    private fun pmxCrossover(parent1: Tour, parent2: Tour): Tour {
        val child = Tour(parent1) // Start with copy of parent 1
        val size = child.cities.size

        // Pick two random cut points
        val point1 = RandomUtils.nextInt(size)
        val point2 = RandomUtils.nextInt(size)

        val start = kotlin.math.min(point1, point2)
        val end = kotlin.math.max(point1, point2)

        // 1. Copy the segment from Parent 2 to Child
        for (i in start..end) {
            val cityFromP2 = parent2.cities[i]
            val cityAtPos = child.cities[i]

            // If the city is already the same, skip
            if (cityFromP2.index == cityAtPos.index) continue

            // We need to swap to insert cityFromP2 here.
            // But we can't just overwrite, we must find where cityFromP2 is currently inside Child
            // and swap it into position i.

            // Find where cityFromP2 is in the current child
            var indexInChild = -1
            for (k in 0 until size) {
                if (child.cities[k].index == cityFromP2.index) {
                    indexInChild = k
                    break
                }
            }

            // Swap
            val temp = child.cities[i]
            child.cities[i] = child.cities[indexInChild]
            child.cities[indexInChild] = temp
        }

        return child
    }
}