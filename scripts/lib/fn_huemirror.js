/**
 * fn_huemirror: 色相反転 (Faded/Qinshi)
 *
 * 90度を軸に色相を反転 (h' = 180 - h)
 * ピンク系 → シアン系に変換
 */

const { processColors, hexToRgb, rgbToHsb, hsbToRgb, rgbToHex } = require('./color-utils');

// 色相反転: 90度を軸に反転 (h' = 180 - h)
function mirrorHue(h) {
  let newH = 180 - h;
  if (newH < 0) newH += 360;
  return newH;
}

const hueTransformer = (hsb) => ({
  h: mirrorHue(hsb.h),
  s: hsb.s,
  b: hsb.b,
});

// ハイライト用 (明度ブースト)
const HIGHLIGHT_BRIGHTNESS_BOOST = 1.1;
const highlightTransformer = (hsb) => ({
  h: mirrorHue(hsb.h),
  s: hsb.s,
  b: Math.min(1, hsb.b * HIGHLIGHT_BRIGHTNESS_BOOST),
});

// ハイライト対象キー
const highlightKeys = [
  'tab.activeForeground',
  'tab.activeBorder',
  'panelTitle.activeForeground',
  'panelTitle.activeBorder',
  'editorBracketHighlight.foreground1',
  'editorBracketHighlight.foreground2',
  'editorBracketHighlight.foreground3',
  'editorBracketHighlight.foreground4',
  'editorBracketHighlight.foreground5',
  'editorBracketHighlight.foreground6',
];

function transformSingleColor(hexColor, transformer) {
  const rgb = hexToRgb(hexColor);
  if (!rgb) return hexColor;
  const hsb = rgbToHsb(rgb.r, rgb.g, rgb.b);
  const newHsb = transformer(hsb);
  const newRgb = hsbToRgb(newHsb.h, newHsb.s, newHsb.b);
  return rgbToHex(newRgb.r, newRgb.g, newRgb.b, rgb.a);
}

/**
 * 色相を反転してFaded/Qinshiバリアントを生成
 * @param {Object} theme - テーマオブジェクト
 * @param {string} [newName] - 新しいテーマ名 (省略時は変更なし)
 * @returns {Object} - 色相反転されたテーマ
 */
function huemirror(theme, newName) {
  const result = JSON.parse(JSON.stringify(theme));
  const originalTheme = theme;

  if (newName) {
    result.name = newName;
  }

  // 保持キー (ansi)
  const preserveKeys = Object.keys(result.colors || {}).filter(k =>
    k.startsWith('terminal.ansi')
  );
  const preservedColors = {};
  for (const key of preserveKeys) {
    preservedColors[key] = result.colors[key];
  }

  if (result.colors) {
    result.colors = processColors(result.colors, hueTransformer);

    // 保持色を復元
    for (const key of preserveKeys) {
      result.colors[key] = preservedColors[key];
    }

    // ハイライト明度アップ
    for (const key of highlightKeys) {
      if (originalTheme.colors && originalTheme.colors[key]) {
        result.colors[key] = transformSingleColor(originalTheme.colors[key], highlightTransformer);
      }
    }
  }

  // トークン色は維持 (変換しない)

  return result;
}

module.exports = { huemirror, mirrorHue };
