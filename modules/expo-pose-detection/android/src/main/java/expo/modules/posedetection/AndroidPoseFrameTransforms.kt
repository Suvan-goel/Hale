package expo.modules.posedetection

internal data class AndroidPoseFrameDimensions(
  val width: Int,
  val height: Int,
)

internal data class AndroidNormalizedPoint(
  val x: Double,
  val y: Double,
)

internal fun normalizeRotationDegrees(rotationDegrees: Int): Int {
  return ((rotationDegrees % 360) + 360) % 360
}

internal fun uprightSourceDimensions(
  rawWidth: Int,
  rawHeight: Int,
  rotationDegrees: Int,
): AndroidPoseFrameDimensions {
  val normalizedRotation = normalizeRotationDegrees(rotationDegrees)
  return if (normalizedRotation == 90 || normalizedRotation == 270) {
    AndroidPoseFrameDimensions(width = rawHeight, height = rawWidth)
  } else {
    AndroidPoseFrameDimensions(width = rawWidth, height = rawHeight)
  }
}

internal fun rotateNormalizedPointToUpright(
  x: Double,
  y: Double,
  rotationDegrees: Int,
): AndroidNormalizedPoint {
  return AndroidNormalizedPoint(
    x = uprightNormalizedX(x, y, rotationDegrees),
    y = uprightNormalizedY(x, y, rotationDegrees),
  )
}

internal fun uprightNormalizedX(
  x: Double,
  y: Double,
  rotationDegrees: Int,
): Double {
  return when (normalizeRotationDegrees(rotationDegrees)) {
    90 -> 1.0 - y
    180 -> 1.0 - x
    270 -> y
    else -> x
  }
}

internal fun uprightNormalizedY(
  x: Double,
  y: Double,
  rotationDegrees: Int,
): Double {
  return when (normalizeRotationDegrees(rotationDegrees)) {
    90 -> x
    180 -> 1.0 - y
    270 -> 1.0 - x
    else -> y
  }
}

internal fun imageFormatName(format: Int): String {
  return when (format) {
    android.graphics.ImageFormat.YUV_420_888 -> "YUV_420_888"
    android.graphics.PixelFormat.RGBA_8888 -> "RGBA_8888"
    android.graphics.PixelFormat.RGBX_8888 -> "RGBX_8888"
    android.graphics.PixelFormat.RGB_888 -> "RGB_888"
    android.graphics.ImageFormat.JPEG -> "JPEG"
    else -> "unknown($format)"
  }
}

internal fun displayNormalizedX(normalizedX: Double, mirrored: Boolean): Double {
  return if (mirrored) 1.0 - normalizedX else normalizedX
}
