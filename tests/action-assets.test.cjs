const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const actions = ['glasses-wipe', 'edge-peek', 'tail-groom', 'wolf-transform', 'wolf-idle'];

test('all custom action strips are non-empty WebP assets', () => {
  for (const name of actions) {
    const file = path.join(root, 'resources', 'pets', 'aoyin', 'actions', `${name}.webp`);
    const data = fs.readFileSync(file);
    assert.ok(data.length > 50_000, `${name} should contain rendered frames`);
    assert.equal(data.subarray(0, 4).toString('ascii'), 'RIFF', name);
    assert.equal(data.subarray(8, 12).toString('ascii'), 'WEBP', name);
  }
});

test('action QA reports clean geometry and transparency', () => {
  const report = JSON.parse(fs.readFileSync(
    path.join(root, 'artifacts', 'aoyin-pet-run', 'qa', 'action-validation.json'), 'utf8'
  ));
  assert.deepEqual(report.errors, []);
  assert.deepEqual(report.warnings, []);
  assert.deepEqual(Object.keys(report.actions).sort(), actions.sort());
});
