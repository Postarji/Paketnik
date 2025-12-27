package dev.postarji.tsp

data class City(
    val index: Int, // 1-based index from the file usually, but we'll track 0-based internally often
    val x: Double,
    val y: Double
) {
    //Calculate Euclidean distance to another city
    fun distanceTo(other: City): Double {
        val dx = this.x - other.x
        val dy = this.y - other.y
        return kotlin.math.sqrt(dx * dx + dy * dy)
    }
}