/**
 * fn_seasonal: 季節バリアント生成
 *
 * オーバーレイブレンドで季節感のある色調に変換
 * - spring: 赤ピンクオーバーレイ
 * - summer: 青オーバーレイ
 * - diamond: シアンオーバーレイ
 */

const { processColors, rgbToHsb, hsbToRgb } = require('./color-utils');

// オーバーレイブレンドモード
function overlay(base, blend) {
  if (base <= 0.5) {
    return 2 * base * blend;
  } else {
    return 1 - 2 * (1 - base) * (1 - blend);
  }
}

// RGB値にブレンドモードを適用
function applyBlend(baseRgb, blendRgb, blendFn, opacity) {
  const r = baseRgb.r / 255;
  const g = baseRgb.g / 255;
  const b = baseRgb.b / 255;
  const br = blendRgb.r / 255;
  const bg = blendRgb.g / 255;
  const bb = blendRgb.b / 255;

  const resultR = blendFn(r, br);
  const resultG = blendFn(g, bg);
  const resultB = blendFn(b, bb);

  const finalR = r + (resultR - r) * opacity;
  const finalG = g + (resultG - g) * opacity;
  const finalB = b + (resultB - b) * opacity;

  return {
    r: Math.round(finalR * 255),
    g: Math.round(finalG * 255),
    b: Math.round(finalB * 255),
  };
}

// 季節設定
const SEASONS = {
  spring: {
    name: 'Spring',
    blendColor: { r: 255, g: 100, b: 120 },
    blendMode: overlay,
    opacity: 0.1,
  },
  summer: {
    name: 'Summer',
    blendColor: { r: 80, g: 120, b: 255 },
    blendMode: overlay,
    opacity: 0.3,
  },
  diamond: {
    name: 'Diamond',
    blendColor: { r: 150, g: 220, b: 255 },
    blendMode: overlay,
    opacity: 0.4,
  },
};

// 季節変換関数を生成
function createSeasonTransformer(season) {
  const { blendColor, blendMode, opacity } = SEASONS[season];

  return (hsb) => {
    const rgb = hsbToRgb(hsb.h, hsb.s, hsb.b);
    const blended = applyBlend(rgb, blendColor, blendMode, opacity);
    const newHsb = rgbToHsb(blended.r, blended.g, blended.b);
    return newHsb;
  };
}

/**
 * 季節バリアントを生成
 * @param {Object} theme - テーマオブジェクト
 * @param {string} season - 季節 ('spring' | 'summer' | 'diamond')
 * @returns {Object} - 季節バリアントテーマ
 */
function seasonal(theme, season) {
  const seasonConfig = SEASONS[season];
  if (!seasonConfig) {
    throw new Error(`Unknown season: ${season}`);
  }

  const result = JSON.parse(JSON.stringify(theme));
  result.name = `${theme.name} (${seasonConfig.name})`;

  const transformer = createSeasonTransformer(season);

  // 保持キー (ansi)
  const preserveKeys = Object.keys(result.colors || {}).filter(k =>
    k.startsWith('terminal.ansi')
  );
  const preservedColors = {};
  for (const key of preserveKeys) {
    preservedColors[key] = result.colors[key];
  }

  if (result.colors) {
    result.colors = processColors(result.colors, transformer);

    // 保持する色を復元
    for (const key of preserveKeys) {
      result.colors[key] = preservedColors[key];
    }
  }

  if (result.tokenColors) {
    result.tokenColors = processColors(result.tokenColors, transformer);
  }

  return result;
}

// 個別のエクスポート
const spring = (theme) => seasonal(theme, 'spring');
const summer = (theme) => seasonal(theme, 'summer');
const diamond = (theme) => seasonal(theme, 'diamond');

module.exports = { seasonal, spring, summer, diamond, SEASONS };
