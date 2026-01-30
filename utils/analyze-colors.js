#!/usr/bin/env node

/**
 * analyze-colors.js - テーマ色分析ツール
 * 指定したテーマファイルの色をカテゴリ別に分析し、
 * HSB値とともにB降順で一覧表示する。色の階層感や範囲を確認する
 * node utils/analyze-colors.js <theme-file>
 */

const fs = require('fs');
const { hexToRgb, rgbToHsb } = require('../scripts/lib/color-utils');
const { printSection, printSortedByBrightness } = require('../scripts/lib/report-utils');

const themePath = process.argv[2];

if (!themePath) {
  console.error('Usage: node utils/analyze-colors.js <theme-file>');
  console.error('Example: node utils/analyze-colors.js themes/elypink-light.json');
  process.exit(1);
}

if (!fs.existsSync(themePath)) {
  console.error(`Error: File not found: ${themePath}`);
  process.exit(1);
}

console.log('Analyzing: ' + themePath);

const theme = JSON.parse(fs.readFileSync(themePath, 'utf8'));
const colors = theme.colors;

const categoryRules = [
  { name: 'TERMINALS', test: key => key.startsWith('terminal.') },
  { name: 'BACKGROUNDS', test: key => key.toLowerCase().includes('background') || key.toLowerCase().includes('border') },
  { name: 'FOREGROUNDS', test: key => key.toLowerCase().includes('foreground') },
  { name: 'HIGHLIGHTS', test: key => /Highlight|Match|selection|Selection/.test(key) },
  { name: 'OTHERS', test: () => true },
];

const categories = {};
categoryRules.forEach(rule => categories[rule.name] = []);

for (const [key, value] of Object.entries(colors)) {
  if (typeof value !== 'string' || !value.match(/^#[0-9A-Fa-f]{6,8}$/)) continue;
  const rgb = hexToRgb(value);
  if (!rgb) continue;

  const hsb = rgbToHsb(rgb.r, rgb.g, rgb.b);
  const item = {
    key,
    hex: value,
    h: hsb.h,
    s: Math.round(hsb.s * 100),
    b: Math.round(hsb.b * 100),
  };
  for (const rule of categoryRules) {
    if (rule.test(key)) {
      categories[rule.name].push(item);
      break;
    }
  }
}

const displayOrder = ['BACKGROUNDS', 'FOREGROUNDS', 'HIGHLIGHTS', 'TERMINALS', 'OTHERS'];

for (const name of displayOrder) {
  const items = categories[name];
  if (items.length === 0) continue;
  printSection(`${name} (sorted by B desc)`);
  printSortedByBrightness(items);
}

printSection('SUMMARY');
for (const name of displayOrder) {
  const items = categories[name];
  if (items.length === 0) continue;

  const bValues = items.map(c => c.b);
  console.log(`${name.padEnd(12)}: B range ${Math.min(...bValues)} - ${Math.max(...bValues)}`);
}
