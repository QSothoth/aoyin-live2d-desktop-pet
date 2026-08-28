const CELL = Object.freeze({ width: 192, height: 208 });

const ANIMATIONS = Object.freeze({
  idle: { row: 0, frames: 6, fps: 7, loop: true },
  'running-right': { row: 1, frames: 8, fps: 12, loop: true },
  'running-left': { row: 2, frames: 8, fps: 12, loop: true },
  waving: { row: 3, frames: 4, fps: 8, loop: false, returnTo: 'idle' },
  jumping: { row: 4, frames: 5, fps: 11, loop: false, returnTo: 'idle' },
  failed: { row: 5, frames: 8, fps: 7, loop: false, returnTo: 'idle' },
  waiting: { row: 6, frames: 6, fps: 6, loop: true },
  running: { row: 7, frames: 6, fps: 8, loop: true },
  review: { row: 8, frames: 6, fps: 7, loop: true }
});

function frameRect(state, frame) {
  const animation = ANIMATIONS[state];
  if (!animation) throw new Error(`Unknown animation: ${state}`);
  const normalizedFrame = Math.max(0, Math.min(frame, animation.frames - 1));
  return {
    x: normalizedFrame * CELL.width,
    y: animation.row * CELL.height,
    width: CELL.width,
    height: CELL.height
  };
}

module.exports = { CELL, ANIMATIONS, frameRect };
