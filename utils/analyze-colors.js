#!/usr/bin/env node

/**
 * analyze-colors.js - テーマ色分析ツール
 *
 * 指定したテーマファイルの色をカテゴリ別に分析し、
 * HSB値とともにB降順で一覧表示する。色の階層感や範囲を確認する
 *
 * Usage:
 *   node utils/analyze-colors.js <theme-file>
 *
 * Examples:
 *   node utils/analyze-colors.js themes/elypink-light.json
 *   node utils/analyze-colors.js themes/elypink-dark-master.json
 *
 * Output:
 *   - BACKGROUNDS: 背景色・ボーダー色
 *   - FOREGROUNDS: 前景色
 *   - HIGHLIGHTS: ハイライト・選択色
 *   - TERMINALS: ターミナル色
 *   - OTHERS: その他
 *   - SUMMARY: 各カテゴリのB値範囲
 */

const fs = require('fs');
const { hexToRgb, rgbToHsb } = require('../scripts/lib/color-utils');

const themePath = process.argv[2];

if (!themePath) {
  console.error('Error: Theme file path is required.\n');
  console.error('Usage: node utils/analyze-colors.js <theme-file>');
  console.error('Example: node utils/analyze-colors.js themes/elypink-light.json');
  process.exit(1);
}

if (!fs.existsSync(themePath)) {
  console.error(`Error: File not found: ${themePath}`);
  process.exit(1);
}

console.log('Analyzing: ' + themePath);
console.log('');

const theme = JSON.parse(fs.readFileSync(themePath, 'utf8'));
const colors = theme.colors;

// キーをカテゴリ分け
const backgrounds = [];
const foregrounds = [];
const highlights = [];
const terminals = [];
const others = [];

for (const [key, value] of Object.entries(colors)) {
  if (typeof value !== 'string' || !value.match(/^#[0-9A-Fa-f]{6,8}$/)) continue;

  const rgb = hexToRgb(value);
  if (!rgb) continue;
  const hsb = rgbToHsb(rgb.r, rgb.g, rgb.b);
  const item = { key, hex: value, h: hsb.h, s: Math.round(hsb.s * 100), b: Math.round(hsb.b * 100) };

  if (key.startsWith('terminal.')) {
    terminals.push(item);
  } else if (key.toLowerCase().includes('background') || key.toLowerCase().includes('border')) {
    backgrounds.push(item);
  } else if (key.toLowerCase().includes('foreground')) {
    foregrounds.push(item);
  } else if (key.includes('Highlight') || key.includes('Match') || key.includes('selection') || key.includes('Selection')) {
    highlights.push(item);
  } else {
    others.push(item);
  }
}

// Bでソートして表示
console.log('=== BACKGROUNDS (sorted by B desc) ===');
backgrounds.sort((a, b) => b.b - a.b);
backgrounds.forEach(c => {
  console.log(c.key.padEnd(45) + ' | ' + c.hex + ' | H' + String(Math.round(c.h)).padStart(3) + ' S' + String(c.s).padStart(3) + ' B' + String(c.b).padStart(3));
});

console.log('');
console.log('=== FOREGROUNDS (sorted by B desc) ===');
foregrounds.sort((a, b) => b.b - a.b);
foregrounds.forEach(c => {
  console.log(c.key.padEnd(45) + ' | ' + c.hex + ' | H' + String(Math.round(c.h)).padStart(3) + ' S' + String(c.s).padStart(3) + ' B' + String(c.b).padStart(3));
});

console.log('');
console.log('=== HIGHLIGHTS / SELECTION (sorted by B desc) ===');
highlights.sort((a, b) => b.b - a.b);
highlights.forEach(c => {
  console.log(c.key.padEnd(45) + ' | ' + c.hex + ' | H' + String(Math.round(c.h)).padStart(3) + ' S' + String(c.s).padStart(3) + ' B' + String(c.b).padStart(3));
});

console.log('');
console.log('=== TERMINALS (sorted by B desc) ===');
terminals.sort((a, b) => b.b - a.b);
terminals.forEach(c => {
  console.log(c.key.padEnd(45) + ' | ' + c.hex + ' | H' + String(Math.round(c.h)).padStart(3) + ' S' + String(c.s).padStart(3) + ' B' + String(c.b).padStart(3));
});

console.log('');
console.log('=== OTHERS (sorted by B desc) ===');
others.sort((a, b) => b.b - a.b);
others.forEach(c => {
  console.log(c.key.padEnd(45) + ' | ' + c.hex + ' | H' + String(Math.round(c.h)).padStart(3) + ' S' + String(c.s).padStart(3) + ' B' + String(c.b).padStart(3));
});

// サマリー
console.log('');
console.log('=== SUMMARY ===');
console.log('Backgrounds: B range ' + Math.min(...backgrounds.map(c => c.b)) + ' - ' + Math.max(...backgrounds.map(c => c.b)));
console.log('Foregrounds: B range ' + Math.min(...foregrounds.map(c => c.b)) + ' - ' + Math.max(...foregrounds.map(c => c.b)));
console.log('Highlights:  B range ' + Math.min(...highlights.map(c => c.b)) + ' - ' + Math.max(...highlights.map(c => c.b)));
console.log('Terminals:   B range ' + Math.min(...terminals.map(c => c.b)) + ' - ' + Math.max(...terminals.map(c => c.b)));
