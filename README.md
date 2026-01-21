# Elypink Theme

Visual Studio Code (および互換ソフトウェア) 用のテーマアドオンです。


## テーマ一覧

### ライト

- Elypink Light — ピンクのベーステーマ
- Elypink Light Subtle — 彩度二割引き版
- Qinshi Light — ハッカーには縁起の良いシアン

### ダーク

- Elypink Dark — ピンクのダークテーマ
- Elypink Dark Subtle — 彩度二割引きのダーク版
- Qinshi Dark — ハッカーには縁起の良いシアン・ダーク版


## スクリプト

単一のソースファイル `themes/elypink-light.json` をベースとし、他のテーマはすべてこのファイルから色変換スクリプトで作成されます。

``` mermaid
flowchart LR
    L["Elypink Light"] -->|"dark"| D["Elypink Dark"]

    L -->|"subtle"| LS["Elypink Light Subtle"]
    L -->|"qinshi"| LQ["Qinshi Light"]

    D -->|"subtle"| DS["Elypink Dark Subtle"]
    D -->|"qinshi"| DQ["Qinshi Dark"]

    style L fill:#F9EBF2,stroke:#B25A7F,color:#5A4751
    style D fill:#373134,stroke:#E85392,color:#CD95B3
    style LS fill:#F9EEF3,stroke:#B26C89,color:#5A4B53
    style LQ fill:#D7DDE0,stroke:#6989A0,color:#454D51
    style DS fill:#373235,stroke:#E871A3,color:#CDA0B8
    style DQ fill:#2E3032,stroke:#73AAD1,color:#95AEB9
```

``` bash
# 実行順序
node scripts/generate-dark.js
node scripts/generate-qinshi.js
node scripts/generate-subtle.js
```


## 色変換ユーティリティ

`scripts/lib/color-utils.js` 

``` javascript
const { processColors, hexToRgb, rgbToHex, rgbToHsb, hsbToRgb } = require('./lib/color-utils');

// オブジェクト内の色を再起的に彩度0.8倍に変換
const transformer = (hsb) => ({
  h: hsb.h,         // 色相 (0-360)
  s: hsb.s * 0.8,   // 彩度 (0-1)
  b: hsb.b,         // 明度 (0-1)
});

theme.colors = processColors(theme.colors, transformer);
```


## ダークテーマ作成 `generate-dark.js`

キーのカテゴリ別に異なる変換を適用。

- 背景 (`*background*`, `*border*`, `*shadow*`)
  - 明度 × 0.22 (0.06〜0.25)
  - 彩度 × 2.0

- 前景 (`*foreground*`, `*Foreground*`)
  - 明度 → 0.7 + b × 0.3
  - 彩度 × 1.3

- 選択範囲 (`*selectionBackground*`, `*findMatch*`, `*selectionHighlight*`, `*wordHighlight*`)
  - 明度 → 0.4 + b × 0.3
  - 彩度 × 1.2

- ターミナル ANSI (`terminal.ansi*`, `terminal.ansiBright*`)
  - 明度 → 0.75 + b × 0.2
  - 彩度 × 1.05

- ターミナル選択範囲 (`terminal.selectionBackground`, `terminalOverviewRuler.cursorForeground`)
  - 明度 → 0.4 + b × 0.3
  - 彩度 × 1.2

- トークン色 (tokenColors)
  - 明度 → 0.75 + b × 0.2
  - 彩度 × 1.4

## シアンテーマ作成 `generate-qinshi.js`

色相回転によりシアン系に変換する。

- 一般色 (全キー)
  - 色相 −130° (ピンク 335° → シアン 205°)
  - 彩度 × 0.7
  - 明度 × 0.9

- ターミナル選択範囲 (`terminal.selectionBackground`)
  - 色相 +130° (一般色と逆方向)
  - 彩度 × 0.7
  - 明度 × 0.9

## 彩度低減 `generate-subtle.js`

- 全ての色 (全キー)
  - 彩度 × 0.8

## カスタム変換の追加

`scripts/` に新しいスクリプトを作成して、独自のテーマバリアントを生成できます。

```javascript
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { processColors } = require('./lib/color-utils');

// 色相を +60° 回転
const transformer = (hsb) => ({
  h: (hsb.h + 60) % 360,
  s: hsb.s,
  b: hsb.b,
});

const themesDir = path.join(__dirname, '..', 'themes');
const theme = JSON.parse(fs.readFileSync(path.join(themesDir, 'elypink-light.json'), 'utf8'));

theme.name = theme.name + ' Custom';
theme.colors = processColors(theme.colors, transformer);
theme.tokenColors = processColors(theme.tokenColors, transformer);

fs.writeFileSync(path.join(themesDir, 'elypink-light-custom.json'), JSON.stringify(theme, null, 2) + '\n');
```

## ビルド

個人用ユーティリティ。

バージョンをインクリメントして vsce package を実行。

```bash
./build.sh
```

## ライセンス

MIT
