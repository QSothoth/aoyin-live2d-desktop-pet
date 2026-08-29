function positive(value, fallback = 1) {
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function pixelSize(width, height, dpr = 1) {
  const ratio = Math.min(2, Math.max(1, positive(dpr)));
  return {
    cssWidth: Math.max(1, Math.round(positive(width))),
    cssHeight: Math.max(1, Math.round(positive(height))),
    pixelWidth: Math.max(1, Math.round(positive(width) * ratio)),
    pixelHeight: Math.max(1, Math.round(positive(height) * ratio)),
    dpr: ratio
  };
}

function containRect(sourceWidth, sourceHeight, targetWidth, targetHeight, maxScale = Infinity) {
  const sourceW = positive(sourceWidth);
  const sourceH = positive(sourceHeight);
  const targetW = positive(targetWidth);
  const targetH = positive(targetHeight);
  const scale = Math.min(targetW / sourceW, targetH / sourceH, positive(maxScale, Infinity));
  const width = sourceW * scale;
  const height = sourceH * scale;
  return { x: (targetW - width) / 2, y: targetH - height, width, height, scale };
}

module.exports = { containRect, pixelSize };
