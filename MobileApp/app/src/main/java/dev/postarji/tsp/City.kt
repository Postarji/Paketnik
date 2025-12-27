package dev.postarji.tsp

// Object ko hold-a data za location
data class City(
    // Index uporabljen za identificiratnje mesta, neke vrste ID
    val index: Int,
    // Koordinate mesta
    val x: Double,
    val y: Double
) {
    // Pitagorov izrek za razdaljo med mestoma
    fun distanceTo(other: City): Double {
        val dx = this.x - other.x
        val dy = this.y - other.y
        return kotlin.math.sqrt(dx * dx + dy * dy)
    }
}