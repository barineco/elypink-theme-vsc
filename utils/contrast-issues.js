#!/usr/bin/env node

/**
 * contrast-issues.js - コントラスト問題の詳細表示
 *
 * check-contrast.js が生成した contrast-report.json を読み込み、
 * warn/fail となった色ペアの詳細情報を表示する。
 *
 * Usage:
 *   node utils/contrast-issues.js
 *
 * Prerequisites:
 *   先に check-contrast.js を実行して contrast-report.json を生成しておく
 *
 * Output:
 *   - 問題のあるテーマごとに色ペアの詳細を表示
 *   - コントラスト比、APCA値、RGB/HSB/輝度情報
 */

const fs = require('fs');
const path = require('path');
const { hexToRgb, rgbToHsb, relativeLuminance } = require('../scripts/lib/color-utils');

const reportPath = path.join(__dirname, '..', 'contrast-report.json');

if (!fs.existsSync(reportPath)) {
  console.error('Error: contrast-report.json not found.\n');
  console.error('Run check-contrast.js first:');
  console.error('  node utils/check-contrast.js themes/elypink-light.json');
  process.exit(1);
}

const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

function getColorInfo(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return { rgb: 'N/A', hsb: 'N/A', lum: 'N/A' };
  const hsb = rgbToHsb(rgb.r, rgb.g, rgb.b);
  const lum = relativeLuminance(rgb.r, rgb.g, rgb.b);
  return {
    rgb: `rgb(${rgb.r},${rgb.g},${rgb.b})`,
    hsb: `H${Math.round(hsb.h)}° S${Math.round(hsb.s * 100)}% B${Math.round(hsb.b * 100)}%`,
    lum: lum.toFixed(3),
  };
}

for (const theme of report.themes) {
  const issues = theme.pairs.filter(p => p.status !== 'pass');
  const tokenIssues = theme.tokens.filter(t => t.status !== 'pass');

  if (issues.length === 0 && tokenIssues.length === 0) continue;

  console.log(`\n=== ${theme.theme} (${theme.type}) ===`);
  console.log(`Summary: ${theme.summary.warn} warn, ${theme.summary.fail} fail\n`);

  for (const issue of issues) {
    const bgInfo = getColorInfo(issue.background.color);
    const fgInfo = getColorInfo(issue.foreground.color);
    const icon = issue.status === 'fail' ? '✗' : '⚠';

    console.log(`${icon} [${issue.status.toUpperCase()}] ${issue.foreground.key} on ${issue.background.key}`);
    console.log(`  Contrast: ${issue.contrast}:1 (need ${issue.minRequired}:1) | APCA: ${issue.apca} | WCAG: ${issue.wcag}`);
    console.log(`  BG: ${issue.background.color} ${bgInfo.rgb} ${bgInfo.hsb} Lum=${bgInfo.lum}`);
    console.log(`  FG: ${issue.foreground.color} ${fgInfo.rgb} ${fgInfo.hsb} Lum=${fgInfo.lum} Sat=${issue.foreground.saturation}%`);
    console.log('');
  }

  if (tokenIssues.length > 0) {
    console.log('--- Token Colors ---');
    const editorBg = theme.pairs.find(p => p.background.key === 'editor.background')?.background.color || 'N/A';
    const bgInfo = getColorInfo(editorBg);

    for (const issue of tokenIssues) {
      const fgInfo = getColorInfo(issue.color);
      const icon = issue.status === 'fail' ? '✗' : '⚠';

      console.log(`${icon} [${issue.status.toUpperCase()}] ${issue.scope}`);
      console.log(`  Contrast: ${issue.contrast}:1 (need ${issue.minRequired}:1) | APCA: ${issue.apca}`);
      console.log(`  BG: ${editorBg} ${bgInfo.rgb} ${bgInfo.hsb} Lum=${bgInfo.lum}`);
      console.log(`  FG: ${issue.color} ${fgInfo.rgb} ${fgInfo.hsb} Lum=${fgInfo.lum} Sat=${issue.saturation}%`);
      console.log('');
    }
  }
}
