// PuzzleVerse — Settings screen

function Toggle({ on }) {
  return (
    <div style={{
      width:46, height:28, borderRadius:99, padding:3,
      background: on ? PV.ink : PV.rule, position:'relative',
      transition:'background .15s ease',
    }}>
      <div style={{
        width:22, height:22, borderRadius:99, background: PV.surface,
        boxShadow:'0 1px 3px rgba(0,0,0,0.15)',
        transform: on ? 'translateX(18px)' : 'translateX(0)',
        transition:'transform .15s ease',
      }}/>
    </div>
  );
}

function SettingsRow({ label, sub, control, isLast }) {
  return (
    <div style={{
      padding:'14px 16px', display:'flex', alignItems:'center', gap:12,
      borderBottom: isLast ? 'none' : `1px solid ${PV.rule}`,
    }}>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:15, fontWeight:700, color: PV.ink }}>{label}</div>
        {sub && <div style={{ fontSize:12, fontWeight:500, color: PV.inkMuted, marginTop:2 }}>{sub}</div>}
      </div>
      {control}
    </div>
  );
}

function SettingsGroup({ title, children }) {
  return (
    <div style={{ padding:'14px 22px 0' }}>
      <div style={{ fontSize:12, fontWeight:800, color: PV.inkMuted, letterSpacing:0.6, textTransform:'uppercase', padding:'0 4px 8px' }}>{title}</div>
      <div style={{
        background: PV.surface, borderRadius:20, overflow:'hidden',
        boxShadow:'0 1px 0 rgba(30,26,20,0.03), 0 2px 8px rgba(30,26,20,0.04)',
      }}>{children}</div>
    </div>
  );
}

function SettingsScreen() {
  const themeColors = [PV.word.bg, PV.number.bg, PV.logic.bg, PV.visual.bg, PV.classic.bg, '#F4C8C8'];
  const [theme, setTheme] = React.useState('Light');
  const [accent, setAccent] = React.useState(2);

  return (
    <PVAtoms.ScreenShell label="Settings" tab="settings">
      <div style={{ padding:'64px 22px 4px' }}>
        <div style={{ fontSize:14, color: PV.inkMuted, fontWeight:600 }}>Customize your app</div>
        <div style={{ fontSize:30, fontWeight:900, color: PV.ink, marginTop:2, letterSpacing:-0.8 }}>Settings</div>
      </div>

      {/* Profile card */}
      <div style={{ padding:'14px 22px 0' }}>
        <div style={{
          background: PV.surface, borderRadius:22, padding:16,
          display:'flex', alignItems:'center', gap:14,
          boxShadow:'0 1px 0 rgba(30,26,20,0.03), 0 4px 12px rgba(30,26,20,0.05)',
        }}>
          <div style={{
            width:54, height:54, borderRadius:'50%', background: PV.logic.bg,
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:22, fontWeight:900, color: PV.logic.ink,
          }}>S</div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:17, fontWeight:800, color: PV.ink }}>Sam</div>
            <div style={{ fontSize:12, fontWeight:600, color: PV.inkMuted, marginTop:2 }}>Playing since Jan 2026 · Level 7</div>
          </div>
          <div style={{ color: PV.inkMuted }}>{Ico.chevron()}</div>
        </div>
      </div>

      <SettingsGroup title="Appearance">
        <SettingsRow
          label="Theme"
          control={(
            <div style={{ display:'flex', background: PV.bg, borderRadius:99, padding:3, gap:2 }}>
              {['Light','Dark','System'].map(t => (
                <div key={t} onClick={()=>setTheme(t)} style={{
                  padding:'6px 12px', borderRadius:99, fontSize:13, fontWeight:700,
                  background: theme===t ? PV.surface : 'transparent',
                  color: theme===t ? PV.ink : PV.inkMuted,
                  boxShadow: theme===t ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                }}>{t}</div>
              ))}
            </div>
          )}
        />
        <SettingsRow
          label="Accent color"
          sub="Used for highlights and progress"
          isLast
          control={(
            <div style={{ display:'flex', gap:8 }}>
              {themeColors.map((c, i) => (
                <div key={i} onClick={()=>setAccent(i)} style={{
                  width:24, height:24, borderRadius:'50%', background:c,
                  boxShadow: accent===i ? `0 0 0 2.5px ${PV.ink}, 0 0 0 4.5px ${PV.surface}` : `0 0 0 1px ${PV.rule}`,
                  cursor:'pointer',
                }}/>
              ))}
            </div>
          )}
        />
      </SettingsGroup>

      <SettingsGroup title="Gameplay">
        <SettingsRow label="Sound effects"   control={<Toggle on={true}/>}/>
        <SettingsRow label="Haptic feedback" control={<Toggle on={true}/>}/>
        <SettingsRow label="Show timer"      sub="Display elapsed time while playing" control={<Toggle on={true}/>}/>
        <SettingsRow label="Animations"      sub="Reduce for accessibility" isLast control={<Toggle on={false}/>}/>
      </SettingsGroup>

      <SettingsGroup title="About">
        <SettingsRow label="Rate PuzzleVerse" control={<div style={{ color: PV.inkMuted }}>{Ico.chevron()}</div>}/>
        <SettingsRow label="Share with a friend" control={<div style={{ color: PV.inkMuted }}>{Ico.chevron()}</div>}/>
        <SettingsRow label="Privacy & terms"  control={<div style={{ color: PV.inkMuted }}>{Ico.chevron()}</div>}/>
        <SettingsRow label="Version" sub="1.0.0 (build 42)" isLast control={null}/>
      </SettingsGroup>

      <div style={{ height: 8 }}/>
    </PVAtoms.ScreenShell>
  );
}

window.SettingsScreen = SettingsScreen;
