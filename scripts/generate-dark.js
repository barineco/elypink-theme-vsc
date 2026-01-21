#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { processColors, hexToRgb, rgbToHex, rgbToHsb, hsbToRgb } = require('./lib/color-utils');

// 背景系
const BACKGROUND_KEYS = [
  'background',
  'Border',
  'border',
  'shadow',
];

// ターミナルANSI
const TERMINAL_ANSI_KEYS = [
  'terminal.ansi',
  'terminal.ansiBright',
];

// ターミナル選択範囲
const TERMINAL_SELECTION_KEYS = [
  'terminal.selectionBackground',
  'terminalOverviewRuler.cursorForeground',
];

// 前景系 (テキスト)
const FOREGROUND_KEYS = [
  'foreground',
  'Foreground',
];

// 選択範囲系 (明度反転処理)
const SELECTION_KEYS = [
  'selectionBackground',
  'wordHighlightBackground',
  'findMatchBackground',
  'findMatchHighlightBackground',
  'selectionHighlight',
  'selection.background',
];

function isBackgroundKey(key) {
  return BACKGROUND_KEYS.some((pattern) => key.includes(pattern));
}

function isForegroundKey(key) {
  return FOREGROUND_KEYS.some((pattern) => key.includes(pattern));
}

function isSelectionKey(key) {
  return SELECTION_KEYS.some((pattern) => key.includes(pattern));
}

function isTerminalAnsiKey(key) {
  return TERMINAL_ANSI_KEYS.some((pattern) => key.startsWith(pattern));
}

function isTerminalSelectionKey(key) {
  return TERMINAL_SELECTION_KEYS.some((pattern) => key.includes(pattern));
}

// 背景色の変換:
// 明度を下げる, 彩度を上げる
function transformBackground(hexColor) {
  const rgb = hexToRgb(hexColor);
  if (!rgb) return hexColor;
  const hsb = rgbToHsb(rgb.r, rgb.g, rgb.b);
  const newBrightness = Math.max(0.06, Math.min(0.25, hsb.b * 0.22))
  const newSaturation = Math.min(1, hsb.s * 2.0);
  const newRgb = hsbToRgb(hsb.h, newSaturation, newBrightness);
  return rgbToHex(newRgb.r, newRgb.g, newRgb.b, rgb.a);
}

// 選択範囲の変換
// 明度を上げる, 彩度を上げる
function transformSelection(hexColor) {
  const rgb = hexToRgb(hexColor);
  if (!rgb) return hexColor;
  const hsb = rgbToHsb(rgb.r, rgb.g, rgb.b);
  const newBrightness = Math.min(0.7, 0.4 + hsb.b * 0.3);
  const newSaturation = Math.min(1, hsb.s * 1.2);
  const newRgb = hsbToRgb(hsb.h, newSaturation, newBrightness);
  return rgbToHex(newRgb.r, newRgb.g, newRgb.b, rgb.a);
}

// ターミナルANSI色の変換
// 明度を高く維持, 彩度を上げる
function transformTerminalAnsi(hexColor) {
  const rgb = hexToRgb(hexColor);
  if (!rgb) return hexColor;
  const hsb = rgbToHsb(rgb.r, rgb.g, rgb.b);
  const newBrightness = Math.min(0.95, 0.75 + hsb.b * 0.2);
  const newSaturation = Math.min(1, hsb.s * 1.05);
  const newRgb = hsbToRgb(hsb.h, newSaturation, newBrightness);
  return rgbToHex(newRgb.r, newRgb.g, newRgb.b, rgb.a);
}

// ターミナル選択範囲の変換
function transformTerminalSelection(hexColor) {
  const rgb = hexToRgb(hexColor);
  if (!rgb) return hexColor;
  const hsb = rgbToHsb(rgb.r, rgb.g, rgb.b);
  const newBrightness = Math.min(0.7, 0.4 + hsb.b * 0.3);
  const newSaturation = Math.min(1, hsb.s * 1.2);
  const newRgb = hsbToRgb(hsb.h, newSaturation, newBrightness);
  return rgbToHex(newRgb.r, newRgb.g, newRgb.b, rgb.a);
}

// 前景色の変換
// 明度を上げる, 彩度を上げる
function transformForeground(hexColor) {
  const rgb = hexToRgb(hexColor);
  if (!rgb) return hexColor;
  const hsb = rgbToHsb(rgb.r, rgb.g, rgb.b);
  const newBrightness = Math.min(1, 0.7 + hsb.b * 0.3);
  const newSaturation = Math.min(1, hsb.s * 1.3);
  const newRgb = hsbToRgb(hsb.h, newSaturation, newBrightness);
  return rgbToHex(newRgb.r, newRgb.g, newRgb.b, rgb.a);
}

// tokenColorsの変換
function transformTokenColor(hexColor) {
  const rgb = hexToRgb(hexColor);
  if (!rgb) return hexColor;
  const hsb = rgbToHsb(rgb.r, rgb.g, rgb.b);
  const newBrightness = Math.min(0.95, 0.75 + hsb.b * 0.2);
  const newSaturation = Math.min(1, hsb.s * 1.4);
  const newRgb = hsbToRgb(hsb.h, newSaturation, newBrightness);
  return rgbToHex(newRgb.r, newRgb.g, newRgb.b, rgb.a);
}

// colors オブジェクトを変換
function transformColors(colors) {
  const result = {};
  for (const [key, value] of Object.entries(colors)) {
    if (typeof value !== 'string' || !value.match(/^#[0-9A-Fa-f]{6,8}$/)) {
      result[key] = value;
      continue;
    }
    if (isTerminalSelectionKey(key)) {
      result[key] = transformTerminalSelection(value);
    } else if (isTerminalAnsiKey(key)) {
      result[key] = transformTerminalAnsi(value);
    } else if (isSelectionKey(key)) {
      result[key] = transformSelection(value);
    } else if (isForegroundKey(key)) {
      result[key] = transformForeground(value);
    } else if (isBackgroundKey(key)) {
      result[key] = transformBackground(value);
    } else {
      // その他はデフォルトで背景として扱う
      result[key] = transformBackground(value);
    }
  }
  return result;
}

// tokenColors を変換
function transformTokenColors(tokenColors) {
  return tokenColors.map((token) => {
    if (!token.settings) return token;

    const newSettings = { ...token.settings };
    if (newSettings.foreground && newSettings.foreground.match(/^#[0-9A-Fa-f]{6,8}$/)) {
      newSettings.foreground = transformTokenColor(newSettings.foreground);
    }
    return { ...token, settings: newSettings };
  });
}

// メイン
function generateDark(inputFile) {
  const themesDir = path.join(__dirname, '..', 'themes');
  const inputPath = path.join(themesDir, inputFile);
  if (!fs.existsSync(inputPath)) {
    console.log(`Skipping: ${inputFile} (not found)`);
    return;
  }
  const outputFile = inputFile.replace('-light', '-dark').replace('.json', '.json');
  const outputPath = path.join(themesDir, outputFile);
  const theme = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  // テーマ名とタイプを更新
  theme.name = theme.name.replace('Light', 'Dark');
  theme.type = 'dark';
  // 色を処理
  if (theme.colors) {
    theme.colors = transformColors(theme.colors);
  }
  if (theme.tokenColors) {
    theme.tokenColors = transformTokenColors(theme.tokenColors);
  }
  fs.writeFileSync(outputPath, JSON.stringify(theme, null, 2) + '\n');
  console.log(`Generated: ${outputFile}`);
}

// 対象ファイル
const targets = ['elypink-light.json'];

console.log('Generating dark theme from light...');
targets.forEach(generateDark);
console.log('Done!');
