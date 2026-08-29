const EDGE_THRESHOLD = 34;

const AUTONOMY = Object.freeze({
  ambientMinMs: 45_000,
  ambientMaxMs: 110_000,
  speechCooldownMs: 10 * 60_000,
  glassesMinMs: 5 * 60_000,
  glassesMaxMs: 11 * 60_000,
  wolfMinMs: 15 * 60_000,
  wolfMaxMs: 30 * 60_000,
  roamMinMs: 4 * 60_000,
  roamMaxMs: 9 * 60_000
});

function randomBetween(min, max, random = Math.random) {
  return Math.round(min + random() * (max - min));
}

function classifyEdge(bounds, workArea, threshold = EDGE_THRESHOLD) {
  const distances = {
    left: Math.abs(bounds.x - workArea.x),
    right: Math.abs(workArea.x + workArea.width - (bounds.x + bounds.width)),
    top: Math.abs(bounds.y - workArea.y),
    bottom: Math.abs(workArea.y + workArea.height - (bounds.y + bounds.height))
  };
  const [edge, distance] = Object.entries(distances).sort((a, b) => a[1] - b[1])[0];
  return distance <= threshold ? edge : null;
}

function pickWeighted(items, random = Math.random) {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  let cursor = random() * total;
  for (const item of items) {
    cursor -= item.weight;
    if (cursor <= 0) return item.value;
  }
  return items.at(-1)?.value;
}

module.exports = { AUTONOMY, EDGE_THRESHOLD, classifyEdge, pickWeighted, randomBetween };
