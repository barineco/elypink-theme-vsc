#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { processColors, ensureContrast } = require('./lib/color-utils');

const SATURATION_SCALE = 0.95;
const BRIGHTNESS_SCALE = 0.95;

// 色相反転: 90度を軸に反転 (h' = 180 - h)
function mirrorHue(h) {
  let newH = 180 - h;
  if (newH < 0) newH += 360;
  return newH;
}


// UI色用: 色相反転 + 彩度・明度調整
const uiColorTransformer = (hsb) => {
  return {
    h: mirrorHue(hsb.h),
    s: hsb.s * SATURATION_SCALE,
    b: hsb.b * BRIGHTNESS_SCALE,
  };
};

// トークン色用: 色相反転 + 明度調整のみ (彩度維持)
const tokenColorTransformer = (hsb) => {
  return {
    h: mirrorHue(hsb.h),
    s: hsb.s,
    b: hsb.b * BRIGHTNESS_SCALE,
  };
};

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
    // gitDecoration色を保存（色相変換しない）
    const gitDecorationKeys = Object.keys(theme.colors).filter(k => k.startsWith('gitDecoration'));
    const gitDecorationColors = {};
    for (const key of gitDecorationKeys) {
      gitDecorationColors[key] = theme.colors[key];
    }

    // UI色: 色相反転 + 彩度・明度調整
    theme.colors = processColors(theme.colors, uiColorTransformer);

    // gitDecoration色を復元（色相はそのまま）
    for (const key of gitDecorationKeys) {
      theme.colors[key] = gitDecorationColors[key];
    }
  }
  if (theme.tokenColors) {
    theme.tokenColors = processColors(theme.tokenColors, tokenColorTransformer);
    // コントラスト調整: 役割別に目標コントラストを設定
    const bgColor = theme.colors['editor.background'];
    // 目標 1.5:1
    const subtleScopes = ['comment', 'punctuation.definition.comment'];
    // 目標 2.0:1
    const mainScopes = [
      'string', 'string.quoted', 'string.regexp',
      'keyword', 'keyword.control', 'storage.type', 'storage.modifier',
      'entity.name.function', 'support.function',
      'entity.name.class', 'entity.name.type', 'support.class', 'support.type',
      'constant', 'constant.language', 'constant.numeric',
      'entity.name.tag', 'entity.other.attribute-name',
      'meta.decorator', 'punctuation.decorator',
      'markup.heading', 'markup.inline.raw',
    ];

    theme.tokenColors = theme.tokenColors.map(token => {
      if (!token.settings?.foreground || !token.scope) return token;

      const scopes = Array.isArray(token.scope) ? token.scope : [token.scope];
      const isSubtle = scopes.some(s => subtleScopes.some(sub => s.includes(sub)));
      const isMain = scopes.some(s => mainScopes.some(main => s.includes(main)));

      let targetContrast = null;
      if (isSubtle) {
        targetContrast = 1.5;
      } else if (isMain) {
        targetContrast = 2.0;
      }

      if (targetContrast) {
        const adjusted = ensureContrast(token.settings.foreground, bgColor, targetContrast);
        return {
          ...token,
          settings: { ...token.settings, foreground: adjusted }
        };
      }
      return token;
    });
  }

  // UI色のコントラスト調整
  if (theme.colors) {
    const editorBg = theme.colors['editor.background'];

    // ブラケット色 (目標 2.2:1)
    for (let i = 1; i <= 6; i++) {
      const key = `editorBracketHighlight.foreground${i}`;
      if (theme.colors[key]) {
        theme.colors[key] = ensureContrast(theme.colors[key], editorBg, 2.2);
      }
    }

    // 薄い foreground (目標 1.8:1)
    const subtleForegrounds = [
      'editorLineNumber.foreground',
      'input.placeholderForeground',
      'panelTitle.inactiveForeground',
      'gitDecoration.ignoredResourceForeground',
      'activityBar.inactiveForeground',
      'commandCenter.inactiveForeground',
    ];

    // メイン foreground (目標 2.5:1)
    const mainForegrounds = [
      'sideBarTitle.foreground',
      'sideBarSectionHeader.foreground',
      'activityBar.foreground',
      'editorLineNumber.activeForeground',
      'tab.inactiveForeground',
      'list.highlightForeground',
      'panelTitle.activeForeground',
      'textLink.foreground',
      'textLink.activeForeground',
      'editorCursor.foreground',
    ];

    // 背景とペアでコントラスト調整
    const bgPairs = {
      'sideBar.foreground': 'sideBar.background',
      'sideBarTitle.foreground': 'sideBar.background',
      'sideBarSectionHeader.foreground': 'sideBarSectionHeader.background',
      'activityBar.foreground': 'activityBar.background',
      'activityBar.inactiveForeground': 'activityBar.background',
    };

    for (const key of subtleForegrounds) {
      if (theme.colors[key]) {
        const bg = bgPairs[key] ? theme.colors[bgPairs[key]] : editorBg;
        theme.colors[key] = ensureContrast(theme.colors[key], bg, 1.8);
      }
    }

    for (const key of mainForegrounds) {
      if (theme.colors[key]) {
        const bg = bgPairs[key] ? theme.colors[bgPairs[key]] : editorBg;
        theme.colors[key] = ensureContrast(theme.colors[key], bg, 2.5);
      }
    }
  }

  fs.writeFileSync(outputPath, JSON.stringify(theme, null, 2) + '\n');
  console.log(`Generated: ${outputFile}`);
}

// 対象ファイル
const targets = ['elypink-light.json', 'elypink-dark.json'];

console.log('Hue mirror: 90° axis (h\' = 180 - h)');
targets.forEach(generateQinshi);
console.log('Done!');
