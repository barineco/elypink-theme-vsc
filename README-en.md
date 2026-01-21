# Elypink Theme

A theme addon for Visual Studio Code (and compatible software).


## Theme List

### Light

- Elypink Light — Pink base theme
- Elypink Light Subtle — 20% reduced saturation
- Qinshi Light — Auspicious cyan for hackers

### Dark

- Elypink Dark — Pink dark theme
- Elypink Dark Subtle — 20% reduced saturation dark
- Qinshi Dark — Auspicious cyan for hackers, dark


## Scripts

All themes are generated from a single source file `themes/elypink-light.json` using color transformation scripts.

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
# Execution order
node scripts/generate-dark.js
node scripts/generate-qinshi.js
node scripts/generate-subtle.js
```


## Color Conversion Utility

`scripts/lib/color-utils.js`

``` javascript
const { processColors, hexToRgb, rgbToHex, rgbToHsb, hsbToRgb } = require('./lib/color-utils');

// Recursively transform colors in object with 0.8x saturation
const transformer = (hsb) => ({
  h: hsb.h,         // Hue (0-360)
  s: hsb.s * 0.8,   // Saturation (0-1)
  b: hsb.b,         // Brightness (0-1)
});

theme.colors = processColors(theme.colors, transformer);
```


## Dark Theme Generation `generate-dark.js`

Applies different transformations based on key categories.

- Background (`*background*`, `*border*`, `*shadow*`)
  - Brightness x 0.22 (clamped to 0.06-0.25)
  - Saturation x 2.0

- Foreground (`*foreground*`, `*Foreground*`)
  - Brightness -> 0.7 + b x 0.3
  - Saturation x 1.3

- Selection (`*selectionBackground*`, `*findMatch*`, `*selectionHighlight*`, `*wordHighlight*`)
  - Brightness -> 0.4 + b x 0.3
  - Saturation x 1.2

- Terminal ANSI (`terminal.ansi*`, `terminal.ansiBright*`)
  - Brightness -> 0.75 + b x 0.2
  - Saturation x 1.05

- Terminal Selection (`terminal.selectionBackground`, `terminalOverviewRuler.cursorForeground`)
  - Brightness -> 0.4 + b x 0.3
  - Saturation x 1.2

- Token Colors (tokenColors)
  - Brightness -> 0.75 + b x 0.2
  - Saturation x 1.4

## Cyan Theme Generation `generate-qinshi.js`

Converts to cyan variant via hue rotation.

- General Colors (all keys)
  - Hue -130 degrees (Pink 335 -> Cyan 205)
  - Saturation x 0.7
  - Brightness x 0.9

- Terminal Selection (`terminal.selectionBackground`)
  - Hue +130 degrees (opposite direction)
  - Saturation x 0.7
  - Brightness x 0.9

## Saturation Reduction `generate-subtle.js`

- All Colors (all keys)
  - Saturation x 0.8

## Adding Custom Transformations

Create a new script in `scripts/` to generate your own theme variants.

```javascript
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { processColors } = require('./lib/color-utils');

// Rotate hue by +60 degrees
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

## Build

Personal utility.

Increments version and runs vsce package.

```bash
./build.sh
```

## License

MIT
