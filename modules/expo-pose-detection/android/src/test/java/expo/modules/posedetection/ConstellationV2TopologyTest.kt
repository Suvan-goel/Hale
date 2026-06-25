package expo.modules.posedetection

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class ConstellationV2TopologyTest {
  @Test
  fun generatesDeterministicExactPointCounts() {
    val first = ConstellationV2TopologyBuilder.buildUncachedForTest(ConstellationV2Mode.V2_900)
    val second = ConstellationV2TopologyBuilder.buildUncachedForTest(ConstellationV2Mode.V2_900)

    assertEquals(900, first.actualPointCount)
    assertEquals(900, second.actualPointCount)
    for (i in first.points.indices) {
      assertEquals(first.points[i], second.points[i])
      assertEquals(i, first.points[i].id)
    }

    val sixHundred = ConstellationV2TopologyBuilder.buildUncachedForTest(ConstellationV2Mode.V2_600)
    assertEquals(600, sixHundred.actualPointCount)
  }

  @Test
  fun assignsStableRegionsRolesTiersBatchesAndInfluences() {
    val topology = ConstellationV2TopologyBuilder.buildUncachedForTest(ConstellationV2Mode.V2_900)
    val ids = mutableSetOf<Int>()

    for (point in topology.points) {
      assertTrue(ids.add(point.id))
      assertTrue(point.batchIndex in 0 until CONSTELLATION_V2_BATCH_COUNT)
      assertTrue(point.influenceAWeight > 0.0)
      assertTrue(point.influenceAWeight <= 1.0)
      assertTrue(point.influenceBWeight >= 0.0)
      assertTrue(point.influenceBWeight < 1.0)
      assertTrue(nearlyEquals(point.influenceAWeight + point.influenceBWeight, 1.0))
      assertTrue(point.localA.isFinite())
      assertTrue(point.localB.isFinite())
    }

    assertEquals(CONSTELLATION_V2_VIRTUAL_REGION_COUNT, ConstellationV2Region.values().size)
    assertEquals(CONSTELLATION_V2_BATCH_COUNT, topology.drawBatchCount)
    assertTrue(topology.regionCount(ConstellationV2Region.UPPER_TORSO) > topology.regionCount(ConstellationV2Region.LEFT_HAND))
    assertTrue(topology.regionCount(ConstellationV2Region.LEFT_THIGH) > topology.regionCount(ConstellationV2Region.LEFT_FOREARM))
    assertTrue(topology.emeraldCount() <= ConstellationV2Mode.V2_900.emeraldCap)
    assertNotEquals(0, topology.emeraldCount())
  }

  @Test
  fun keepsBoundaryAndStructuralAllocationsInsideTargetRanges() {
    val nineHundred = ConstellationV2TopologyBuilder.buildUncachedForTest(ConstellationV2Mode.V2_900)
    val sixHundred = ConstellationV2TopologyBuilder.buildUncachedForTest(ConstellationV2Mode.V2_600)

    val nineBoundary = nineHundred.roleCount(ConstellationV2Role.BOUNDARY).toDouble() / 900.0
    val nineStructural = nineHundred.roleCount(ConstellationV2Role.STRUCTURAL).toDouble() / 900.0
    val sixBoundary = sixHundred.roleCount(ConstellationV2Role.BOUNDARY).toDouble() / 600.0
    val sixStructural = sixHundred.roleCount(ConstellationV2Role.STRUCTURAL).toDouble() / 600.0

    assertTrue(nineBoundary in 0.30..0.38)
    assertTrue(nineStructural in 0.08..0.12)
    assertTrue(sixBoundary in 0.33..0.39)
    assertTrue(sixStructural in 0.08..0.12)
    assertTrue(sixBoundary <= nineBoundary + 0.04)
  }

  @Test
  fun sixHundredModeKeepsPerceptualBodyFullness() {
    val topology = ConstellationV2TopologyBuilder.buildUncachedForTest(ConstellationV2Mode.V2_600)

    assertEquals(48, topology.regionCount(ConstellationV2Region.HEAD))
    assertEquals(10, topology.regionCount(ConstellationV2Region.NECK))
    assertEquals(228, torsoPointCount(topology))
    assertEquals(18, distalPairPointCount(topology, ConstellationV2Region.LEFT_HAND, ConstellationV2Region.RIGHT_HAND))
    assertEquals(18, distalPairPointCount(topology, ConstellationV2Region.LEFT_FOOT, ConstellationV2Region.RIGHT_FOOT))
    assertEquals(600, topology.actualPointCount)
    assertTrue(topology.emeraldCount() <= ConstellationV2Mode.V2_600.emeraldCap)
    assertNotEquals(0, topology.emeraldCount())
  }

  @Test
  fun sixHundredSparseRolesCoverFullRegionLength() {
    val topology = ConstellationV2TopologyBuilder.buildUncachedForTest(ConstellationV2Mode.V2_600)

    assertRoleSpansRegion(topology, ConstellationV2Region.UPPER_TORSO, ConstellationV2Role.BOUNDARY)
    assertRoleSpansRegion(topology, ConstellationV2Region.LOWER_TORSO, ConstellationV2Role.INTERIOR)
    assertRoleSpansRegion(topology, ConstellationV2Region.LEFT_UPPER_ARM, ConstellationV2Role.BOUNDARY)
    assertRoleSpansRegion(topology, ConstellationV2Region.LEFT_THIGH, ConstellationV2Role.BOUNDARY)
    assertRoleSpansRegion(topology, ConstellationV2Region.RIGHT_LOWER_LEG, ConstellationV2Role.INTERIOR)
  }
}

private fun torsoPointCount(topology: ConstellationV2Topology): Int {
  return topology.regionCount(ConstellationV2Region.UPPER_TORSO) +
    topology.regionCount(ConstellationV2Region.LOWER_TORSO) +
    topology.regionCount(ConstellationV2Region.PELVIS)
}

private fun distalPairPointCount(
  topology: ConstellationV2Topology,
  left: ConstellationV2Region,
  right: ConstellationV2Region,
): Int {
  return topology.regionCount(left) + topology.regionCount(right)
}

private fun assertRoleSpansRegion(
  topology: ConstellationV2Topology,
  region: ConstellationV2Region,
  role: ConstellationV2Role,
) {
  val locals = topology.points
    .filter { it.region == region && it.role == role }
    .map { it.localA }
  assertTrue(locals.size >= 6)
  assertTrue(locals.minOrNull()!! < 0.14)
  assertTrue(locals.maxOrNull()!! > 0.86)
}
