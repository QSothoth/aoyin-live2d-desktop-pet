function resizeKeepingFeet(bounds, size) {
  return {
    x: Math.round(bounds.x + (bounds.width - size.width) / 2),
    y: bounds.y + bounds.height - size.height,
    width: size.width,
    height: size.height
  };
}

module.exports = { resizeKeepingFeet };
