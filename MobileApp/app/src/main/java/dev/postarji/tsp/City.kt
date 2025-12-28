package dev.postarji.tsp

data class City(
    val index: Int,
    val x: Double,
    val y: Double
) {
    fun distanceTo(other: City): Double {
        val dx = this.x - other.x
        val dy = this.y - other.y
        return kotlin.math.sqrt(dx * dx + dy * dy)
    }
}