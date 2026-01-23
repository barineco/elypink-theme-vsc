#!/usr/bin/env node

/**
 * Elypink Theme Generator
 *
 * 関数合成によるテーマ生成
 *
 * 生成フロー:
 *   LIGHT_MASTER (source)
 *   │
 *   ├─ LIGHT        = DESATURATE(LIGHT_MASTER)
 *   ├─ LIGHT_FADED  = HUEMIRROR(LIGHT_MASTER)
 *   ├─ LIGHT_SPRING = SPRING(LIGHT_MASTER)
 *   ├─ LIGHT_SUMMER = SUMMER(LIGHT_MASTER)
 *   ├─ LIGHT_DIAMOND= DIAMOND(LIGHT_MASTER)
 *   │
 *   └─ DARK_MASTER  = DARK(LIGHT_MASTER)
 *        ├─ DARK       = DESATURATE(DARK_MASTER)
 *        └─ DARK_FADED = HUEMIRROR(DARK_MASTER)
 */

const fs = require('fs');
const path = require('path');

// 変換関数
const { dark } = require('./lib/fn_dark');
const { desaturate } = require('./lib/fn_desaturate');
const { huemirror } = require('./lib/fn_huemirror');
const { spring, summer, diamond } = require('./lib/fn_seasonal');

const THEMES_DIR = path.join(__dirname, '..', 'themes');

// ファイル読み書き
const read = (filename) => {
  const filepath = path.join(THEMES_DIR, filename);
  return JSON.parse(fs.readFileSync(filepath, 'utf8'));
};

const write = (filename, theme) => {
  const filepath = path.join(THEMES_DIR, filename);
  fs.writeFileSync(filepath, JSON.stringify(theme, null, 2) + '\n');
  console.log(`  → ${filename}`);
};

// ===== 生成定義 =====

const GENERATION = {
  // ソース
  source: 'elypink-light-master.json',

  // 出力定義: [出力ファイル名, 変換関数, テーマ名]
  outputs: [
    // Light variants
    ['elypink-light.json',         (t) => desaturate(t, 'Elypink Light')],
    ['elypink-light-faded.json',   (t) => huemirror(t, 'Elypink Light (Faded)')],
    ['elypink-light-spring.json',  spring],
    ['elypink-light-summer.json',  summer],
    ['elypink-light-diamond.json', diamond],

    // Dark master (intermediate)
    ['elypink-dark-master.json',   dark],
  ],

  // Dark variants (derived from dark-master)
  darkOutputs: [
    ['elypink-dark.json',          (t) => desaturate(t, 'Elypink Dark')],
    ['elypink-dark-faded.json',    (t) => huemirror(t, 'Elypink Dark (Faded)')],
  ],
};

// ===== メイン =====

console.log('=== Elypink Theme Generation ===\n');
console.log(`Source: ${GENERATION.source}\n`);

// Light master を読み込み
const lightMaster = read(GENERATION.source);

console.log('Light variants:');
let darkMaster = null;

for (const [filename, transform] of GENERATION.outputs) {
  const result = transform(lightMaster);
  write(filename, result);

  // dark-master を保持
  if (filename === 'elypink-dark-master.json') {
    darkMaster = result;
  }
}

console.log('\nDark variants:');

for (const [filename, transform] of GENERATION.darkOutputs) {
  const result = transform(darkMaster);
  write(filename, result);
}

console.log('\n=== Done! ===');
