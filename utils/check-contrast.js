#!/usr/bin/env node

/**
 * check-contrast.js - コントラスト比チェッカー
 *
 * テーマファイルのUI色・トークン色のコントラスト比を検証し、
 * WCAG/APCA基準に基づいてレポートを生成する。
 *
 * Usage:
 *   node utils/check-contrast.js <theme-file> [theme-file...]
 *
 * Examples:
 *   node utils/check-contrast.js themes/elypink-light.json
 *   node utils/check-contrast.js themes/elypink-light.json themes/elypink-dark.json
 *
 * Output:
 *   - contrast-report.json: 詳細レポート (プロジェクトルート)
 *   - コンソール: 各テーマの pass/warn/fail サマリー
 *
 * Note:
 *   色ペア定義は utils/lib/color-pairs.js で管理
 */

const fs = require('fs');
const path = require('path');
const { hexToRgb, rgbToHsb, relativeLuminance, contrastRatio, calcAPCA } = require('../scripts/lib/color-utils');
const { COLOR_PAIRS, TOKEN_SCOPES, WCAG } = require('../scripts/lib/color-pairs');

function checkContrast(themeFile) {
  const themesDir = path.join(__dirname, '..', 'themes');
  const themePath = path.join(themesDir, themeFile);

  if (!fs.existsSync(themePath)) {
    console.error(`Theme not found: ${themeFile}`);
    process.exit(1);
  }

  // Remove JSONC comments before parsing
  const raw = fs.readFileSync(themePath, 'utf8');
  const jsonWithoutComments = raw.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
  const theme = JSON.parse(jsonWithoutComments);
  const colors = theme.colors || {};
  const tokenColors = theme.tokenColors || [];

  const results = {
    theme: themeFile,
    type: theme.type,
    timestamp: new Date().toISOString(),
    summary: { total: 0, pass: 0, warn: 0, fail: 0 },
    pairs: [],
    tokens: [],
  };

  // UI色ペアのチェック
  for (const pair of COLOR_PAIRS) {
    const bgColor = colors[pair.bg];
    if (!bgColor) continue;

    const bgRgb = hexToRgb(bgColor);
    if (!bgRgb) continue;
    const bgLum = relativeLuminance(bgRgb.r, bgRgb.g, bgRgb.b);

    for (const fgDef of pair.fg) {
      const fgKey = typeof fgDef === 'string' ? fgDef : fgDef.key;
      const minContrast = typeof fgDef === 'string' ? WCAG.AA_NORMAL : fgDef.minContrast;

      const fgColor = colors[fgKey];
      if (!fgColor) continue;

      const fgRgb = hexToRgb(fgColor);
      if (!fgRgb) continue;
      const fgLum = relativeLuminance(fgRgb.r, fgRgb.g, fgRgb.b);

      const contrast = contrastRatio(fgLum, bgLum);
      const apca = calcAPCA(fgColor, bgColor);
      const fgHsb = rgbToHsb(fgRgb.r, fgRgb.g, fgRgb.b);
      const status = getStatus(contrast, minContrast);
      const wcagLevel = getWcagLevel(contrast);

      results.pairs.push({
        background: { key: pair.bg, color: bgColor },
        foreground: { key: fgKey, color: fgColor, saturation: Math.round(fgHsb.s * 100) },
        contrast: Math.round(contrast * 100) / 100,
        apca,
        minRequired: minContrast,
        status,
        wcag: wcagLevel,
      });

      results.summary.total++;
      results.summary[status]++;
    }
  }

  // tokenColorsのチェック (エディタ背景に対して)
  const editorBg = colors['editor.background'];
  if (editorBg) {
    const editorRgb = hexToRgb(editorBg);
    if (editorRgb) {
      const editorLum = relativeLuminance(editorRgb.r, editorRgb.g, editorRgb.b);

      for (const tokenDef of TOKEN_SCOPES) {
        const tokenRule = findTokenRule(tokenColors, tokenDef.scope);
        if (!tokenRule || !tokenRule.settings || !tokenRule.settings.foreground) continue;

        const fgColor = tokenRule.settings.foreground;
        const fgRgb = hexToRgb(fgColor);
        if (!fgRgb) continue;

        const fgLum = relativeLuminance(fgRgb.r, fgRgb.g, fgRgb.b);
        const contrast = contrastRatio(fgLum, editorLum);
        const apca = calcAPCA(fgColor, editorBg);
        const fgHsb = rgbToHsb(fgRgb.r, fgRgb.g, fgRgb.b);
        const status = getStatus(contrast, tokenDef.minContrast);

        results.tokens.push({
          scope: tokenDef.scope,
          color: fgColor,
          saturation: Math.round(fgHsb.s * 100),
          contrast: Math.round(contrast * 100) / 100,
          apca,
          minRequired: tokenDef.minContrast,
          status,
        });

        results.summary.total++;
        results.summary[status]++;
      }
    }
  }

  return results;
}

function getStatus(contrast, threshold) {
  if (contrast >= threshold) return 'pass';
  if (contrast >= threshold * 0.8) return 'warn';
  return 'fail';
}

function getWcagLevel(contrast) {
  if (contrast >= WCAG.AAA_NORMAL) return 'AAA';
  if (contrast >= WCAG.AA_NORMAL) return 'AA';
  if (contrast >= WCAG.AA_LARGE) return 'AA-large';
  return 'fail';
}

function findTokenRule(tokenColors, scope) {
  for (const rule of tokenColors) {
    if (!rule.scope) continue;
    const scopes = Array.isArray(rule.scope) ? rule.scope : [rule.scope];
    if (scopes.some((s) => s === scope || s.startsWith(scope + '.'))) {
      return rule;
    }
  }
  return null;
}

// メイン実行
const args = process.argv.slice(2);

if (args.length === 0) {
  console.error('Error: At least one theme file is required.\n');
  console.error('Usage: node utils/check-contrast.js <theme-file> [theme-file...]');
  console.error('Example: node utils/check-contrast.js themes/elypink-light.json');
  process.exit(1);
}

// 引数から themes/ プレフィックスを除去
const targetThemes = args.map(arg => {
  const basename = path.basename(arg);
  return basename;
});

const allResults = [];

for (const themeFile of targetThemes) {
  const themePath = path.join(__dirname, '..', 'themes', themeFile);
  if (!fs.existsSync(themePath)) {
    console.error(`Skipping: ${themeFile} (not found)`);
    continue;
  }
  const result = checkContrast(themeFile);
  allResults.push(result);
}

// JSON出力
const output = {
  generated: new Date().toISOString(),
  themes: allResults,
};

const outputPath = path.join(__dirname, '..', 'contrast-report.json');
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2) + '\n');
console.log(`Report saved: contrast-report.json`);

// サマリーをコンソールに表示
for (const result of allResults) {
  const { theme, summary } = result;
  const statusIcon = summary.fail > 0 ? '\u274C' : summary.warn > 0 ? '\u26A0\uFE0F' : '\u2705';
  console.log(`${statusIcon} ${theme}: ${summary.pass}/${summary.total} pass, ${summary.warn} warn, ${summary.fail} fail`);
}
