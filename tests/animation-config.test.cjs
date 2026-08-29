const test = require('node:test');
const assert = require('node:assert/strict');
const { CELL, ANIMATIONS, frameRect } = require('../src/animation-config.cjs');

test('hatch-pet atlas contract uses all nine semantic rows', () => {
  assert.deepEqual(Object.keys(ANIMATIONS), [
    'idle', 'running-right', 'running-left', 'waving', 'jumping',
    'failed', 'waiting', 'running', 'review'
  ]);
});

test('every frame stays inside the 1536x1872 atlas', () => {
  for (const [state, animation] of Object.entries(ANIMATIONS)) {
    const rect = frameRect(state, animation.frames - 1);
    assert.ok(rect.x + rect.width <= 1536, state);
    assert.ok(rect.y + rect.height <= 1872, state);
  }
  assert.deepEqual(CELL, { width: 192, height: 208 });
});

test('frameRect clamps invalid frame indexes', () => {
  assert.equal(frameRect('idle', -2).x, 0);
  assert.equal(frameRect('idle', 99).x, 5 * 192);
});

test('idle uses sparse variable timing and drag gait is restrained', () => {
  assert.equal(ANIMATIONS.idle.variableTiming, true);
  assert.equal(ANIMATIONS.idle.fps, 0);
  assert.ok(ANIMATIONS['running-right'].fps <= 7);
  assert.ok(ANIMATIONS['running-left'].fps <= 7);
});
