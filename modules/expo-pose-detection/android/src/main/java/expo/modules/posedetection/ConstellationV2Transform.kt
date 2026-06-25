package expo.modules.posedetection

import kotlin.math.abs
import kotlin.math.hypot
import kotlin.math.max
import kotlin.math.min

internal const val CONSTELLATION_V2_LANDMARK_COUNT = 33
internal const val CONSTELLATION_V2_LANDMARK_STRIDE = 5

internal data class ConstellationV2Viewport(
  val viewWidth: Int,
  val viewHeight: Int,
  val sourceWidth: Int,
  val sourceHeight: Int,
  val mirrored: Boolean,
)

internal data class ConstellationV2TransformStats(
  val transformedPointCount: Int,
  val droppedInvalidPointCount: Int,
  val nonFiniteGeometryCount: Int,
  val calibrationState: String,
)

internal class ConstellationV2PointBatches(pointCapacity: Int) {
  val points: Array<FloatArray> = Array(CONSTELLATION_V2_BATCH_COUNT) {
    FloatArray(pointCapacity * 2)
  }
  val counts: IntArray = IntArray(CONSTELLATION_V2_BATCH_COUNT)
  val pointBufferBytes: Int = pointCapacity * 2 * CONSTELLATION_V2_BATCH_COUNT * 4

  fun reset() {
    for (i in counts.indices) counts[i] = 0
  }

  fun append(batchIndex: Int, x: Float, y: Float): Boolean {
    if (batchIndex !in 0 until CONSTELLATION_V2_BATCH_COUNT) return false
    val pointIndex = counts[batchIndex]
    val base = pointIndex * 2
    val target = points[batchIndex]
    if (base + 1 >= target.size) return false
    target[base] = x
    target[base + 1] = y
    counts[batchIndex] = pointIndex + 1
    return true
  }

  fun visiblePointCount(): Int {
    var total = 0
    for (count in counts) total += count
    return total
  }
}

internal class ConstellationV2Calibration {
  private val sampleLimit = 30
  private val shoulderWidths = DoubleArray(sampleLimit)
  private val hipWidths = DoubleArray(sampleLimit)
  private val torsoLengths = DoubleArray(sampleLimit)
  private val headScales = DoubleArray(sampleLimit)
  private val upperArmLengths = DoubleArray(sampleLimit)
  private val forearmLengths = DoubleArray(sampleLimit)
  private val thighLengths = DoubleArray(sampleLimit)
  private val lowerLegLengths = DoubleArray(sampleLimit)
  private var sampleCount = 0
  private var locked = false

  var lockedShoulderWidth: Double? = null
    private set
  var lockedHipWidth: Double? = null
    private set
  var lockedTorsoLength: Double? = null
    private set
  var lockedHeadScale: Double? = null
    private set
  var lockedUpperArmLength: Double? = null
    private set
  var lockedForearmLength: Double? = null
    private set
  var lockedThighLength: Double? = null
    private set
  var lockedLowerLegLength: Double? = null
    private set

  val state: String
    get() = when {
      locked -> "locked"
      sampleCount > 0 -> "collecting"
      else -> "neutral"
    }

  fun reset() {
    sampleCount = 0
    locked = false
    lockedShoulderWidth = null
    lockedHipWidth = null
    lockedTorsoLength = null
    lockedHeadScale = null
    lockedUpperArmLength = null
    lockedForearmLength = null
    lockedThighLength = null
    lockedLowerLegLength = null
  }

  fun record(landmarks: DoubleArray) {
    if (locked || landmarks.size < CONSTELLATION_V2_LANDMARK_COUNT * CONSTELLATION_V2_LANDMARK_STRIDE) return
    val leftShoulder = landmark(landmarks, LM_LEFT_SHOULDER) ?: return
    val rightShoulder = landmark(landmarks, LM_RIGHT_SHOULDER) ?: return
    val leftHip = landmark(landmarks, LM_LEFT_HIP) ?: return
    val rightHip = landmark(landmarks, LM_RIGHT_HIP) ?: return
    val shoulderMid = midpoint(leftShoulder, rightShoulder)
    val hipMid = midpoint(leftHip, rightHip)
    val slot = sampleCount.coerceAtMost(sampleLimit - 1)
    shoulderWidths[slot] = distance(leftShoulder, rightShoulder)
    hipWidths[slot] = distance(leftHip, rightHip)
    torsoLengths[slot] = distance(shoulderMid, hipMid)
    headScales[slot] =
      landmark(landmarks, LM_NOSE)?.let { distance(it, shoulderMid) } ?: shoulderWidths[slot]
    upperArmLengths[slot] = averagedPairedDistance(
      landmarks,
      LM_LEFT_SHOULDER,
      LM_LEFT_ELBOW,
      LM_RIGHT_SHOULDER,
      LM_RIGHT_ELBOW,
      torsoLengths[slot] * 0.42,
    )
    forearmLengths[slot] = averagedPairedDistance(
      landmarks,
      LM_LEFT_ELBOW,
      LM_LEFT_WRIST,
      LM_RIGHT_ELBOW,
      LM_RIGHT_WRIST,
      torsoLengths[slot] * 0.38,
    )
    thighLengths[slot] = averagedPairedDistance(
      landmarks,
      LM_LEFT_HIP,
      LM_LEFT_KNEE,
      LM_RIGHT_HIP,
      LM_RIGHT_KNEE,
      torsoLengths[slot] * 0.56,
    )
    lowerLegLengths[slot] = averagedPairedDistance(
      landmarks,
      LM_LEFT_KNEE,
      LM_LEFT_ANKLE,
      LM_RIGHT_KNEE,
      LM_RIGHT_ANKLE,
      torsoLengths[slot] * 0.56,
    )
    sampleCount += 1
    if (sampleCount >= sampleLimit) lock()
  }

  private fun lock() {
    val count = sampleCount.coerceIn(1, sampleLimit)
    lockedShoulderWidth = median(shoulderWidths, count)
    lockedHipWidth = median(hipWidths, count)
    lockedTorsoLength = median(torsoLengths, count)
    lockedHeadScale = median(headScales, count)
    lockedUpperArmLength = median(upperArmLengths, count)
    lockedForearmLength = median(forearmLengths, count)
    lockedThighLength = median(thighLengths, count)
    lockedLowerLegLength = median(lowerLegLengths, count)
    locked = true
  }
}

internal fun transformConstellationV2(
  topology: ConstellationV2Topology,
  landmarks: DoubleArray,
  viewport: ConstellationV2Viewport,
  calibration: ConstellationV2Calibration,
  out: ConstellationV2PointBatches,
): ConstellationV2TransformStats {
  out.reset()
  if (
    landmarks.size < CONSTELLATION_V2_LANDMARK_COUNT * CONSTELLATION_V2_LANDMARK_STRIDE ||
    viewport.viewWidth <= 0 ||
    viewport.viewHeight <= 0 ||
    viewport.sourceWidth <= 0 ||
    viewport.sourceHeight <= 0
  ) {
    return ConstellationV2TransformStats(0, topology.actualPointCount, 0, calibration.state)
  }

  calibration.record(landmarks)
  val rig = ConstellationV2Rig.from(landmarks, calibration)
    ?: return ConstellationV2TransformStats(0, topology.actualPointCount, 0, calibration.state)

  var dropped = 0
  var nonFinite = 0
  for (point in topology.points) {
    val normalized = rig.pointFor(point)
    if (normalized == null) {
      dropped += 1
      continue
    }
    if (!normalized.x.isFinite() || !normalized.y.isFinite()) {
      nonFinite += 1
      dropped += 1
      continue
    }
    val mapped = mapConstellationV2PointToView(normalized.x, normalized.y, viewport)
    if (!mapped.x.isFinite() || !mapped.y.isFinite()) {
      nonFinite += 1
      dropped += 1
      continue
    }
    if (!out.append(point.batchIndex, mapped.x.toFloat(), mapped.y.toFloat())) {
      dropped += 1
    }
  }

  return ConstellationV2TransformStats(
    transformedPointCount = out.visiblePointCount(),
    droppedInvalidPointCount = dropped,
    nonFiniteGeometryCount = nonFinite,
    calibrationState = calibration.state,
  )
}

internal fun mapConstellationV2PointToView(
  normalizedX: Double,
  normalizedY: Double,
  viewport: ConstellationV2Viewport,
): AndroidNormalizedPoint {
  val viewWidth = viewport.viewWidth.toDouble()
  val viewHeight = viewport.viewHeight.toDouble()
  val sourceAspect = viewport.sourceWidth.toDouble() / viewport.sourceHeight.toDouble()
  val viewAspect = viewWidth / viewHeight
  val sx: Double
  val sy: Double
  val ox: Double
  val oy: Double
  if (viewAspect < sourceAspect) {
    sx = viewWidth
    sy = viewWidth / sourceAspect
    ox = 0.0
    oy = (viewHeight - sy) / 2.0
  } else {
    sy = viewHeight
    sx = viewHeight * sourceAspect
    ox = (viewWidth - sx) / 2.0
    oy = 0.0
  }
  val x = displayNormalizedX(normalizedX, viewport.mirrored) * sx + ox
  val y = normalizedY * sy + oy
  return AndroidNormalizedPoint(x, y)
}

private data class Vec2(val x: Double, val y: Double)

private class ConstellationV2Rig private constructor(
  private val landmarks: DoubleArray,
  private val shoulderMid: Vec2,
  private val hipMid: Vec2,
  private val nose: Vec2?,
  private val shoulderWidth: Double,
  private val hipWidth: Double,
  private val torsoLength: Double,
  private val bodyScale: Double,
) {
  private val torsoDown = safeUnit(Vec2(hipMid.x - shoulderMid.x, hipMid.y - shoulderMid.y), Vec2(0.0, 1.0))
  private val torsoNormal = Vec2(-torsoDown.y, torsoDown.x)
  private val headDown = nose?.let {
    safeUnit(Vec2(shoulderMid.x - it.x, shoulderMid.y - it.y), Vec2(0.0, 1.0))
  } ?: torsoDown
  private val headSide = Vec2(-headDown.y, headDown.x)

  fun pointFor(point: ConstellationV2Point): Vec2? {
    return when (point.region) {
      ConstellationV2Region.HEAD -> headPoint(point)
      ConstellationV2Region.NECK -> neckPoint(point)
      ConstellationV2Region.UPPER_TORSO -> torsoPoint(point, 0.02, 0.58)
      ConstellationV2Region.LOWER_TORSO -> torsoPoint(point, 0.42, 0.98)
      ConstellationV2Region.PELVIS -> pelvisPoint(point)
      ConstellationV2Region.LEFT_UPPER_ARM ->
        limbPoint(point, LM_LEFT_SHOULDER, LM_LEFT_ELBOW, 0.064, 0.048)
      ConstellationV2Region.RIGHT_UPPER_ARM ->
        limbPoint(point, LM_RIGHT_SHOULDER, LM_RIGHT_ELBOW, 0.064, 0.048)
      ConstellationV2Region.LEFT_FOREARM ->
        limbPoint(point, LM_LEFT_ELBOW, LM_LEFT_WRIST, 0.045, 0.034)
      ConstellationV2Region.RIGHT_FOREARM ->
        limbPoint(point, LM_RIGHT_ELBOW, LM_RIGHT_WRIST, 0.045, 0.034)
      ConstellationV2Region.LEFT_THIGH ->
        limbPoint(point, LM_LEFT_HIP, LM_LEFT_KNEE, 0.088, 0.066)
      ConstellationV2Region.RIGHT_THIGH ->
        limbPoint(point, LM_RIGHT_HIP, LM_RIGHT_KNEE, 0.088, 0.066)
      ConstellationV2Region.LEFT_LOWER_LEG ->
        limbPoint(point, LM_LEFT_KNEE, LM_LEFT_ANKLE, 0.06, 0.04)
      ConstellationV2Region.RIGHT_LOWER_LEG ->
        limbPoint(point, LM_RIGHT_KNEE, LM_RIGHT_ANKLE, 0.06, 0.04)
      ConstellationV2Region.LEFT_HAND ->
        extremityPoint(point, LM_LEFT_WRIST, LM_LEFT_INDEX, LM_LEFT_ELBOW, 0.05, 0.034)
      ConstellationV2Region.RIGHT_HAND ->
        extremityPoint(point, LM_RIGHT_WRIST, LM_RIGHT_INDEX, LM_RIGHT_ELBOW, 0.05, 0.034)
      ConstellationV2Region.LEFT_FOOT ->
        extremityPoint(point, LM_LEFT_ANKLE, LM_LEFT_FOOT_INDEX, LM_LEFT_KNEE, 0.065, 0.03)
      ConstellationV2Region.RIGHT_FOOT ->
        extremityPoint(point, LM_RIGHT_ANKLE, LM_RIGHT_FOOT_INDEX, LM_RIGHT_KNEE, 0.065, 0.03)
    }
  }

  private fun headPoint(point: ConstellationV2Point): Vec2 {
    val center = nose?.let {
      Vec2(it.x + headDown.x * bodyScale * 0.052, it.y + headDown.y * bodyScale * 0.052)
    } ?: Vec2(
      shoulderMid.x - torsoDown.x * bodyScale * 0.28,
      shoulderMid.y - torsoDown.y * bodyScale * 0.28,
    )
    val rx = max(shoulderWidth * 0.29, bodyScale * 0.07)
    val ry = max(bodyScale * 0.16, rx * 1.22)
    val jawTaper = if (point.localB > 0.36) 0.78 else 1.0
    return Vec2(
      center.x + headSide.x * point.localA * rx * jawTaper + headDown.x * point.localB * ry,
      center.y + headSide.y * point.localA * rx * jawTaper + headDown.y * point.localB * ry,
    )
  }

  private fun neckPoint(point: ConstellationV2Point): Vec2 {
    val headBase = Vec2(
      shoulderMid.x - torsoDown.x * bodyScale * 0.11,
      shoulderMid.y - torsoDown.y * bodyScale * 0.11,
    )
    return capsulePoint(headBase, shoulderMid, point.localA, point.localB, bodyScale * 0.045, bodyScale * 0.06)
  }

  private fun torsoPoint(point: ConstellationV2Point, startT: Double, endT: Double): Vec2 {
    val t = startT + (endT - startT) * point.localA
    val center = lerp(shoulderMid, hipMid, t)
    val shoulderHalf = shoulderWidth * 0.56
    val hipHalf = hipWidth * 0.5
    val waistNarrowing = 1.0 - 0.13 * kotlin.math.sin(kotlin.math.PI * t)
    val halfWidth = (shoulderHalf * (1.0 - t) + hipHalf * t) * waistNarrowing
    return Vec2(
      center.x + torsoNormal.x * point.localB * halfWidth,
      center.y + torsoNormal.y * point.localB * halfWidth,
    )
  }

  private fun pelvisPoint(point: ConstellationV2Point): Vec2 {
    val pelvisTop = lerp(shoulderMid, hipMid, 0.84)
    val pelvisBottom = Vec2(
      hipMid.x + torsoDown.x * bodyScale * 0.13,
      hipMid.y + torsoDown.y * bodyScale * 0.13,
    )
    val t = point.localA
    val center = lerp(pelvisTop, pelvisBottom, t)
    val halfWidth = hipWidth * (0.58 - 0.12 * t)
    return Vec2(
      center.x + torsoNormal.x * point.localB * halfWidth,
      center.y + torsoNormal.y * point.localB * halfWidth,
    )
  }

  private fun limbPoint(
    point: ConstellationV2Point,
    startIndex: Int,
    endIndex: Int,
    startWidthScale: Double,
    endWidthScale: Double,
  ): Vec2? {
    val start = landmark(landmarks, startIndex) ?: return null
    val end = landmark(landmarks, endIndex) ?: return null
    return capsulePoint(
      start,
      end,
      point.localA,
      point.localB,
      bodyScale * startWidthScale,
      bodyScale * endWidthScale,
    )
  }

  private fun extremityPoint(
    point: ConstellationV2Point,
    anchorIndex: Int,
    distalIndex: Int,
    fallbackPreviousIndex: Int,
    lengthScale: Double,
    widthScale: Double,
  ): Vec2? {
    val anchor = landmark(landmarks, anchorIndex) ?: return null
    val distal = landmark(landmarks, distalIndex)
    val previous = landmark(landmarks, fallbackPreviousIndex)
    val direction = when {
      distal != null && distance(anchor, distal) > 0.002 -> safeUnit(Vec2(distal.x - anchor.x, distal.y - anchor.y), torsoDown)
      previous != null && distance(previous, anchor) > 0.002 -> safeUnit(Vec2(anchor.x - previous.x, anchor.y - previous.y), torsoDown)
      else -> torsoDown
    }
    val side = Vec2(-direction.y, direction.x)
    val center = Vec2(anchor.x + direction.x * bodyScale * lengthScale, anchor.y + direction.y * bodyScale * lengthScale)
    val length = bodyScale * lengthScale
    val width = bodyScale * widthScale
    return Vec2(
      center.x + side.x * point.localA * width + direction.x * point.localB * length,
      center.y + side.y * point.localA * width + direction.y * point.localB * length,
    )
  }

  private fun capsulePoint(
    start: Vec2,
    end: Vec2,
    t: Double,
    radial: Double,
    startHalfWidth: Double,
    endHalfWidth: Double,
  ): Vec2 {
    val direction = Vec2(end.x - start.x, end.y - start.y)
    val unit = safeUnit(direction, torsoDown)
    val normal = Vec2(-unit.y, unit.x)
    val center = lerp(start, end, clamp(t, 0.0, 1.0))
    val width = startHalfWidth * (1.0 - t) + endHalfWidth * t
    return Vec2(center.x + normal.x * radial * width, center.y + normal.y * radial * width)
  }

  companion object {
    fun from(landmarks: DoubleArray, calibration: ConstellationV2Calibration): ConstellationV2Rig? {
      val leftShoulder = landmark(landmarks, LM_LEFT_SHOULDER) ?: return null
      val rightShoulder = landmark(landmarks, LM_RIGHT_SHOULDER) ?: return null
      val leftHip = landmark(landmarks, LM_LEFT_HIP) ?: return null
      val rightHip = landmark(landmarks, LM_RIGHT_HIP) ?: return null
      val shoulderMid = midpoint(leftShoulder, rightShoulder)
      val hipMid = midpoint(leftHip, rightHip)
      val torsoLength = calibration.lockedTorsoLength ?: distance(shoulderMid, hipMid).coerceAtLeast(0.18)
      val shoulderWidth = calibration.lockedShoulderWidth ?: distance(leftShoulder, rightShoulder).coerceAtLeast(torsoLength * 0.34)
      val hipWidth = calibration.lockedHipWidth ?: distance(leftHip, rightHip).coerceAtLeast(torsoLength * 0.26)
      return ConstellationV2Rig(
        landmarks = landmarks,
        shoulderMid = shoulderMid,
        hipMid = hipMid,
        nose = landmark(landmarks, LM_NOSE),
        shoulderWidth = shoulderWidth,
        hipWidth = hipWidth,
        torsoLength = torsoLength,
        bodyScale = torsoLength,
      )
    }
  }
}

private fun landmark(landmarks: DoubleArray, index: Int): Vec2? {
  val base = index * CONSTELLATION_V2_LANDMARK_STRIDE
  if (base + 4 >= landmarks.size) return null
  val x = landmarks[base]
  val y = landmarks[base + 1]
  val visibility = landmarks[base + 3]
  val presence = landmarks[base + 4]
  if (!x.isFinite() || !y.isFinite()) return null
  if (visibility.isFinite() && presence.isFinite() && min(visibility, presence) < 0.08) return null
  if (x < -0.35 || x > 1.35 || y < -0.35 || y > 1.35) return null
  return Vec2(x, y)
}

private fun midpoint(a: Vec2, b: Vec2): Vec2 {
  return Vec2((a.x + b.x) * 0.5, (a.y + b.y) * 0.5)
}

private fun lerp(a: Vec2, b: Vec2, t: Double): Vec2 {
  return Vec2(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t)
}

private fun distance(a: Vec2, b: Vec2): Double {
  return hypot(a.x - b.x, a.y - b.y)
}

private fun safeUnit(vector: Vec2, fallback: Vec2): Vec2 {
  val length = hypot(vector.x, vector.y)
  if (!length.isFinite() || length < 0.000001) return fallback
  return Vec2(vector.x / length, vector.y / length)
}

private fun averagedPairedDistance(
  landmarks: DoubleArray,
  a0: Int,
  a1: Int,
  b0: Int,
  b1: Int,
  fallback: Double,
): Double {
  val firstStart = landmark(landmarks, a0)
  val firstEnd = landmark(landmarks, a1)
  val secondStart = landmark(landmarks, b0)
  val secondEnd = landmark(landmarks, b1)
  var total = 0.0
  var count = 0
  if (firstStart != null && firstEnd != null) {
    total += distance(firstStart, firstEnd)
    count += 1
  }
  if (secondStart != null && secondEnd != null) {
    total += distance(secondStart, secondEnd)
    count += 1
  }
  return if (count > 0) total / count else fallback
}

private fun median(values: DoubleArray, count: Int): Double {
  val safeCount = count.coerceIn(1, values.size)
  val copy = DoubleArray(safeCount)
  for (i in 0 until safeCount) copy[i] = values[i]
  copy.sort()
  val mid = safeCount / 2
  return if (safeCount % 2 == 0) (copy[mid - 1] + copy[mid]) * 0.5 else copy[mid]
}

private const val LM_NOSE = 0
private const val LM_LEFT_EAR = 7
private const val LM_RIGHT_EAR = 8
private const val LM_LEFT_SHOULDER = 11
private const val LM_RIGHT_SHOULDER = 12
private const val LM_LEFT_ELBOW = 13
private const val LM_RIGHT_ELBOW = 14
private const val LM_LEFT_WRIST = 15
private const val LM_RIGHT_WRIST = 16
private const val LM_LEFT_INDEX = 19
private const val LM_RIGHT_INDEX = 20
private const val LM_LEFT_HIP = 23
private const val LM_RIGHT_HIP = 24
private const val LM_LEFT_KNEE = 25
private const val LM_RIGHT_KNEE = 26
private const val LM_LEFT_ANKLE = 27
private const val LM_RIGHT_ANKLE = 28
private const val LM_LEFT_FOOT_INDEX = 31
private const val LM_RIGHT_FOOT_INDEX = 32
