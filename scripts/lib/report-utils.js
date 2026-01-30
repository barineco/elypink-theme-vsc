/**
 * report-utils.js - レポート出力用ユーティリティ
 */

const { hexToRgb, rgbToHsb, hsbToRgb, rgbToHex, relativeLuminance, calcAPCA } = require('./color-utils');

/**
 * APCA計算用メトリクスを取得
 * @param {string} hex - 対象色
 * @param {string} bgHex - 背景色
 * @returns {object|null} { h, s, b, lum, apca, hsb }
 */
function getMetrics(hex, bgHex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;

  const hsb = rgbToHsb(rgb.r, rgb.g, rgb.b);
  const lum = relativeLuminance(rgb.r, rgb.g, rgb.b);
  const apca = calcAPCA(hex, bgHex);

  return {
    h: Math.round(hsb.h),
    s: Math.round(hsb.s * 100),
    b: Math.round(hsb.b * 100),
    lum: Math.round(lum * 1000) / 10,
    apca,
    hsb,
  };
}

function formatColorRow(name, hex, metrics, nameWidth = 45) {
  const { h, s, b } = metrics;
  return [
    name.padEnd(nameWidth),
    hex,
    `H${String(Math.round(h)).padStart(3)} S${String(s).padStart(3)} B${String(b).padStart(3)}`,
  ].join(' | ');
}

function printSection(title) {
  console.log('');
  console.log(`=== ${title} ===`);
}

function printSortedByBrightness(items, nameWidth = 45) {
  items.sort((a, b) => b.b - a.b);
  items.forEach(c => {
    console.log(formatColorRow(c.key, c.hex, c, nameWidth));
  });
}

/**
 * APCA目標値を達成する色を探索
 * @param {string} hex - 元の色
 * @param {string} bgHex - 背景色
 * @param {number} targetAPCA - 目標APCA値
 * @param {boolean} isLight
 * @returns {string|null} 調整後HEX (達成済み null)
 */
function findColorForAPCA(hex, bgHex, targetAPCA, isLight) {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;

  const hsb = rgbToHsb(rgb.r, rgb.g, rgb.b);
  const currentAPCA = Math.abs(calcAPCA(hex, bgHex));

  if (currentAPCA >= targetAPCA) return null;

  if (isLight) {
    // Light: 彩度↑ → 輝度↓
    for (let s = hsb.s; s <= 1.0; s += 0.01) {
      const testRgb = hsbToRgb(hsb.h, s, hsb.b);
      const testHex = rgbToHex(testRgb.r, testRgb.g, testRgb.b);
      if (Math.abs(calcAPCA(testHex, bgHex)) >= targetAPCA) return testHex;
    }
    for (let b = hsb.b; b >= 0; b -= 0.01) {
      const testRgb = hsbToRgb(hsb.h, 1.0, b);
      const testHex = rgbToHex(testRgb.r, testRgb.g, testRgb.b);
      if (Math.abs(calcAPCA(testHex, bgHex)) >= targetAPCA) return testHex;
    }
  } else {
    // Dark: 輝度↑ → 彩度↓
    for (let b = hsb.b; b <= 1.0; b += 0.01) {
      const testRgb = hsbToRgb(hsb.h, hsb.s, b);
      const testHex = rgbToHex(testRgb.r, testRgb.g, testRgb.b);
      if (Math.abs(calcAPCA(testHex, bgHex)) >= targetAPCA) return testHex;
    }
    for (let s = hsb.s; s >= 0; s -= 0.01) {
      const testRgb = hsbToRgb(hsb.h, s, 1.0);
      const testHex = rgbToHex(testRgb.r, testRgb.g, testRgb.b);
      if (Math.abs(calcAPCA(testHex, bgHex)) >= targetAPCA) return testHex;
    }
  }

  return null;
}

/**
 * テーブルのセパレータ
 * @param {number} width - 幅
 * @returns {string}
 */
function separator(width = 120) {
  return '-'.repeat(width);
}

module.exports = {
  getMetrics,
  formatColorRow,
  printSection,
  printSortedByBrightness,
  findColorForAPCA,
  findSelectionBgForAPCA,
  separator,
};
