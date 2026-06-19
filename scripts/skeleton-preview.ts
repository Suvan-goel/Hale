/**
 * Dev-only: render the mannequin geometry to a static SVG so the figure can be
 * eyeballed without a device (the camera/MediaPipe path can't run in CI or an
 * emulator). Uses the canonical synthetic standing pose.
 *
 *   npm run skeleton-preview        # writes skeleton-preview.svg at repo root
 */

import { writeFileSync } from 'fs';

import { CHAIN_COUNT } from '../src/pose/chains';
import { makeFrame, mulberry32 } from '../src/pose/testing/syntheticPose';
import { createPoseFrame, parseLandmarkEvent } from '../src/pose/types';
import { buildSkeletonPaths, emptySkeletonPaths } from '../src/render/skeletonGeometry';

// Theme literals inlined (importing src/theme would pull in react-native, which
// the tsx/esbuild runner can't transform). Keep in sync with src/theme tokens.
const skeleton = {
  background: '#F7F5EF',
  figureTop: '#123C2E', // inky brand green at the top
  figureBottom: '#0B2B21', // settling to green-black at the base
  dim: '#8B938D', // muted stone grey for occluded parts
};
const colors = { bgBase: '#F7F5EF' };

const WIDTH = 390;
const HEIGHT = 844;

const frame = createPoseFrame();
parseLandmarkEvent(makeFrame(0, mulberry32(61), { noiseAmp: 0 }), frame);
const rel = new Float64Array(CHAIN_COUNT).fill(0.95);

const paths = emptySkeletonPaths();
buildSkeletonPaths(frame, rel, { width: WIDTH, height: HEIGHT, sourceAspect: 480 / 640, mirrored: true }, paths);

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <defs>
    <linearGradient id="figure" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${skeleton.figureTop}"/>
      <stop offset="1" stop-color="${skeleton.figureBottom}"/>
    </linearGradient>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="${colors.bgBase}"/>
  <path d="${paths.dim || 'M-9 -9'}" fill="${skeleton.dim}"/>
  <path d="${paths.bright || 'M-9 -9'}" fill="url(#figure)"/>
  <path d="${paths.head || 'M-9 -9'}" fill="url(#figure)"/>
</svg>
`;

writeFileSync('skeleton-preview.svg', svg);

// Sanity check from the landmark pixels (not the path string, which also holds
// arc radii/flags). Replicates the cover-fit mapping used by the geometry.
const sourceAspect = 480 / 640;
const sx = HEIGHT * sourceAspect;
const ox = (WIDTH - sx) / 2;
const mapX = (i: number) => (1 - frame.xs[i]) * sx + ox; // mirrored
const mapY = (i: number) => frame.ys[i] * HEIGHT;
const px: number[] = [];
const py: number[] = [];
for (let i = 0; i < frame.xs.length; i++) {
  px.push(mapX(i));
  py.push(mapY(i));
}
const fmt = (n: number) => n.toFixed(0);
console.log('Wrote skeleton-preview.svg');
console.log(`Landmark span  x:[${fmt(Math.min(...px))}, ${fmt(Math.max(...px))}]  y:[${fmt(Math.min(...py))}, ${fmt(Math.max(...py))}]  (viewport ${WIDTH}x${HEIGHT})`);
console.log(`Shapes — bright:${(paths.bright.match(/M/g) ?? []).length} dim:${(paths.dim.match(/M/g) ?? []).length} head:${paths.head ? 1 : 0}`);
