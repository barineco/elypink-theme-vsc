#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { hexToRgb, rgbToHex, rgbToHsb, hsbToRgb } = require('./lib/color-utils');

// 背景系
const BACKGROUND_KEYS = [
  'background',
  'Border',
  'border',
  'shadow',
];

// ターミナル背景
const TERMINAL_BACKGROUND_KEY = 'terminal.background';

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

// 明度反転対象
const INVERT_KEYS = [
  'editorGutter.',
];

// 色維持 (やや暗く)
const PRESERVE_KEYS = [
  'badge.background',
  'activityBarBadge.background',
  'gitDecoration.',
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

// リスト背景系 (やや明るめの背景)
const LIST_BACKGROUND_KEYS = [
  'list.activeSelectionBackground',
  'list.hoverBackground',
  'list.inactiveSelectionBackground',
  'quickInputList.focusBackground',
];

// サイドバー背景系 (より暗い背景)
const SIDEBAR_BACKGROUND_KEYS = [
  'sideBar.background',
  'sideBarSectionHeader.background',
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

function isTerminalBackgroundKey(key) {
  return key === TERMINAL_BACKGROUND_KEY;
}

function isInvertKey(key) {
  return INVERT_KEYS.some((pattern) => key.includes(pattern));
}

function isPreserveKey(key) {
  return PRESERVE_KEYS.some((pattern) => key.includes(pattern));
}

function isListBackgroundKey(key) {
  return LIST_BACKGROUND_KEYS.some((pattern) => key === pattern);
}

function isSidebarBackgroundKey(key) {
  return SIDEBAR_BACKGROUND_KEYS.some((pattern) => key === pattern);
}

// 背景色の変換:
// 明度を下げる, 彩度を上げる
function transformBackground(hexColor, { minBrightness = 0.05, maxBrightness = 0.25, brightnessFactor = 0.25, saturationFactor = 2.5 } = {}) {
  const rgb = hexToRgb(hexColor);
  if (!rgb) return hexColor;
  const hsb = rgbToHsb(rgb.r, rgb.g, rgb.b);
  const newBrightness = Math.max(minBrightness, Math.min(maxBrightness, hsb.b * brightnessFactor));
  const newSaturation = Math.min(1, hsb.s * saturationFactor);
  const newRgb = hsbToRgb(hsb.h, newSaturation, newBrightness);
  return rgbToHex(newRgb.r, newRgb.g, newRgb.b, rgb.a);
}

// リスト背景色の変換:
// 通常の背景より明度を高めに設定
function transformListBackground(hexColor) {
  return transformBackground(hexColor, { minBrightness: 0.05, maxBrightness: 0.3, brightnessFactor: 0.25 });
}

// サイドバー背景色の変換:
// 通常の背景より明度を低めに設定
function transformSidebarBackground(hexColor) {
  return transformBackground(hexColor, { minBrightness: 0.02, maxBrightness: 0.15, brightnessFactor: 0.20 });
}

// ターミナル背景の変換:
// Lightのピンク背景をやや暗くするだけ
function transformTerminalBackground(hexColor) {
  const rgb = hexToRgb(hexColor);
  if (!rgb) return hexColor;
  const hsb = rgbToHsb(rgb.r, rgb.g, rgb.b);
  const newBrightness = Math.max(0.30, hsb.b * 0.75);
  const newSaturation = Math.min(1, hsb.s * 1.3);
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
function transformForeground(hexColor) {
  const rgb = hexToRgb(hexColor);
  if (!rgb) return hexColor;
  const hsb = rgbToHsb(rgb.r, rgb.g, rgb.b);
  const newBrightness = Math.min(1, 0.7 + hsb.b * 0.3);
  const newSaturation = Math.min(1, hsb.s * 1.3);
  const newRgb = hsbToRgb(hsb.h, newSaturation, newBrightness);
  return rgbToHex(newRgb.r, newRgb.g, newRgb.b, rgb.a);
}

// 明度反転
function transformInvert(hexColor) {
  const rgb = hexToRgb(hexColor);
  if (!rgb) return hexColor;
  const hsb = rgbToHsb(rgb.r, rgb.g, rgb.b);
  const newBrightness = 1 - hsb.b;
  const newSaturation = Math.min(1, hsb.s * 1.1);
  const newRgb = hsbToRgb(hsb.h, newSaturation, newBrightness);
  return rgbToHex(newRgb.r, newRgb.g, newRgb.b, rgb.a);
}

// 色維持 (明度そのまま)
function transformPreserve(hexColor) {
  const rgb = hexToRgb(hexColor);
  if (!rgb) return hexColor;
  const hsb = rgbToHsb(rgb.r, rgb.g, rgb.b);
  const newBrightness = hsb.b * 1.0;
  const newSaturation = Math.min(1, hsb.s * 1.1);
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
    if (isTerminalBackgroundKey(key)) {
      result[key] = transformTerminalBackground(value);
    } else if (isTerminalSelectionKey(key)) {
      result[key] = transformTerminalSelection(value);
    } else if (isTerminalAnsiKey(key)) {
      result[key] = transformTerminalAnsi(value);
    } else if (isSelectionKey(key)) {
      result[key] = transformSelection(value);
    } else if (isListBackgroundKey(key)) {
      result[key] = transformListBackground(value);
    } else if (isSidebarBackgroundKey(key)) {
      result[key] = transformSidebarBackground(value);
    } else if (isPreserveKey(key)) {
      result[key] = transformPreserve(value);
    } else if (isInvertKey(key)) {
      result[key] = transformInvert(value);
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
