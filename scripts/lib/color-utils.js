// RGB -> HSB
function rgbToHsb(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0;
  let s = max === 0 ? 0 : delta / max;
  let v = max;

  if (delta !== 0) {
    if (max === r) {
      h = ((g - b) / delta) % 6;
    } else if (max === g) {
      h = (b - r) / delta + 2;
    } else {
      h = (r - g) / delta + 4;
    }
    h *= 60;
    if (h < 0) h += 360;
  }

  return { h, s, b: v };
}

// HSB -> RGB
function hsbToRgb(h, s, b) {
  const c = b * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = b - c;

  let r, g, bl;

  if (h < 60) {
    [r, g, bl] = [c, x, 0];
  } else if (h < 120) {
    [r, g, bl] = [x, c, 0];
  } else if (h < 180) {
    [r, g, bl] = [0, c, x];
  } else if (h < 240) {
    [r, g, bl] = [0, x, c];
  } else if (h < 300) {
    [r, g, bl] = [x, 0, c];
  } else {
    [r, g, bl] = [c, 0, x];
  }

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((bl + m) * 255),
  };
}

// Hex -> RGB
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?$/i.exec(hex);
  if (!result) return null;
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
    a: result[4] ? parseInt(result[4], 16) : null,
  };
}

// RGB -> Hex
function rgbToHex(r, g, b, a = null) {
  const toHex = (n) => n.toString(16).padStart(2, '0').toUpperCase();
  if (a !== null) {
    return `#${toHex(r)}${toHex(g)}${toHex(b)}${toHex(a)}`;
  }
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function transformColor(hexColor, transformer) {
  const rgb = hexToRgb(hexColor);
  if (!rgb) return hexColor;

  const hsb = rgbToHsb(rgb.r, rgb.g, rgb.b);
  const transformed = transformer(hsb);

  const newRgb = hsbToRgb(transformed.h, transformed.s, transformed.b);
  return rgbToHex(newRgb.r, newRgb.g, newRgb.b, rgb.a);
}

// オブジェクト内の色を再帰的に変換
function processColors(obj, transformer) {
  if (typeof obj === 'string') {
    if (obj.match(/^#[0-9A-Fa-f]{6,8}$/)) {
      return transformColor(obj, transformer);
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => processColors(item, transformer));
  }

  if (typeof obj === 'object' && obj !== null) {
    const result = {};
    for (const key of Object.keys(obj)) {
      result[key] = processColors(obj[key], transformer);
    }
    return result;
  }

  return obj;
}

module.exports = {
  rgbToHsb,
  hsbToRgb,
  hexToRgb,
  rgbToHex,
  transformColor,
  processColors,
};
