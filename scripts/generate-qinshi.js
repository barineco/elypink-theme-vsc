#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { processColors, hexToRgb, rgbToHex, rgbToHsb, hsbToRgb } = require('./lib/color-utils');

const HUE_SHIFT = -130;
const SATURATION_SCALE = 0.7;
const BRIGHTNESS_SCALE = 0.9;

// ターミナル選択範囲
const TERMINAL_SELECTION_KEYS = ['terminal.selectionBackground'];

// 色相シフト + 彩度・明度調整の変換関数
const hueShiftTransformer = (hsb) => {
  let newHue = hsb.h + HUE_SHIFT;
  if (newHue < 0) newHue += 360;
  if (newHue >= 360) newHue -= 360;
  return {
    h: newHue,
    s: hsb.s * SATURATION_SCALE,
    b: hsb.b * BRIGHTNESS_SCALE,
  };
};

// ターミナル選択範囲
// 他と逆方向のシフト (シアン 205° → ピンク 335°)
function transformTerminalSelection(hexColor) {
  const rgb = hexToRgb(hexColor);
  if (!rgb) return hexColor;
  const hsb = rgbToHsb(rgb.r, rgb.g, rgb.b);
  let newHue = hsb.h + 130;
  if (newHue >= 360) newHue -= 360;
  const newRgb = hsbToRgb(newHue, hsb.s * SATURATION_SCALE, hsb.b * BRIGHTNESS_SCALE);
  return rgbToHex(newRgb.r, newRgb.g, newRgb.b, rgb.a);
}

// メイン
function generateQinshi(inputFile) {
  const themesDir = path.join(__dirname, '..', 'themes');
  const inputPath = path.join(themesDir, inputFile);
  if (!fs.existsSync(inputPath)) {
    console.log(`Skipping: ${inputFile} (not found)`);
    return;
  }
  const outputFile = inputFile.replace('.json', '-qinshi.json');
  const outputPath = path.join(themesDir, outputFile);
  const theme = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  // テーマ名を更新
  theme.name = theme.name.replace('Elypink', 'Qinshi');
  // 色を処理
  if (theme.colors) {
    // ターミナル選択範囲の元の値を保存
    const terminalSelectionOriginal = {};
    for (const key of TERMINAL_SELECTION_KEYS) {
      if (theme.colors[key]) {
        terminalSelectionOriginal[key] = theme.colors[key];
      }
    }
    // 通常の色相シフト
    theme.colors = processColors(theme.colors, hueShiftTransformer);
    // ターミナル選択範囲だけ逆方向シフトで上書き
    for (const key of TERMINAL_SELECTION_KEYS) {
      if (terminalSelectionOriginal[key]) {
        theme.colors[key] = transformTerminalSelection(terminalSelectionOriginal[key]);
      }
    }
  }
  if (theme.tokenColors) {
    theme.tokenColors = processColors(theme.tokenColors, hueShiftTransformer);
  }
  fs.writeFileSync(outputPath, JSON.stringify(theme, null, 2) + '\n');
  console.log(`Generated: ${outputFile}`);
}

// 対象ファイル
const targets = ['elypink-light.json', 'elypink-dark.json'];

console.log(`Hue shift: ${HUE_SHIFT}° (335° -> 200°)`);
targets.forEach(generateQinshi);
console.log('Done!');
