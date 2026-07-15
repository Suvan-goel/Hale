package expo.modules.posedetection

import org.junit.Assert.assertEquals
import org.junit.Test

class SegmentationMaskFigureRendererTest {
  @Test
  fun `soft edge ramp suppresses noise and reaches a solid matte interior`() {
    assertEquals(0f, maskFigureAlphaFraction(0.20f), 0.0001f)
    assertEquals(0f, maskFigureAlphaFraction(0.30f), 0.0001f)
    assertEquals(0.5f, maskFigureAlphaFraction(0.525f), 0.0001f)
    assertEquals(1f, maskFigureAlphaFraction(0.75f), 0.0001f)
    assertEquals(1f, maskFigureAlphaFraction(0.95f), 0.0001f)
  }

  @Test
  fun `upright remap preserves the expected source corners at every rotation`() {
    assertEquals(0, maskSourceXForUprightPixel(0, 0, 0, 4, 3))
    assertEquals(0, maskSourceYForUprightPixel(0, 0, 0, 4, 3))

    assertEquals(0, maskSourceXForUprightPixel(0, 0, 90, 4, 3))
    assertEquals(2, maskSourceYForUprightPixel(0, 0, 90, 4, 3))

    assertEquals(3, maskSourceXForUprightPixel(0, 0, 180, 4, 3))
    assertEquals(2, maskSourceYForUprightPixel(0, 0, 180, 4, 3))

    assertEquals(3, maskSourceXForUprightPixel(0, 0, 270, 4, 3))
    assertEquals(0, maskSourceYForUprightPixel(0, 0, 270, 4, 3))
  }
}
