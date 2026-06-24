package expo.modules.posedetection

import android.hardware.camera2.CameraMetadata

internal data class AndroidCameraTimestampDiagnostics(
  val cameraId: String?,
  val sensorTimestampSourceRaw: Int?,
  val sensorTimestampSourceName: String,
  val sensorTimestampComparableToElapsedRealtime: Boolean,
)

internal fun androidCameraTimestampDiagnostics(
  cameraId: String?,
  sensorTimestampSource: Int?,
): AndroidCameraTimestampDiagnostics {
  val sourceName = when (sensorTimestampSource) {
    CameraMetadata.SENSOR_INFO_TIMESTAMP_SOURCE_REALTIME -> "REALTIME"
    CameraMetadata.SENSOR_INFO_TIMESTAMP_SOURCE_UNKNOWN -> "UNKNOWN"
    null -> "UNAVAILABLE"
    else -> "UNRECOGNISED"
  }
  return AndroidCameraTimestampDiagnostics(
    cameraId = cameraId,
    sensorTimestampSourceRaw = sensorTimestampSource,
    sensorTimestampSourceName = sourceName,
    sensorTimestampComparableToElapsedRealtime = sourceName == "REALTIME",
  )
}
