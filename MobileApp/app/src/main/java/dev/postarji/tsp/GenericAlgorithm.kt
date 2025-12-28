package dev.postarji.tsp

class GeneticAlgorithm(private val tsp: TSP) {

    // Student 3: Create UI sliders/inputs to change these values before running the algorithm
    private var populationSize = 100
    private var mutationRate = 0.1
    private var crossoverRate = 0.8
    private var elitism = true
    private var tournamentSize = 5

    private var population = ArrayList<Tour>()

    // Student 3: This function runs the whole thing. Call it from a background thread!
    // It returns the final "Best Tour" that you need to draw.
    fun run(): Tour {
        population.clear()
        for (i in 0 until populationSize) {
            val t = Tour()
            t.generateIndividual(tsp.cities)
            tsp.calculateDistance(t)
            population.add(t)
        }

        var bestTour = population.minByOrNull { it.distance } ?: Tour()
        var evaluations = populationSize

        val maxEvaluations = 1000 * tsp.dimension

        while (evaluations < maxEvaluations) {
            val newPopulation = ArrayList<Tour>()

            if (elitism) {
                newPopulation.add(Tour(bestTour))
            }

            while (newPopulation.size < populationSize) {
                val parent1 = tournamentSelection()
                val parent2 = tournamentSelection()

                var child = if (RandomUtils.checkProbability(crossoverRate)) {
                    pmxCrossover(parent1, parent2)
                } else {
                    Tour(parent1)
                }

                if (RandomUtils.checkProbability(mutationRate)) {
                    swapMutation(child)
                }

                tsp.calculateDistance(child)
                evaluations++

                newPopulation.add(child)
            }

            population = newPopulation

            val currentBest = population.minByOrNull { it.distance }
            if (currentBest != null && currentBest.distance < bestTour.distance) {
                bestTour = Tour(currentBest) // Save a copy
            }
        }

        return bestTour
    }
    private fun tournamentSelection(): Tour {
        val tournament = ArrayList<Tour>()
        for (i in 0 until tournamentSize) {
            val randomId = RandomUtils.nextInt(populationSize)
            tournament.add(population[randomId])
        }
        return tournament.minByOrNull { it.distance }!!
    }

    private fun swapMutation(tour: Tour) {
        val pos1 = RandomUtils.nextInt(tour.cities.size)
        val pos2 = RandomUtils.nextInt(tour.cities.size)

        val city1 = tour.cities[pos1]
        val city2 = tour.cities[pos2]

        tour.cities[pos1] = city2
        tour.cities[pos2] = city1
    }

    private fun pmxCrossover(parent1: Tour, parent2: Tour): Tour {
        val child = Tour(parent1)
        val size = child.cities.size

        val point1 = RandomUtils.nextInt(size)
        val point2 = RandomUtils.nextInt(size)

        val start = kotlin.math.min(point1, point2)
        val end = kotlin.math.max(point1, point2)

        for (i in start..end) {
            val cityFromP2 = parent2.cities[i]
            val cityAtPos = child.cities[i]

            if (cityFromP2.index == cityAtPos.index) continue
            var indexInChild = -1
            for (k in 0 until size) {
                if (child.cities[k].index == cityFromP2.index) {
                    indexInChild = k
                    break
                }
            }

            val temp = child.cities[i]
            child.cities[i] = child.cities[indexInChild]
            child.cities[indexInChild] = temp
        }

        return child
    }
}