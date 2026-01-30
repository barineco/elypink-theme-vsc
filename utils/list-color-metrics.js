#!/usr/bin/env node

/**
 * list-color-metrics.js - YMLアンカーから一覧表示
 * 各色について HSB / Luminance / APCA
 * node utils/list-color-metrics.js [light|dark]
 */

const fs = require('fs');
const path = require('path');
const { hexToRgb, rgbToHsb, relativeLuminance, calcAPCA } = require('../scripts/lib/color-utils');
const { getMetrics, findColorForAPCA, findSelectionBgForAPCA, separator } = require('../scripts/lib/report-utils');

const mode = process.argv[2] || 'light';
const isLight = mode === 'light';
const prefix = isLight ? 'LIGHT' : 'DARK';

const masterFile = path.join(__dirname, '..', 'src', 'themes', `${mode}-master.yml`);
const content = fs.readFileSync(masterFile, 'utf8');

function extractAnchors(yml) {
  const anchors = {};
  const regex = /^([A-Z][A-Z0-9_]+):\s*&[A-Z][A-Z0-9_]+\s*'(#[0-9A-Fa-f]{6,8})'/gm;
  let match;
  while ((match = regex.exec(yml)) !== null) {
    anchors[match[1]] = match[2];
  }
  return anchors;
}

const anchors = extractAnchors(content);
const editorBg = anchors[`${prefix}_BG_L0`];
const sidebarBg = anchors[`${prefix}_BG_L1`];
const terminalBg = anchors[`${prefix}_TERMINAL_BG`];

const mainHeader = ['Name', 'Hex', 'H', 'S', 'B', 'Lum', 'APCA', '→50', '→55', '→60']
  .map((h, i) => i === 0 ? h.padEnd(32) : i === 1 ? h.padEnd(9) : h.padStart(i < 7 ? 6 : 10))
  .join('\t');

const bgHeader = ['Name', 'Hex', 'H', 'S', 'B', 'Lum']
  .map((h, i) => i === 0 ? h.padEnd(30) : i === 1 ? h.padEnd(9) : h.padStart(i < 6 ? 4 : 6))
  .join('\t');

function printColorTable(colors, bgHex, showSuggestions = true) {
  console.log(separator());
  console.log(mainHeader);
  console.log(separator());

  for (const { name, hex } of colors) {
    const m = getMetrics(hex, bgHex);
    if (!m) continue;

    const absAPCA = Math.abs(m.apca);
    const sug50 = showSuggestions && absAPCA < 50 ? findColorForAPCA(hex, bgHex, 50, isLight) : null;
    const sug55 = showSuggestions && absAPCA < 55 ? findColorForAPCA(hex, bgHex, 55, isLight) : null;
    const sug60 = showSuggestions && absAPCA < 60 ? findColorForAPCA(hex, bgHex, 60, isLight) : null;

    const row = [
      name.padEnd(32),
      hex.padEnd(9),
      String(m.h).padStart(4),
      String(m.s).padStart(4),
      String(m.b).padStart(4),
      String(m.lum).padStart(6),
      String(m.apca).padStart(6),
      (sug50 || '-').padStart(10),
      (sug55 || '-').padStart(10),
      (sug60 || '-').padStart(10),
    ].join('\t');

    console.log(row);
  }
}

const groups = {
  'Syntax Colors': [],
  'Editor FG': [],
};

for (const [name, hex] of Object.entries(anchors)) {
  if (name.startsWith('SYN_')) {
    groups['Syntax Colors'].push({ name, hex });
  } else if (name.includes('_FG_')) {
    groups['Editor FG'].push({ name, hex });
  }
}

console.log(`\n=== Color Metrics (${mode}-master.yml) ===`);
console.log(`Editor BG: ${editorBg}\n`);

// Syntax / FG
for (const [groupName, colors] of Object.entries(groups)) {
  if (colors.length === 0) continue;
  colors.sort((a, b) => {
    const ma = getMetrics(a.hex, editorBg);
    const mb = getMetrics(b.hex, editorBg);
    return (ma?.h || 0) - (mb?.h || 0);
  });

  console.log(`\n${groupName}`);
  printColorTable(colors, editorBg);
}

// Selection / Hover Background
console.log(`\nSelection/Hover BG (vs base background)`);
console.log(separator());
const selHeader = ['Pair', 'Selection', 'Base', 'APCA', '→2', '→5', '→8']
  .map((h, i) => i < 3 ? h.padEnd(i === 0 ? 32 : 10) : h.padStart(i === 3 ? 6 : 10))
  .join('\t');
console.log(selHeader);
console.log(separator());

const selectionPairs = [
  { name: 'quickInput (L0 → L2)', baseBg: anchors[`${prefix}_BG_L0`], selectionBg: anchors[`${prefix}_BG_L2`] },
  { name: 'list hover (L1 → L2)', baseBg: anchors[`${prefix}_BG_L1`], selectionBg: anchors[`${prefix}_BG_L2`] },
];

for (const pair of selectionPairs) {
  if (!pair.baseBg || !pair.selectionBg) continue;

  const apca = calcAPCA(pair.selectionBg, pair.baseBg);
  const absAPCA = Math.abs(apca);

  const sug2 = absAPCA < 2 ? findSelectionBgForAPCA(pair.selectionBg, pair.baseBg, 2, isLight) : null;
  const sug5 = absAPCA < 5 ? findSelectionBgForAPCA(pair.selectionBg, pair.baseBg, 5, isLight) : null;
  const sug8 = absAPCA < 8 ? findSelectionBgForAPCA(pair.selectionBg, pair.baseBg, 8, isLight) : null;

  console.log([
    pair.name.padEnd(32),
    pair.selectionBg.padEnd(10),
    pair.baseBg.padEnd(10),
    String(apca).padStart(6),
    (sug2 || '-').padStart(10),
    (sug5 || '-').padStart(10),
    (sug8 || '-').padStart(10),
  ].join('\t'));
}

// Git Sidebar
console.log(`\nGit Sidebar Colors (vs ${prefix}_BG_L1: ${sidebarBg})`);
const gitSidebarColors = [
  `${prefix}_FG_PRIMARY`,
  'SEMANTIC_GIT_UNTRACKED_FG',
  'SEMANTIC_GIT_MODIFIED_FG',
  'SEMANTIC_GIT_DELETED_FG',
  `${prefix}_GIT_IGNORED_FG`,
].filter(name => anchors[name]).map(name => ({ name, hex: anchors[name] }));
printColorTable(gitSidebarColors, sidebarBg);

// Git Gutter Colors
console.log(`\nGit Gutter Colors (vs ${prefix}_BG_L0: ${editorBg})`);
const gitGutterColors = ['SEMANTIC_GIT_ADDED', 'SEMANTIC_GIT_MODIFIED', 'SEMANTIC_GIT_DELETED']
  .filter(name => anchors[name]).map(name => ({ name, hex: anchors[name] }));
printColorTable(gitGutterColors, editorBg);

// FG-BG Mappings
function extractFgBgMappings(yml, anchors) {
  const fgBgPairs = [
    ['editor.foreground', 'editor.background', 'Editor'],
    ['editorLineNumber.foreground', 'editor.background', 'Line Number'],
    ['sideBar.foreground', 'sideBar.background', 'Sidebar'],
    ['activityBar.foreground', 'activityBar.background', 'Activity Bar'],
    ['titleBar.activeForeground', 'titleBar.activeBackground', 'TitleBar Active'],
    ['statusBar.foreground', 'statusBar.background', 'StatusBar'],
    ['commandCenter.foreground', 'commandCenter.background', 'CommandCenter'],
    ['tab.activeForeground', 'editorGroupHeader.tabsBackground', 'Tab Active'],
    ['tab.inactiveForeground', 'tab.inactiveBackground', 'Tab Inactive'],
    ['quickInput.foreground', 'quickInput.background', 'QuickInput'],
    ['input.foreground', 'input.background', 'Input'],
    ['button.foreground', 'button.background', 'Button'],
    ['terminal.foreground', 'terminal.background', 'Terminal'],
  ];

  const keyValueRegex = /^\s+([a-zA-Z.]+):\s*\*([A-Z][A-Z0-9_]+)/gm;
  const keyToAnchor = {};
  let match;
  while ((match = keyValueRegex.exec(yml)) !== null) {
    keyToAnchor[match[1]] = match[2];
  }

  return fgBgPairs
    .map(([fgKey, bgKey, label]) => {
      const fgAnchor = keyToAnchor[fgKey];
      const bgAnchor = keyToAnchor[bgKey];
      if (!fgAnchor || !bgAnchor) return null;
      const fgHex = anchors[fgAnchor];
      const bgHex = anchors[bgAnchor];
      if (!fgHex || !bgHex) return null;
      return { label, fgAnchor, bgAnchor, fgHex, bgHex };
    })
    .filter(Boolean);
}

const fgBgMappings = extractFgBgMappings(content, anchors);

console.log(`\nFG-BG Mappings`);
console.log(separator());
console.log(['Location', 'FG Anchor', 'BG Anchor', 'FG Hex', 'BG Hex', 'BG Lum', 'APCA']
  .map((h, i) => i < 5 ? h.padEnd([22, 28, 22, 10, 10][i]) : h.padStart(7))
  .join('\t'));
console.log(separator());

fgBgMappings.sort((a, b) => {
  const lumA = relativeLuminance(...Object.values(hexToRgb(a.bgHex)).slice(0, 3));
  const lumB = relativeLuminance(...Object.values(hexToRgb(b.bgHex)).slice(0, 3));
  return isLight ? lumB - lumA : lumA - lumB;
});

for (const m of fgBgMappings) {
  const bgRgb = hexToRgb(m.bgHex);
  const bgLum = bgRgb ? relativeLuminance(bgRgb.r, bgRgb.g, bgRgb.b) : 0;
  const apca = calcAPCA(m.fgHex, m.bgHex);

  console.log([
    m.label.padEnd(22),
    m.fgAnchor.padEnd(28),
    m.bgAnchor.padEnd(22),
    m.fgHex.padEnd(10),
    m.bgHex.padEnd(10),
    (Math.round(bgLum * 1000) / 10).toString().padStart(7),
    apca.toString().padStart(7),
  ].join('\t'));
}

// Background
console.log(`\nBackground Colors`);
console.log(separator());
console.log(bgHeader);
console.log(separator());

const bgColors = Object.entries(anchors)
  .filter(([name]) => name.includes('_BG_'))
  .map(([name, hex]) => {
    const rgb = hexToRgb(hex);
    if (!rgb) return null;
    const hsb = rgbToHsb(rgb.r, rgb.g, rgb.b);
    const lum = relativeLuminance(rgb.r, rgb.g, rgb.b);
    return {
      name, hex,
      h: Math.round(hsb.h),
      s: Math.round(hsb.s * 100),
      b: Math.round(hsb.b * 100),
      lum: Math.round(lum * 1000) / 10,
    };
  })
  .filter(Boolean)
  .sort((a, b) => a.lum - b.lum);

for (const bg of bgColors) {
  console.log([
    bg.name.padEnd(30),
    bg.hex.padEnd(9),
    String(bg.h).padStart(4),
    String(bg.s).padStart(4),
    String(bg.b).padStart(4),
    String(bg.lum).padStart(6),
  ].join('\t'));
}

// Terminal
if (terminalBg) {
  console.log(`\nTerminal Colors (vs ${prefix}_TERMINAL_BG: ${terminalBg})`);

  const terminalFg = anchors[`${prefix}_TERMINAL_FG`];
  const ansiColors = [
    'ANSI_BLACK', 'ANSI_RED', 'ANSI_GREEN', 'ANSI_YELLOW',
    'ANSI_BLUE', 'ANSI_MAGENTA', 'ANSI_CYAN', 'ANSI_WHITE',
    'ANSI_BRIGHT_BLACK', 'ANSI_BRIGHT_RED', 'ANSI_BRIGHT_GREEN', 'ANSI_BRIGHT_YELLOW',
    'ANSI_BRIGHT_BLUE', 'ANSI_BRIGHT_MAGENTA', 'ANSI_BRIGHT_CYAN',
  ];

  const termColors = [];
  if (terminalFg) termColors.push({ name: `${prefix}_TERMINAL_FG`, hex: terminalFg });
  for (const colorName of ansiColors) {
    const name = `${prefix}_${colorName}`;
    if (anchors[name]) termColors.push({ name, hex: anchors[name] });
  }

  printColorTable(termColors, terminalBg);
}

console.log(`\n${separator()}`);
console.log('H=Hue(0-360) S=Saturation(%) B=Brightness(%) Lum=Luminance(%) APCA=Lc value');
console.log('APCA: negative=light text on dark bg / positive=dark text on light bg');
console.log('');
