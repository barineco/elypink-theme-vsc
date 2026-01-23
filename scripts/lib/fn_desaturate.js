/**
 * fn_desaturate: 彩度を落とす変換 (Subtle)
 *
 * masterテーマの彩度を85%に落としてメインテーマを生成
 */

const { processColors } = require('./color-utils');

const SATURATION_SCALE = 0.85;

const desaturateTransformer = (hsb) => ({
  h: hsb.h,
  s: hsb.s * SATURATION_SCALE,
  b: hsb.b,
});

/**
 * テーマの彩度を落とす
 * @param {Object} theme - テーマオブジェクト
 * @param {string} [newName] - 新しいテーマ名 (省略時は変更なし)
 * @returns {Object} - 彩度を落としたテーマ
 */
function desaturate(theme, newName) {
  const result = JSON.parse(JSON.stringify(theme));

  if (newName) {
    result.name = newName;
  }

  if (result.colors) {
    result.colors = processColors(result.colors, desaturateTransformer);
  }
  if (result.tokenColors) {
    result.tokenColors = processColors(result.tokenColors, desaturateTransformer);
  }

  return result;
}

module.exports = { desaturate, SATURATION_SCALE };
