package dev.postarji.tsp

// We add default values, but now we can override them when we create the class!
class GeneticAlgorithm(
    private val tsp: TSP,
    var populationSize: Int = 100,
    var mutationRate: Double = 0.1,
    var crossoverRate: Double = 0.8,
    var elitism: Boolean = true
) {

    private var population = ArrayList<Tour>()
    private var tournamentSize = 5

    fun run(): Tour {
        // 1. Initialize Population
        population.clear()
        for (i in 0 until populationSize) {
            val t = Tour()
            t.generateIndividual(tsp.cities)
            tsp.calculateDistance(t)
            population.add(t)
        }

        var bestTour = population.minByOrNull { it.distance } ?: Tour()

        // Dynamic termination: 1000 evaluations per city (as per instructions)
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
                bestTour = Tour(currentBest)
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