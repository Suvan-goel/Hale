import { runPoseRendererReplaySuite } from '../src/diagnostics/poseRendererReplay';

const frameCount = Number.parseInt(process.argv[2] ?? '180', 10);
const summaries = runPoseRendererReplaySuite({
  frameCount: Number.isFinite(frameCount) ? frameCount : 180,
});

console.log(JSON.stringify({ frameCount: summaries[0]?.frames ?? 0, summaries }, null, 2));
