#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { processColors } = require('./lib/color-utils');

const SATURATION_SCALE = 0.8;

// 彩度を落とす変換関数
const desaturateTransformer = (hsb) => ({
  h: hsb.h,
  s: hsb.s * SATURATION_SCALE,
  b: hsb.b,
});

// メイン
function generateSubtle(inputFile) {
  const themesDir = path.join(__dirname, '..', 'themes');
  const inputPath = path.join(themesDir, inputFile);
  if (!fs.existsSync(inputPath)) {
    console.log(`Skipping: ${inputFile} (not found)`);
    return;
  }
  const outputFile = inputFile.replace('.json', '-subtle.json');
  const outputPath = path.join(themesDir, outputFile);
  const theme = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  // テーマ名を更新
  theme.name = theme.name + ' Subtle';
  // 色を処理
  if (theme.colors) {
    theme.colors = processColors(theme.colors, desaturateTransformer);
  }
  if (theme.tokenColors) {
    theme.tokenColors = processColors(theme.tokenColors, desaturateTransformer);
  }
  fs.writeFileSync(outputPath, JSON.stringify(theme, null, 2) + '\n');
  console.log(`Generated: ${outputFile}`);
}

// 対象ファイル
const targets = ['elypink-light.json', 'elypink-dark.json'];

console.log(`Saturation scale: ${SATURATION_SCALE}`);
targets.forEach(generateSubtle);
console.log('Done!');
