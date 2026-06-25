package expo.modules.posedetection

import kotlin.math.PI
import kotlin.math.abs
import kotlin.math.cos
import kotlin.math.floor
import kotlin.math.max
import kotlin.math.min
import kotlin.math.roundToInt
import kotlin.math.sin
import kotlin.math.sqrt

internal const val CONSTELLATION_V2_BATCH_COUNT = 7
internal const val CONSTELLATION_V2_VIRTUAL_REGION_COUNT = 17
internal const val CONSTELLATION_V2_MAX_INFLUENCES = 2

internal enum class ConstellationV2Mode(
  val id: String,
  val requestedPointCount: Int,
  val boundaryTarget: Double,
  val structuralTarget: Double,
  val emeraldCap: Int,
) {
  V2_900("constellation-v2-900", 900, 0.34, 0.09, 10),
  V2_600("constellation-v2-600", 600, 0.36, 0.10, 8),
}

internal enum class ConstellationV2Region {
  HEAD,
  NECK,
  UPPER_TORSO,
  LOWER_TORSO,
  PELVIS,
  LEFT_UPPER_ARM,
  LEFT_FOREARM,
  LEFT_HAND,
  RIGHT_UPPER_ARM,
  RIGHT_FOREARM,
  RIGHT_HAND,
  LEFT_THIGH,
  LEFT_LOWER_LEG,
  LEFT_FOOT,
  RIGHT_THIGH,
  RIGHT_LOWER_LEG,
  RIGHT_FOOT,
}

internal enum class ConstellationV2Role {
  BOUNDARY,
  INTERIOR,
  STRUCTURAL,
}

internal enum class ConstellationV2RadiusTier {
  MICRO,
  STANDARD,
  BOUNDARY,
}

internal enum class ConstellationV2ToneRole {
  PRIMARY,
  FAR,
  ACCENT,
}

internal enum class ConstellationV2Batch(val index: Int) {
  PRIMARY_MICRO(0),
  PRIMARY_STANDARD(1),
  PRIMARY_BOUNDARY(2),
  FAR_MICRO(3),
  FAR_STANDARD(4),
  FAR_BOUNDARY(5),
  ACCENT(6),
}

internal data class ConstellationV2Point(
  val id: Int,
  val region: ConstellationV2Region,
  val localA: Double,
  val localB: Double,
  val influenceA: ConstellationV2Region,
  val influenceAWeight: Double,
  val influenceB: ConstellationV2Region?,
  val influenceBWeight: Double,
  val radiusTier: ConstellationV2RadiusTier,
  val toneRole: ConstellationV2ToneRole,
  val role: ConstellationV2Role,
  val batchIndex: Int,
)

internal data class ConstellationV2Topology(
  val mode: ConstellationV2Mode,
  val points: Array<ConstellationV2Point>,
  val buildMs: Double,
) {
  val requestedPointCount: Int = mode.requestedPointCount
  val actualPointCount: Int = points.size
  val drawBatchCount: Int = CONSTELLATION_V2_BATCH_COUNT
  val virtualRegionCount: Int = CONSTELLATION_V2_VIRTUAL_REGION_COUNT

  fun regionCount(region: ConstellationV2Region): Int {
    var count = 0
    for (point in points) {
      if (point.region == region) count += 1
    }
    return count
  }

  fun roleCount(role: ConstellationV2Role): Int {
    var count = 0
    for (point in points) {
      if (point.role == role) count += 1
    }
    return count
  }

  fun emeraldCount(): Int {
    var count = 0
    for (point in points) {
      if (point.toneRole == ConstellationV2ToneRole.ACCENT) count += 1
    }
    return count
  }
}

internal object ConstellationV2TopologyBuilder {
  private const val GOLDEN_RATIO_CONJUGATE = 0.6180339887498949
  private val cache = mutableMapOf<ConstellationV2Mode, ConstellationV2Topology>()

  fun build(mode: ConstellationV2Mode, nowMs: () -> Double = { 0.0 }): ConstellationV2Topology {
    cache[mode]?.let { return it }
    val startMs = nowMs()
    val points = ArrayList<ConstellationV2Point>(mode.requestedPointCount)
    val allocation = allocationForMode(mode)
    val emeraldAllocator = EmeraldAllocator(allocation.emeraldCount)
    var nextId = 0
    for ((region, count) in allocation.regionCounts) {
      nextId = appendRegion(points, nextId, mode, region, count, emeraldAllocator)
    }
    val topology = ConstellationV2Topology(
      mode = mode,
      points = points.toTypedArray(),
      buildMs = max(0.0, nowMs() - startMs),
    )
    cache[mode] = topology
    return topology
  }

  fun buildUncachedForTest(mode: ConstellationV2Mode): ConstellationV2Topology {
    val allocation = allocationForMode(mode)
    val emeraldAllocator = EmeraldAllocator(allocation.emeraldCount)
    val points = ArrayList<ConstellationV2Point>(mode.requestedPointCount)
    var nextId = 0
    for ((region, count) in allocation.regionCounts) {
      nextId = appendRegion(points, nextId, mode, region, count, emeraldAllocator)
    }
    return ConstellationV2Topology(mode, points.toTypedArray(), 0.0)
  }

  private fun appendRegion(
    points: MutableList<ConstellationV2Point>,
    firstId: Int,
    mode: ConstellationV2Mode,
    region: ConstellationV2Region,
    count: Int,
    emeraldAllocator: EmeraldAllocator,
  ): Int {
    if (count <= 0) return firstId
    val boundaryCount = max(0, (count * boundaryMultiplier(region, mode) * mode.boundaryTarget)
      .roundToInt()
      .coerceAtMost(count))
    val structuralCount = max(
      0,
      (count * structuralMultiplier(region) * mode.structuralTarget)
        .roundToInt()
        .coerceAtMost(count - boundaryCount),
    )
    val boundaryCutoff = boundaryCount
    val structuralCutoff = boundaryCount + structuralCount
    var nextId = firstId
    for (i in 0 until count) {
      val role = when {
        i < boundaryCutoff -> ConstellationV2Role.BOUNDARY
        i < structuralCutoff -> ConstellationV2Role.STRUCTURAL
        else -> ConstellationV2Role.INTERIOR
      }
      val roleStart = when (role) {
        ConstellationV2Role.BOUNDARY -> 0
        ConstellationV2Role.STRUCTURAL -> boundaryCutoff
        ConstellationV2Role.INTERIOR -> structuralCutoff
      }
      val roleCount = when (role) {
        ConstellationV2Role.BOUNDARY -> boundaryCount
        ConstellationV2Role.STRUCTURAL -> structuralCount
        ConstellationV2Role.INTERIOR -> count - structuralCutoff
      }.coerceAtLeast(1)
      val localIndex = if (mode == ConstellationV2Mode.V2_600) i - roleStart else i
      val localCount = if (mode == ConstellationV2Mode.V2_600) roleCount else count
      val hashIndex = nextId + region.ordinal * 997
      val local = localCoordinates(region, role, localIndex, localCount, hashIndex)
      val accent = emeraldAllocator.take(region, role)
      val radiusTier = when {
        role == ConstellationV2Role.BOUNDARY -> ConstellationV2RadiusTier.BOUNDARY
        role == ConstellationV2Role.INTERIOR && hashUnit("radius:micro", hashIndex) < 0.46 ->
          ConstellationV2RadiusTier.MICRO
        else -> ConstellationV2RadiusTier.STANDARD
      }
      val toneRole = when {
        accent -> ConstellationV2ToneRole.ACCENT
        isDeterministicFarRegion(region) -> ConstellationV2ToneRole.FAR
        else -> ConstellationV2ToneRole.PRIMARY
      }
      val batch = batchFor(toneRole, radiusTier)
      val influenceB = secondaryInfluence(region)
      val influenceBWeight = secondaryInfluenceWeight(region)
      points.add(
        ConstellationV2Point(
          id = nextId,
          region = region,
          localA = local.first,
          localB = local.second,
          influenceA = region,
          influenceAWeight = if (influenceB == null) 1.0 else 1.0 - influenceBWeight,
          influenceB = influenceB,
          influenceBWeight = influenceBWeight,
          radiusTier = radiusTier,
          toneRole = toneRole,
          role = role,
          batchIndex = batch.index,
        )
      )
      nextId += 1
    }
    return nextId
  }

  private fun localCoordinates(
    region: ConstellationV2Region,
    role: ConstellationV2Role,
    index: Int,
    count: Int,
    hashIndex: Int,
  ): Pair<Double, Double> {
    return when (region) {
      ConstellationV2Region.HEAD -> ellipseLocal(role, index, count, hashIndex, yTaper = 0.92)
      ConstellationV2Region.LEFT_HAND,
      ConstellationV2Region.RIGHT_HAND,
      ConstellationV2Region.LEFT_FOOT,
      ConstellationV2Region.RIGHT_FOOT -> ellipseLocal(role, index, count, hashIndex, yTaper = 0.7)
      else -> capsuleLocal(role, index, count, hashIndex)
    }
  }

  private fun ellipseLocal(
    role: ConstellationV2Role,
    index: Int,
    count: Int,
    hashIndex: Int,
    yTaper: Double,
  ): Pair<Double, Double> {
    if (role == ConstellationV2Role.BOUNDARY) {
      val angle = 2.0 * PI * fract(index * GOLDEN_RATIO_CONJUGATE + hashUnit("ellipse:angle", hashIndex) * 0.04)
      val radius = 0.86 + hashUnit("ellipse:edge", hashIndex) * 0.12
      return Pair(cos(angle) * radius, sin(angle) * radius * yTaper)
    }
    val angle = 2.0 * PI * fract(index * GOLDEN_RATIO_CONJUGATE + 0.19)
    val radius = sqrt((index + 0.5) / max(1.0, count.toDouble())) * 0.82
    val jitter = 0.9 + hashUnit("ellipse:jitter", hashIndex) * 0.16
    return Pair(cos(angle) * radius * jitter, sin(angle) * radius * yTaper * jitter)
  }

  private fun capsuleLocal(
    role: ConstellationV2Role,
    index: Int,
    count: Int,
    hashIndex: Int,
  ): Pair<Double, Double> {
    val tBase = (index + 0.5) / max(1.0, count.toDouble())
    val t = clamp(tBase + (hashUnit("capsule:t", hashIndex) - 0.5) * 0.055, 0.025, 0.975)
    val radial = when (role) {
      ConstellationV2Role.BOUNDARY -> {
        val side = if (hashUnit("capsule:side", hashIndex) < 0.5) -1.0 else 1.0
        side * (0.84 + hashUnit("capsule:edge", hashIndex) * 0.14)
      }
      ConstellationV2Role.STRUCTURAL ->
        (hashUnit("capsule:structural", hashIndex) - 0.5) * 0.42
      ConstellationV2Role.INTERIOR -> {
        val side = if (hashUnit("capsule:inside-side", hashIndex) < 0.5) -1.0 else 1.0
        side * sqrt(hashUnit("capsule:inside", hashIndex)) * 0.72
      }
    }
    return Pair(t, radial)
  }

  private fun batchFor(
    toneRole: ConstellationV2ToneRole,
    radiusTier: ConstellationV2RadiusTier,
  ): ConstellationV2Batch {
    if (toneRole == ConstellationV2ToneRole.ACCENT) return ConstellationV2Batch.ACCENT
    return when (toneRole) {
      ConstellationV2ToneRole.PRIMARY -> when (radiusTier) {
        ConstellationV2RadiusTier.MICRO -> ConstellationV2Batch.PRIMARY_MICRO
        ConstellationV2RadiusTier.STANDARD -> ConstellationV2Batch.PRIMARY_STANDARD
        ConstellationV2RadiusTier.BOUNDARY -> ConstellationV2Batch.PRIMARY_BOUNDARY
      }
      ConstellationV2ToneRole.FAR -> when (radiusTier) {
        ConstellationV2RadiusTier.MICRO -> ConstellationV2Batch.FAR_MICRO
        ConstellationV2RadiusTier.STANDARD -> ConstellationV2Batch.FAR_STANDARD
        ConstellationV2RadiusTier.BOUNDARY -> ConstellationV2Batch.FAR_BOUNDARY
      }
      ConstellationV2ToneRole.ACCENT -> ConstellationV2Batch.ACCENT
    }
  }
}

private data class ConstellationV2Allocation(
  val regionCounts: LinkedHashMap<ConstellationV2Region, Int>,
  val emeraldCount: Int,
)

private class EmeraldAllocator(private val cap: Int) {
  private var assigned = 0

  fun take(region: ConstellationV2Region, role: ConstellationV2Role): Boolean {
    if (assigned >= cap || role != ConstellationV2Role.STRUCTURAL) return false
    if (region != ConstellationV2Region.UPPER_TORSO && region != ConstellationV2Region.LOWER_TORSO) {
      return false
    }
    assigned += 1
    return true
  }
}

private fun allocationForMode(mode: ConstellationV2Mode): ConstellationV2Allocation {
  val map = LinkedHashMap<ConstellationV2Region, Int>()
  if (mode == ConstellationV2Mode.V2_900) {
    map[ConstellationV2Region.HEAD] = 68
    map[ConstellationV2Region.NECK] = 13
    map[ConstellationV2Region.UPPER_TORSO] = 145
    map[ConstellationV2Region.LOWER_TORSO] = 120
    map[ConstellationV2Region.PELVIS] = 72
    map[ConstellationV2Region.LEFT_UPPER_ARM] = 45
    map[ConstellationV2Region.RIGHT_UPPER_ARM] = 45
    map[ConstellationV2Region.LEFT_FOREARM] = 36
    map[ConstellationV2Region.RIGHT_FOREARM] = 36
    map[ConstellationV2Region.LEFT_HAND] = 10
    map[ConstellationV2Region.RIGHT_HAND] = 10
    map[ConstellationV2Region.LEFT_THIGH] = 75
    map[ConstellationV2Region.RIGHT_THIGH] = 75
    map[ConstellationV2Region.LEFT_LOWER_LEG] = 63
    map[ConstellationV2Region.RIGHT_LOWER_LEG] = 63
    map[ConstellationV2Region.LEFT_FOOT] = 12
    map[ConstellationV2Region.RIGHT_FOOT] = 12
  } else {
    map[ConstellationV2Region.HEAD] = 48
    map[ConstellationV2Region.NECK] = 10
    map[ConstellationV2Region.UPPER_TORSO] = 96
    map[ConstellationV2Region.LOWER_TORSO] = 82
    map[ConstellationV2Region.PELVIS] = 50
    map[ConstellationV2Region.LEFT_UPPER_ARM] = 30
    map[ConstellationV2Region.RIGHT_UPPER_ARM] = 30
    map[ConstellationV2Region.LEFT_FOREARM] = 25
    map[ConstellationV2Region.RIGHT_FOREARM] = 25
    map[ConstellationV2Region.LEFT_HAND] = 9
    map[ConstellationV2Region.RIGHT_HAND] = 9
    map[ConstellationV2Region.LEFT_THIGH] = 48
    map[ConstellationV2Region.RIGHT_THIGH] = 48
    map[ConstellationV2Region.LEFT_LOWER_LEG] = 36
    map[ConstellationV2Region.RIGHT_LOWER_LEG] = 36
    map[ConstellationV2Region.LEFT_FOOT] = 9
    map[ConstellationV2Region.RIGHT_FOOT] = 9
  }
  return ConstellationV2Allocation(map, mode.emeraldCap)
}

private fun boundaryMultiplier(region: ConstellationV2Region, mode: ConstellationV2Mode): Double {
  val distalBoost = if (mode == ConstellationV2Mode.V2_600) 1.14 else 1.08
  return when (region) {
    ConstellationV2Region.HEAD -> if (mode == ConstellationV2Mode.V2_600) 1.08 else 1.12
    ConstellationV2Region.UPPER_TORSO,
    ConstellationV2Region.LOWER_TORSO,
    ConstellationV2Region.PELVIS -> if (mode == ConstellationV2Mode.V2_600) 0.9 else 0.94
    ConstellationV2Region.LEFT_HAND,
    ConstellationV2Region.RIGHT_HAND,
    ConstellationV2Region.LEFT_FOOT,
    ConstellationV2Region.RIGHT_FOOT -> distalBoost
    else -> 1.0
  }
}

private fun structuralMultiplier(region: ConstellationV2Region): Double {
  return when (region) {
    ConstellationV2Region.UPPER_TORSO,
    ConstellationV2Region.LOWER_TORSO,
    ConstellationV2Region.PELVIS -> 1.36
    ConstellationV2Region.NECK -> 0.9
    ConstellationV2Region.LEFT_HAND,
    ConstellationV2Region.RIGHT_HAND,
    ConstellationV2Region.LEFT_FOOT,
    ConstellationV2Region.RIGHT_FOOT -> 0.45
    else -> 0.82
  }
}

private fun isDeterministicFarRegion(region: ConstellationV2Region): Boolean {
  return region == ConstellationV2Region.RIGHT_UPPER_ARM ||
    region == ConstellationV2Region.RIGHT_FOREARM ||
    region == ConstellationV2Region.RIGHT_HAND ||
    region == ConstellationV2Region.RIGHT_THIGH ||
    region == ConstellationV2Region.RIGHT_LOWER_LEG ||
    region == ConstellationV2Region.RIGHT_FOOT
}

private fun secondaryInfluence(region: ConstellationV2Region): ConstellationV2Region? {
  return when (region) {
    ConstellationV2Region.NECK -> ConstellationV2Region.UPPER_TORSO
    ConstellationV2Region.PELVIS -> ConstellationV2Region.LOWER_TORSO
    ConstellationV2Region.LEFT_UPPER_ARM,
    ConstellationV2Region.RIGHT_UPPER_ARM -> ConstellationV2Region.UPPER_TORSO
    ConstellationV2Region.LEFT_FOREARM -> ConstellationV2Region.LEFT_UPPER_ARM
    ConstellationV2Region.RIGHT_FOREARM -> ConstellationV2Region.RIGHT_UPPER_ARM
    ConstellationV2Region.LEFT_THIGH,
    ConstellationV2Region.RIGHT_THIGH -> ConstellationV2Region.PELVIS
    ConstellationV2Region.LEFT_LOWER_LEG -> ConstellationV2Region.LEFT_THIGH
    ConstellationV2Region.RIGHT_LOWER_LEG -> ConstellationV2Region.RIGHT_THIGH
    else -> null
  }
}

private fun secondaryInfluenceWeight(region: ConstellationV2Region): Double {
  return when (region) {
    ConstellationV2Region.NECK -> 0.35
    ConstellationV2Region.PELVIS -> 0.28
    ConstellationV2Region.LEFT_UPPER_ARM,
    ConstellationV2Region.RIGHT_UPPER_ARM,
    ConstellationV2Region.LEFT_THIGH,
    ConstellationV2Region.RIGHT_THIGH -> 0.22
    ConstellationV2Region.LEFT_FOREARM,
    ConstellationV2Region.RIGHT_FOREARM,
    ConstellationV2Region.LEFT_LOWER_LEG,
    ConstellationV2Region.RIGHT_LOWER_LEG -> 0.18
    else -> 0.0
  }
}

internal fun constellationV2ModeFromProp(value: String): ConstellationV2Mode? {
  return when (value) {
    ConstellationV2Mode.V2_900.id -> ConstellationV2Mode.V2_900
    ConstellationV2Mode.V2_600.id -> ConstellationV2Mode.V2_600
    else -> null
  }
}

internal fun hashUnit(namespace: String, index: Int): Double {
  var hash = 0x811C9DC5.toInt()
  for (i in namespace.indices) {
    hash = hash xor namespace[i].code
    hash *= 0x01000193
  }
  hash = hash xor index
  hash *= 0x01000193
  hash = hash xor (hash ushr 16)
  val unsigned = hash.toLong() and 0xFFFFFFFFL
  return unsigned / 4294967295.0
}

private fun fract(value: Double): Double {
  return value - floor(value)
}

internal fun clamp(value: Double, minValue: Double, maxValue: Double): Double {
  return max(minValue, min(maxValue, value))
}

internal fun nearlyEquals(a: Double, b: Double, tolerance: Double = 0.000001): Boolean {
  return abs(a - b) <= tolerance
}
