const test = require('node:test');
const assert = require('node:assert/strict');
const { classifyEdge, pickWeighted, randomBetween } = require('../src/behavior-policy.cjs');

const area = { x: 0, y: 0, width: 1440, height: 900 };

test('classifyEdge detects the nearest screen work-area edge', () => {
  assert.equal(classifyEdge({ x: 10, y: 300, width: 230, height: 270 }, area), 'left');
  assert.equal(classifyEdge({ x: 600, y: 625, width: 230, height: 270 }, area), 'bottom');
  assert.equal(classifyEdge({ x: 500, y: 300, width: 230, height: 270 }, area), null);
});

test('random helpers are deterministic with an injected source', () => {
  assert.equal(randomBetween(10, 20, () => 0.5), 15);
  assert.equal(pickWeighted([{ value: 'a', weight: 1 }, { value: 'b', weight: 3 }], () => 0.9), 'b');
});
