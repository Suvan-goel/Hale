package expo.modules.posedetection

internal data class AndroidPoseFrameDimensions(
  val width: Int,
  val height: Int,
)

internal fun uprightSourceDimensions(
  rawWidth: Int,
  rawHeight: Int,
  rotationDegrees: Int,
): AndroidPoseFrameDimensions {
  val normalizedRotation = ((rotationDegrees % 360) + 360) % 360
  return if (normalizedRotation == 90 || normalizedRotation == 270) {
    AndroidPoseFrameDimensions(width = rawHeight, height = rawWidth)
  } else {
    AndroidPoseFrameDimensions(width = rawWidth, height = rawHeight)
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
