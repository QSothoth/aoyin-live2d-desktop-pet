const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { actionFrameIndex, horizontalFrameRect } = require('../src/sprite-frame.cjs');
const { resizeKeepingFeet } = require('../src/window-geometry.cjs');
const { containRect, pixelSize } = require('../src/render-sizing.cjs');

test('raster fallback keeps native logical size on HiDPI canvases', () => {
  assert.deepEqual(pixelSize(236, 278, 2), {
    cssWidth: 236,
    cssHeight: 278,
    pixelWidth: 472,
    pixelHeight: 556,
    dpr: 2
  });
  const target = containRect(192, 208, 472, 556, 2);
  assert.equal(target.width, 384);
  assert.equal(target.height, 416);
  assert.equal(target.scale, 2);
});

test('action strips are sampled by source rectangle without oversized DOM images', () => {
  assert.equal(actionFrameIndex(0, 4800, 8), 0);
  assert.equal(actionFrameIndex(4799, 4800, 8), 7);
  assert.deepEqual(horizontalFrameRect(7), { x: 1344, y: 0, width: 192, height: 208 });

  const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'renderer', 'renderer.mjs'), 'utf8');
  assert.doesNotMatch(source, /frames\s*\*\s*92/);
  assert.doesNotMatch(source, /style\.width/);
});

test('window resizing preserves feet and centre without a transient scale animation', () => {
  const next = resizeKeepingFeet(
    { x: 100, y: 200, width: 236, height: 278 },
    { width: 283, height: 334 }
  );
  assert.deepEqual(next, { x: 77, y: 144, width: 283, height: 334 });
  assert.equal(next.y + next.height, 478);
});

test('Cubism is loaded lazily so a missing proprietary Core can fall back safely', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'renderer', 'renderer.mjs'), 'utf8');
  const coreLoad = source.indexOf('await loadCubismCore');
  const engineImport = source.indexOf("await import('untitled-pixi-live2d-engine/cubism')");
  assert.ok(coreLoad > 0);
  assert.ok(engineImport > coreLoad);
  assert.doesNotMatch(source, /^import .*untitled-pixi-live2d-engine/m);
  assert.doesNotMatch(source, /resizeTo\s*:/);
  assert.match(source, /new ResizeObserver/);
  assert.match(source, /sourceBounds/);
});
