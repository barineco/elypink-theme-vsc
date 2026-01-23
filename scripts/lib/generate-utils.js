const fs = require('fs');
const path = require('path');

const THEMES_DIR = path.join(__dirname, '..', '..', 'themes');

// 読み込み
function loadTheme(filename) {
  const filepath = path.join(THEMES_DIR, filename);
  if (!fs.existsSync(filepath)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(filepath, 'utf8'));
}

// 保存
function saveTheme(filename, theme) {
  const filepath = path.join(THEMES_DIR, filename);
  fs.writeFileSync(filepath, JSON.stringify(theme, null, 2) + '\n');
}

// テーマ生成共通ラッパー
function generateTheme(inputFile, config) {
  const {
    outputPattern,
    nameTransformer,
    typeTransformer,
    colorTransformer,
    tokenTransformer,
    postProcess,
  } = config;

  const theme = loadTheme(inputFile);
  if (!theme) {
    console.log(`Skipping: ${inputFile} (not found)`);
    return null;
  }

  const outputFile = outputPattern(inputFile);

  // テーマ名を変換
  if (nameTransformer) {
    theme.name = nameTransformer(theme.name);
  }

  // テーマタイプを変換
  if (typeTransformer) {
    theme.type = typeTransformer(theme.type);
  }

  // colors を変換
  if (colorTransformer && theme.colors) {
    theme.colors = colorTransformer(theme.colors);
  }

  // tokenColors を変換
  if (tokenTransformer && theme.tokenColors) {
    theme.tokenColors = tokenTransformer(theme.tokenColors);
  }

  // 後処理
  if (postProcess) {
    postProcess(theme);
  }

  saveTheme(outputFile, theme);
  console.log(`Generated: ${outputFile}`);

  return theme;
}

// 明度範囲マッピング
function mapRange(value, inMin, inMax, outMin, outMax) {
  if (value <= inMin) return outMin;
  if (value >= inMax) return outMax;
  return outMin + (value - inMin) * (outMax - outMin) / (inMax - inMin);
}

module.exports = {
  THEMES_DIR,
  loadTheme,
  saveTheme,
  generateTheme,
  mapRange,
};
