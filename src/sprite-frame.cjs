const CELL = Object.freeze({ width: 192, height: 208 });

function actionFrameIndex(elapsedMs, durationMs, frames) {
  if (frames <= 1 || durationMs <= 0) return 0;
  const animatedFor = Math.max(0, Math.min(elapsedMs, durationMs - 1));
  return Math.min(frames - 1, Math.floor(animatedFor / (durationMs / frames)));
}

function horizontalFrameRect(frame) {
  return {
    x: Math.max(0, frame) * CELL.width,
    y: 0,
    width: CELL.width,
    height: CELL.height
  };
}

module.exports = { CELL, actionFrameIndex, horizontalFrameRect };
