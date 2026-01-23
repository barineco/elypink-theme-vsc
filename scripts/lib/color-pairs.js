// 背景-前景ペア定義

const COLOR_PAIRS = [
  // エディタ
  {
    bg: 'editor.background',
    fg: [
      { key: 'editor.foreground', minContrast: 4.5 },
      { key: 'editorLineNumber.foreground', minContrast: 2.0 },
      { key: 'editorLineNumber.activeForeground', minContrast: 3.0 },
      { key: 'editorCursor.foreground', minContrast: 3.0 },
    ],
  },
  // サイドバー
  {
    bg: 'sideBar.background',
    fg: [
      { key: 'sideBar.foreground', minContrast: 4.5 },
      { key: 'sideBarTitle.foreground', minContrast: 3.0 },
      { key: 'gitDecoration.modifiedResourceForeground', minContrast: 3.0 },
      { key: 'gitDecoration.deletedResourceForeground', minContrast: 3.0 },
      { key: 'gitDecoration.untrackedResourceForeground', minContrast: 3.0 },
      { key: 'gitDecoration.ignoredResourceForeground', minContrast: 2.0 },
    ],
  },
  {
    bg: 'sideBarSectionHeader.background',
    fg: [{ key: 'sideBarSectionHeader.foreground', minContrast: 3.0 }],
  },
  // アクティビティバー
  {
    bg: 'activityBar.background',
    fg: [
      { key: 'activityBar.foreground', minContrast: 3.0 },
      { key: 'activityBar.inactiveForeground', minContrast: 2.0 },
    ],
  },
  {
    bg: 'activityBarBadge.background',
    fg: [{ key: 'activityBarBadge.foreground', minContrast: 4.5 }],
  },
  // タイトルバー
  {
    bg: 'titleBar.activeBackground',
    fg: [{ key: 'titleBar.activeForeground', minContrast: 4.5 }],
  },
  {
    bg: 'titleBar.inactiveBackground',
    fg: [{ key: 'titleBar.inactiveForeground', minContrast: 3.0 }],
  },
  // ステータスバー
  {
    bg: 'statusBar.background',
    fg: [{ key: 'statusBar.foreground', minContrast: 3.0 }],
  },
  {
    bg: 'statusBarItem.remoteBackground',
    fg: [{ key: 'statusBarItem.remoteForeground', minContrast: 4.5 }],
  },
  // タブ
  {
    bg: 'tab.activeBackground',
    fg: [{ key: 'tab.activeForeground', minContrast: 4.5 }],
  },
  {
    bg: 'tab.inactiveBackground',
    fg: [{ key: 'tab.inactiveForeground', minContrast: 3.0 }],
  },
  // 入力
  {
    bg: 'input.background',
    fg: [
      { key: 'input.foreground', minContrast: 4.5 },
      { key: 'input.placeholderForeground', minContrast: 2.0 },
    ],
  },
  {
    bg: 'dropdown.background',
    fg: [{ key: 'dropdown.foreground', minContrast: 4.5 }],
  },
  // コマンドセンター
  {
    bg: 'commandCenter.background',
    fg: [
      { key: 'commandCenter.foreground', minContrast: 3.0 },
      { key: 'commandCenter.inactiveForeground', minContrast: 2.0 },
    ],
  },
  {
    bg: 'commandCenter.activeBackground',
    fg: [{ key: 'commandCenter.activeForeground', minContrast: 4.5 }],
  },
  // クイック入力
  {
    bg: 'quickInput.background',
    fg: [{ key: 'quickInput.foreground', minContrast: 4.5 }],
  },
  {
    bg: 'quickInputList.focusBackground',
    fg: [{ key: 'quickInputList.focusForeground', minContrast: 4.5 }],
  },
  // リスト
  {
    bg: 'list.activeSelectionBackground',
    fg: [{ key: 'list.activeSelectionForeground', minContrast: 4.5 }],
  },
  // パネル
  {
    bg: 'panel.background',
    fg: [
      { key: 'panelTitle.activeForeground', minContrast: 3.0 },
      { key: 'panelTitle.inactiveForeground', minContrast: 2.0 },
    ],
  },
  // ターミナル
  {
    bg: 'terminal.background',
    fg: [
      { key: 'terminal.foreground', minContrast: 4.5 },
      { key: 'terminal.ansiBlack', minContrast: 3.0 },
      { key: 'terminal.ansiRed', minContrast: 3.0 },
      { key: 'terminal.ansiGreen', minContrast: 3.0 },
      { key: 'terminal.ansiYellow', minContrast: 3.0 },
      { key: 'terminal.ansiBlue', minContrast: 3.0 },
      { key: 'terminal.ansiMagenta', minContrast: 3.0 },
      { key: 'terminal.ansiCyan', minContrast: 3.0 },
      { key: 'terminal.ansiWhite', minContrast: 3.0 },
      { key: 'terminal.ansiBrightBlack', minContrast: 2.5 },
      { key: 'terminal.ansiBrightRed', minContrast: 3.0 },
      { key: 'terminal.ansiBrightGreen', minContrast: 3.0 },
      { key: 'terminal.ansiBrightYellow', minContrast: 3.0 },
      { key: 'terminal.ansiBrightBlue', minContrast: 3.0 },
      { key: 'terminal.ansiBrightMagenta', minContrast: 3.0 },
      { key: 'terminal.ansiBrightCyan', minContrast: 3.0 },
      { key: 'terminal.ansiBrightWhite', minContrast: 3.0 },
    ],
  },
  // ボタン
  {
    bg: 'button.background',
    fg: [{ key: 'button.foreground', minContrast: 4.5 }],
  },
  // バッジ
  {
    bg: 'badge.background',
    fg: [{ key: 'badge.foreground', minContrast: 4.5 }],
  },
];

// tokenColors用: エディタ背景に対して表示される
const TOKEN_SCOPES = [
  { scope: 'comment', minContrast: 3.0 },
  { scope: 'string', minContrast: 4.0 },
  { scope: 'constant.numeric', minContrast: 3.0 },
  { scope: 'keyword', minContrast: 3.0 },
  { scope: 'entity.name.function', minContrast: 3.0 },
  { scope: 'entity.name.class', minContrast: 3.0 },
  { scope: 'variable', minContrast: 4.0 },
  { scope: 'punctuation', minContrast: 3.0 },
];

// WCAG基準
const WCAG = {
  AA_NORMAL: 4.5,
  AA_LARGE: 3.0,
  AAA_NORMAL: 7.0,
  AAA_LARGE: 4.5,
};

module.exports = {
  COLOR_PAIRS,
  TOKEN_SCOPES,
  WCAG,
};
