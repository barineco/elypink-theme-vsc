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

// 相対輝度 (WCAG)
function relativeLuminance(r, g, b) {
  const sRGB = [r, g, b].map(v => {
    v = v / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
}

// コントラスト比
function contrastRatio(lum1, lum2) {
  return (Math.max(lum1, lum2) + 0.05) / (Math.min(lum1, lum2) + 0.05);
}

// APCA (Accessible Perceptual Contrast Algorithm)
// 参考: https://github.com/Myndex/SAPC-APCA
function calcAPCA(fgHex, bgHex) {
  const fg = hexToRgb(fgHex);
  const bg = hexToRgb(bgHex);
  if (!fg || !bg) return 0;

  // sRGB to Y (luminance) with APCA coefficients
  function sRGBtoY(rgb) {
    const mainTRC = 2.4;
    const sRco = 0.2126729;
    const sGco = 0.7151522;
    const sBco = 0.0721750;

    function simpleExp(chan) {
      return Math.pow(chan / 255, mainTRC);
    }

    return sRco * simpleExp(rgb.r) + sGco * simpleExp(rgb.g) + sBco * simpleExp(rgb.b);
  }

  const Ytxt = sRGBtoY(fg);
  const Ybg = sRGBtoY(bg);

  // APCA constants
  const normBG = 0.56;
  const normTXT = 0.57;
  const revTXT = 0.62;
  const revBG = 0.65;
  const blkThrs = 0.022;
  const blkClmp = 1.414;
  const scaleBoW = 1.14;
  const scaleWoB = 1.14;
  const loBoWoffset = 0.027;
  const loWoBoffset = 0.027;
  const loClip = 0.1;

  // Clamp Y values
  let txtY = Ytxt > blkThrs ? Ytxt : Ytxt + Math.pow(blkThrs - Ytxt, blkClmp);
  let bgY = Ybg > blkThrs ? Ybg : Ybg + Math.pow(blkThrs - Ybg, blkClmp);

  // Calculate contrast
  let SAPC = 0;
  let outputContrast = 0;

  if (Math.abs(bgY - txtY) < 0.0005) {
    return 0;
  }

  if (bgY > txtY) {
    // Light background, dark text
    SAPC = (Math.pow(bgY, normBG) - Math.pow(txtY, normTXT)) * scaleBoW;
    outputContrast = SAPC < loClip ? 0 : SAPC - loBoWoffset;
  } else {
    // Dark background, light text
    SAPC = (Math.pow(bgY, revBG) - Math.pow(txtY, revTXT)) * scaleWoB;
    outputContrast = SAPC > -loClip ? 0 : SAPC + loWoBoffset;
  }

  // Return Lc value (multiply by 100 for percentage)
  return Math.round(outputContrast * 1000) / 10;
}

// 背景に対してコントラスト比を確保するよう調整
// targetContrast: 目標コントラスト比
// bgHex: 背景色 (hex)
// fgHex: 前景色 (hex)
// saturationBoost: 輝度変化1%あたりの彩度上昇率 
// returns: 調整後の前景色 (hex)
function ensureContrast(fgHex, bgHex, targetContrast, saturationBoost = 3.0) {
  const fgRgb = hexToRgb(fgHex);
  const bgRgb = hexToRgb(bgHex);
  if (!fgRgb || !bgRgb) return fgHex;

  const bgLum = relativeLuminance(bgRgb.r, bgRgb.g, bgRgb.b);
  const fgLum = relativeLuminance(fgRgb.r, fgRgb.g, fgRgb.b);
  const currentContrast = contrastRatio(fgLum, bgLum);

  // 目標達成していれば変更なし
  if (currentContrast >= targetContrast) return fgHex;

  const hsb = rgbToHsb(fgRgb.r, fgRgb.g, fgRgb.b);
  const originalB = hsb.b;

  // 二分探索で輝度を調整 (暗くと明るくの両方)
  function findBestBrightness(goingDarker) {
    let low = goingDarker ? 0 : hsb.b;
    let high = goingDarker ? hsb.b : 1;
    let bestB = null;

    for (let i = 0; i < 20; i++) {
      const mid = (low + high) / 2;
      const testRgb = hsbToRgb(hsb.h, hsb.s, mid);
      const testLum = relativeLuminance(testRgb.r, testRgb.g, testRgb.b);
      const testContrast = contrastRatio(testLum, bgLum);

      if (testContrast >= targetContrast) {
        bestB = mid;
        if (goingDarker) {
          low = mid;
        } else {
          high = mid;
        }
      } else {
        if (goingDarker) {
          high = mid;
        } else {
          low = mid;
        }
      }
    }
    return bestB;
  }

  const darkerB = findBestBrightness(true);
  const lighterB = findBestBrightness(false);

  // 両方向の結果を比較し小さい変化を選択
  let bestB = originalB;
  if (darkerB !== null && lighterB !== null) {
    bestB = Math.abs(originalB - darkerB) <= Math.abs(originalB - lighterB) ? darkerB : lighterB;
  } else if (darkerB !== null) {
    bestB = darkerB;
  } else if (lighterB !== null) {
    bestB = lighterB;
  }

  // 輝度の変化量に応じて彩度を調整
  const brightnessChange = Math.abs(originalB - bestB);
  const saturationIncrease = brightnessChange * saturationBoost;
  const newS = Math.min(1, hsb.s + saturationIncrease);

  const newRgb = hsbToRgb(hsb.h, newS, bestB);
  return rgbToHex(newRgb.r, newRgb.g, newRgb.b, fgRgb.a);
}

module.exports = {
  rgbToHsb,
  hsbToRgb,
  hexToRgb,
  rgbToHex,
  transformColor,
  processColors,
  relativeLuminance,
  contrastRatio,
  calcAPCA,
  ensureContrast,
};
