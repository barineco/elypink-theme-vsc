/**
 * fn_dark: Light → Dark テーマ変換
 *
 * 明度マッピングによりライトテーマをダークテーマに変換する
 */

const { hexToRgb, rgbToHex, rgbToHsb, hsbToRgb } = require('./color-utils');

const MAPPING = {
  // 背景: Light B 92-100 → Dark B 10-20
  background: {
    lightMin: 0.80,
    lightMax: 1.00,
    darkMin: 0.10,
    darkMax: 0.20,
    saturationFactor: 3.0,
  },
  // テキスト: Light B 25-72 → Dark B 95-50 (反転)
  foreground: {
    lightMin: 0.25,
    lightMax: 0.75,
    darkMin: 1.00,
    darkMax: 0.60,
    saturationFactor: 1.2,
  },
  // ハイライト/アクセント
  highlight: {
    saturationFactor: 0.8,
    brightnessFactor: 1.1,
  },
  // ターミナル背景: B 42 → B 22程度
  terminalBackground: {
    brightnessFactor: 0.5,
    saturationFactor: 1.1,
  },
  // ターミナルANSI
  terminalAnsi: {
    anchorBrightness: 1.0,
    targetAnchor: 1.0,
    saturationFactor: 1.2,
  },
  // ボーダー: Light B 75-100 → Dark B 35-60
  border: {
    lightMin: 0.75,
    lightMax: 1.00,
    darkMin: 0.35,
    darkMax: 0.60,
    saturationFactor: 1.0,
  },
};

function classifyKey(key) {
  // ターミナル
  if (key === 'terminal.background') return 'terminalBackground';
  if (key.startsWith('terminal.ansi')) return 'terminalAnsi';
  if (key === 'terminal.foreground') return 'terminalForeground';
  if (key.startsWith('terminal.')) return 'terminalOther';

  // 白テキスト (維持)
  if (key.endsWith('.foreground') || key.endsWith('Foreground')) {
    if (['activityBarBadge.foreground', 'statusBarItem.remoteForeground',
         'statusBarItem.remoteHoverForeground', 'button.foreground',
         'badge.foreground'].includes(key)) {
      return 'preserve';
    }
  }

  // ハイライト/アクセント色
  if (key.includes('editorBracketHighlight.foreground') ||
      key.startsWith('editorGutter.') ||
      key.startsWith('gitDecoration.') ||
      ['panelTitle.activeBorder', 'panelTitle.activeForeground',
       'tab.activeBackground', 'tab.activeBorder', 'tab.activeForeground'].includes(key)) {
    return 'highlight';
  }

  // badge/button背景 (維持)
  if (['badge.background', 'activityBarBadge.background',
       'button.background', 'button.hoverBackground',
       'statusBarItem.remoteBackground', 'statusBarItem.remoteHoverBackground'].includes(key)) {
    return 'preserve';
  }

  // ボーダー
  if (key.toLowerCase().includes('border') || key === 'focusBorder') {
    return 'border';
  }

  // 背景
  if (key.toLowerCase().includes('background') ||
      key === 'progressBar.background' ||
      key === 'selection.background') {
    return 'background';
  }

  // テキスト
  if (key.toLowerCase().includes('foreground')) {
    return 'foreground';
  }

  // その他は背景として扱う
  return 'background';
}

function mapRange(value, inMin, inMax, outMin, outMax) {
  if (value <= inMin) return outMin;
  if (value >= inMax) return outMax;
  return outMin + (value - inMin) * (outMax - outMin) / (inMax - inMin);
}

function transformColor(hexColor, category) {
  const rgb = hexToRgb(hexColor);
  if (!rgb) return hexColor;

  const hsb = rgbToHsb(rgb.r, rgb.g, rgb.b);
  let newH = hsb.h;
  let newS = hsb.s;
  let newB = hsb.b;

  switch (category) {
    case 'background': {
      const m = MAPPING.background;
      newB = mapRange(hsb.b, m.lightMin, m.lightMax, m.darkMin, m.darkMax);
      newS = Math.min(1, hsb.s * m.saturationFactor);
      break;
    }
    case 'foreground': {
      const m = MAPPING.foreground;
      newB = mapRange(hsb.b, m.lightMin, m.lightMax, m.darkMin, m.darkMax);
      newS = Math.min(1, hsb.s * m.saturationFactor);
      break;
    }
    case 'highlight': {
      const m = MAPPING.highlight;
      newS = Math.min(1, hsb.s * m.saturationFactor);
      newB = Math.min(1, hsb.b * m.brightnessFactor);
      break;
    }
    case 'terminalBackground': {
      const m = MAPPING.terminalBackground;
      newB = hsb.b * m.brightnessFactor;
      newS = Math.min(1, hsb.s * m.saturationFactor);
      break;
    }
    case 'terminalAnsi': {
      const m = MAPPING.terminalAnsi;
      newS = Math.min(1, hsb.s * m.saturationFactor);
      newB = hsb.b;
      break;
    }
    case 'terminalForeground': {
      break;
    }
    case 'terminalOther': {
      newB = Math.min(0.6, hsb.b * 0.7);
      newS = Math.min(1, hsb.s * 1.1);
      break;
    }
    case 'border': {
      const m = MAPPING.border;
      newB = mapRange(hsb.b, m.lightMin, m.lightMax, m.darkMin, m.darkMax);
      newS = Math.min(1, hsb.s * m.saturationFactor);
      break;
    }
    case 'preserve':
    default:
      break;
  }

  const newRgb = hsbToRgb(newH, newS, newB);
  return rgbToHex(newRgb.r, newRgb.g, newRgb.b, rgb.a);
}

function transformColors(colors) {
  const result = {};
  for (const [key, value] of Object.entries(colors)) {
    if (typeof value !== 'string' || !value.match(/^#[0-9A-Fa-f]{6,8}$/)) {
      result[key] = value;
      continue;
    }
    const category = classifyKey(key);
    result[key] = transformColor(value, category);
  }
  return result;
}

function transformTokenColors(tokenColors) {
  return tokenColors.map((token) => {
    if (!token.settings) return token;

    const newSettings = { ...token.settings };
    if (newSettings.foreground && newSettings.foreground.match(/^#[0-9A-Fa-f]{6,8}$/)) {
      const rgb = hexToRgb(newSettings.foreground);
      if (rgb) {
        const hsb = rgbToHsb(rgb.r, rgb.g, rgb.b);
        const newB = Math.min(0.95, 0.70 + hsb.b * 0.3);
        const newS = Math.min(1, hsb.s * 1.0);
        const newRgb = hsbToRgb(hsb.h, newS, newB);
        newSettings.foreground = rgbToHex(newRgb.r, newRgb.g, newRgb.b, rgb.a);
      }
    }
    return { ...token, settings: newSettings };
  });
}

/**
 * ライトテーマをダークテーマに変換
 * @param {Object} theme - テーマオブジェクト
 * @returns {Object} - 変換されたダークテーマ
 */
function dark(theme) {
  const result = JSON.parse(JSON.stringify(theme));

  result.name = result.name.replace('Light', 'Dark');
  result.type = 'dark';

  if (result.colors) {
    result.colors = transformColors(result.colors);
  }
  if (result.tokenColors) {
    result.tokenColors = transformTokenColors(result.tokenColors);
  }

  return result;
}

module.exports = { dark };
