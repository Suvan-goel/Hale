import { Image, StyleSheet, View } from 'react-native';

const PEARL_ORBIT_ART = require('../../assets/images/pearl-orbit-light-v5.png');
const SOURCE_HEIGHT_PER_WIDTH = 1619 / 972;
const CROP_TOP_PER_WIDTH = 130 / 300;

/** Editorial Home artwork kept isolated so the action screen remains logic-only. */
export function PearlHeroArtwork({ width }: { width: number }) {
  return (
    <View style={styles.frame} pointerEvents="none" accessibilityElementsHidden>
      <Image
        source={PEARL_ORBIT_ART}
        style={[
          styles.image,
          {
            width,
            height: Math.round(width * SOURCE_HEIGHT_PER_WIDTH),
            top: -Math.round(width * CROP_TOP_PER_WIDTH),
          },
        ]}
        resizeMode="contain"
        accessible={false}
        accessibilityIgnoresInvertColors
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  image: {
    position: 'absolute',
    right: 0,
  },
});
