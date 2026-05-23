// PuzzleVerse — shared design tokens, icons, and atoms.
// Every screen imports this via window.PV / window.Ico / window.Glyph / window.PVAtoms.
//
// Light + dark palettes share the same token shape. `setPVMode('dark'|'light')`
// mutates the live `window.PV` object in place so existing renders pick up the
// new values on next React render — no prop drilling needed.

const PV_LIGHT = {
  bg:       '#FBF6EE',
  surface:  '#FFFFFF',
  ink:      '#1E1A14',
  inkSoft:  '#5A5247',
  inkMuted: '#9A9183',
  divider:  '#EDE5D6',
  rule:     '#F3ECDD',
  cellHi:   '#FCF7E4', // sudoku same-row/col/box highlight
  // Category tiles in light: tile=pastel, ink=deep text on tile.
  // `accent` is the bright pastel for decorative use OUTSIDE a tile (e.g. background blobs).
  word:    { bg: '#FFE0CC', ink: '#7A3A12', soft: '#FFD2B5', accent: '#FFE0CC' },
  number:  { bg: '#D8ECD4', ink: '#27502F', soft: '#C3E0BD', accent: '#D8ECD4' },
  logic:   { bg: '#FFEDB8', ink: '#6B4B08', soft: '#FFE49C', accent: '#FFEDB8' },
  visual:  { bg: '#E3D8FF', ink: '#382673', soft: '#D2C2FF', accent: '#E3D8FF' },
  classic: { bg: '#CFE3F5', ink: '#1F4263', soft: '#B9D5EF', accent: '#CFE3F5' },
  success: '#3A8A4A',
  danger:  '#C0432F',
  // Tab bar background & inactive surface need contrast vs page bg
  surface2: '#F3ECDD',
};

const PV_DARK = {
  bg:       '#16110A', // deep warm espresso
  surface:  '#221C13', // raised card
  ink:      '#FBF6EE', // cream — now the type color
  inkSoft:  '#CFC6B3',
  inkMuted: '#857B6C',
  divider:  '#2D2619',
  rule:     '#2A2418',
  cellHi:   '#2E2718',
  // Category tiles in dark = deep saturated wells; their ink is the bright pastel.
  // Category tiles in dark: deep saturated well, bright pastel ink.
  // `accent` is the bright pastel (same as ink) for decorative use OUTSIDE a tile.
  word:    { bg: '#3E2417', ink: '#FFD2B5', soft: '#52301E', accent: '#FFD2B5' },
  number:  { bg: '#1F3927', ink: '#C3E0BD', soft: '#2A4A33', accent: '#C3E0BD' },
  logic:   { bg: '#3A2E0E', ink: '#FFE49C', soft: '#4D3D14', accent: '#FFE49C' },
  visual:  { bg: '#251E48', ink: '#D2C2FF', soft: '#332961', accent: '#D2C2FF' },
  classic: { bg: '#142E48', ink: '#B9D5EF', soft: '#1D3F60', accent: '#B9D5EF' },
  success: '#6FB47F',
  danger:  '#E37863',
  surface2: '#1D170F',
};

// Live palette. Mutated in place by setPVMode so components see the new values.
const PV = { ...PV_LIGHT, word:{...PV_LIGHT.word}, number:{...PV_LIGHT.number}, logic:{...PV_LIGHT.logic}, visual:{...PV_LIGHT.visual}, classic:{...PV_LIGHT.classic} };

function setPVMode(mode) {
  const target = mode === 'dark' ? PV_DARK : PV_LIGHT;
  for (const k of Object.keys(target)) {
    if (target[k] && typeof target[k] === 'object') {
      for (const k2 of Object.keys(target[k])) PV[k][k2] = target[k][k2];
    } else {
      PV[k] = target[k];
    }
  }
  PV.__mode = mode;
  window.dispatchEvent(new CustomEvent('pv-theme', { detail: { mode } }));
}
PV.__mode = 'light';

const Ico = {
  search: (c='currentColor', s=20) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>
    </svg>
  ),
  flame: (c='#E26A2C', s=14) => (
    <svg width={s} height={s*1.14} viewBox="0 0 14 16" fill={c}>
      <path d="M7 0c.5 2.5 3 3.5 3 6 0 .8-.3 1.5-.7 2 .5-.2 1-.6 1.3-1.1.7 1 1 2 1 3.1 0 3.3-2.5 6-5.6 6S.4 13.3.4 10c0-2.4 1.4-3.6 2.6-5C4.4 3.6 5.7 2.2 7 0Z"/>
    </svg>
  ),
  chevron: (c='currentColor', s=14) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="m9 6 6 6-6 6"/></svg>
  ),
  chevronLeft: (c='currentColor', s=22) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m15 6-6 6 6 6"/></svg>
  ),
  play: (c='currentColor', s=14) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill={c}><path d="M7 5v14l12-7z"/></svg>
  ),
  check: (c='currentColor', s=16) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5L20 7"/></svg>
  ),
  close: (c='currentColor', s=22) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M6 6l12 12M18 6 6 18"/></svg>
  ),
  more: (c='currentColor', s=22) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill={c}><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>
  ),
  hint: (c='currentColor', s=18) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12c1 1 1.5 2 1.5 3h5c0-1 .5-2 1.5-3a7 7 0 0 0-4-12z"/></svg>
  ),
  flag: (c='currentColor', s=18) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 22V4M5 4h12l-2 4 2 4H5"/></svg>
  ),
  undo: (c='currentColor', s=18) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v6h6"/><path d="M3 13a9 9 0 1 0 3-7L3 9"/></svg>
  ),
  trophy: (c='currentColor', s=18) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4ZM7 5H4v3a3 3 0 0 0 3 3M17 5h3v3a3 3 0 0 1-3 3"/></svg>
  ),
  share: (c='currentColor', s=18) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v14M6 9l6-6 6 6M5 21h14"/></svg>
  ),
  clock: (c='currentColor', s=16) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
  ),
  // Tab icons
  home: (filled, c) => (filled
    ? (<svg width="26" height="26" viewBox="0 0 24 24" fill={c}><path d="M12 3 3 10v11h6v-7h6v7h6V10z"/></svg>)
    : (<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinejoin="round"><path d="M3 10 12 3l9 7v11h-6v-7H9v7H3z"/></svg>)),
  daily: (filled, c) => (filled
    ? (<svg width="26" height="26" viewBox="0 0 24 24" fill={c}><rect x="3" y="5" width="18" height="16" rx="3"/><rect x="6" y="2" width="2" height="5" rx="1" fill={PV.bg}/><rect x="16" y="2" width="2" height="5" rx="1" fill={PV.bg}/></svg>)
    : (<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinejoin="round"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>)),
  stats: (filled, c) => (filled
    ? (<svg width="26" height="26" viewBox="0 0 24 24" fill={c}><rect x="3" y="13" width="4" height="8" rx="1.5"/><rect x="10" y="8" width="4" height="13" rx="1.5"/><rect x="17" y="4" width="4" height="17" rx="1.5"/></svg>)
    : (<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinejoin="round"><rect x="3" y="13" width="4" height="8" rx="1.5"/><rect x="10" y="8" width="4" height="13" rx="1.5"/><rect x="17" y="4" width="4" height="17" rx="1.5"/></svg>)),
  settings: (filled, c) => (filled
    ? (<svg width="26" height="26" viewBox="0 0 24 24" fill={c}><circle cx="12" cy="12" r="3"/><path d="M19.4 13.5a7.6 7.6 0 0 0 0-3l2-1.5-2-3.4-2.3.9a7.5 7.5 0 0 0-2.6-1.5L14 2h-4l-.5 2.6a7.5 7.5 0 0 0-2.6 1.5l-2.3-.9-2 3.4 2 1.5a7.6 7.6 0 0 0 0 3l-2 1.5 2 3.4 2.3-.9a7.5 7.5 0 0 0 2.6 1.5L10 22h4l.5-2.6a7.5 7.5 0 0 0 2.6-1.5l2.3.9 2-3.4z"/></svg>)
    : (<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 13.5a7.6 7.6 0 0 0 0-3l2-1.5-2-3.4-2.3.9a7.5 7.5 0 0 0-2.6-1.5L14 2h-4l-.5 2.6a7.5 7.5 0 0 0-2.6 1.5l-2.3-.9-2 3.4 2 1.5a7.6 7.6 0 0 0 0 3l-2 1.5 2 3.4 2.3-.9a7.5 7.5 0 0 0 2.6 1.5L10 22h4l.5-2.6a7.5 7.5 0 0 0 2.6-1.5l2.3.9 2-3.4z"/></svg>)),
};

const Glyph = {
  word: (c) => (<span style={{ fontFamily:'Nunito', fontWeight:900, fontSize:26, color:c, letterSpacing:-1, lineHeight:1 }}>Aa</span>),
  number: (c, n='7') => (<span style={{ fontFamily:'Nunito', fontWeight:900, fontSize:28, color:c, letterSpacing:-1, lineHeight:1 }}>{n}</span>),
  grid: (c) => (
    <svg width="26" height="26" viewBox="0 0 26 26">
      {[0,1,2].map(r => [0,1,2].map(col => (
        <rect key={r+'-'+col} x={col*9} y={r*9} width="7" height="7" rx="1.5" fill={c} opacity={(r+col)%2 ? 0.55 : 1}/>
      )))}
    </svg>
  ),
  shapes: (c) => (
    <svg width="28" height="26" viewBox="0 0 28 26">
      <polygon points="0,24 12,24 6,8" fill={c}/>
      <rect x="14" y="10" width="14" height="14" rx="2" fill={c} opacity="0.55"/>
      <circle cx="20" cy="6" r="5" fill={c} opacity="0.8"/>
    </svg>
  ),
  chip: (c) => (
    <svg width="26" height="26" viewBox="0 0 26 26">
      <circle cx="13" cy="13" r="12" fill={c}/>
      <circle cx="13" cy="13" r="7" fill={PV.surface}/>
      <rect x="11.5" y="0" width="3" height="6" fill={PV.surface}/>
      <rect x="11.5" y="20" width="3" height="6" fill={PV.surface}/>
      <rect x="0" y="11.5" width="6" height="3" fill={PV.surface}/>
      <rect x="20" y="11.5" width="6" height="3" fill={PV.surface}/>
    </svg>
  ),
  dots: (c) => (
    <svg width="26" height="26" viewBox="0 0 26 26" fill={c}>
      <circle cx="4" cy="4" r="3"/><circle cx="13" cy="4" r="3" opacity=".6"/>
      <circle cx="4" cy="13" r="3" opacity=".6"/><circle cx="13" cy="13" r="3"/>
      <circle cx="22" cy="13" r="3" opacity=".6"/>
      <circle cx="13" cy="22" r="3" opacity=".6"/><circle cx="22" cy="22" r="3"/>
    </svg>
  ),
};

// Shared atoms used across screens
const PVAtoms = {};

PVAtoms.StatusBar = function StatusBar() {
  // The iOS frame provides its own status bar — we just need top padding.
  return (<div style={{ height: 54 }}/>);
};

PVAtoms.TabBar = function TabBar({ active }) {
  const tabs = [
    { key:'home',     label:'Home',     icon:Ico.home },
    { key:'daily',    label:'Daily',    icon:Ico.daily },
    { key:'stats',    label:'Stats',    icon:Ico.stats },
    { key:'settings', label:'Settings', icon:Ico.settings },
  ];
  return (
    <div style={{
      position: 'absolute', left: 14, right: 14, bottom: 18,
      background: PV.surface, borderRadius: 28, padding: '10px 8px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-around',
      boxShadow: '0 4px 16px rgba(30,26,20,0.08), 0 1px 0 rgba(30,26,20,0.03)',
    }}>
      {tabs.map(t => {
        const on = active === t.key;
        return (
          <div key={t.key} style={{
            display:'flex', flexDirection:'column', alignItems:'center', gap:2,
            padding:'4px 14px', borderRadius: 18,
            background: on ? PV.bg : 'transparent',
            transition: 'background .15s ease',
          }}>
            {t.icon(on, on ? PV.ink : PV.inkMuted)}
            <span style={{ fontSize:11, fontWeight:800, color: on ? PV.ink : PV.inkMuted }}>{t.label}</span>
          </div>
        );
      })}
    </div>
  );
};

PVAtoms.Card = function Card({ children, style }) {
  return (
    <div style={{
      background: PV.surface, borderRadius: 22, padding: 16,
      boxShadow: '0 1px 0 rgba(30,26,20,0.03), 0 4px 12px rgba(30,26,20,0.05)',
      ...style,
    }}>{children}</div>
  );
};

PVAtoms.ScreenShell = function ScreenShell({ label, children, tab, scrollPadBottom = 110 }) {
  return (
    <div data-screen-label={label} style={{
      width:'100%', height:'100%', background: PV.bg,
      display:'flex', flexDirection:'column', position:'relative',
      overflow:'hidden', color: PV.ink, fontFamily: 'Nunito, sans-serif',
    }}>
      <div className="pv-scroll" style={{ flex:1, overflowY:'auto', paddingBottom: scrollPadBottom }}>
        {children}
      </div>
      {tab && <PVAtoms.TabBar active={tab}/>}
    </div>
  );
};

Object.assign(window, { PV, PV_LIGHT, PV_DARK, setPVMode, Ico, Glyph, PVAtoms });
