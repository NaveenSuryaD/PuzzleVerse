// PuzzleVerse — Home screen

function HomePill({ children, active, color }) {
  return (
    <div style={{
      padding: '9px 16px', borderRadius: 999,
      background: active ? PV.ink : PV.surface,
      color: active ? PV.bg : PV.inkSoft,
      fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap',
      boxShadow: active ? 'none' : '0 1px 0 rgba(30,26,20,0.04), 0 2px 6px rgba(30,26,20,0.04)',
      display: 'flex', alignItems: 'center', gap: 6,
    }}>
      {color && <span style={{ width:8, height:8, borderRadius:4, background:color, display:'inline-block' }}/>}
      {children}
    </div>
  );
}

function HomeGameTile({ name, blurb, cat, glyph, streak, isNew }) {
  const tone = PV[cat];
  return (
    <div style={{
      background: PV.surface, borderRadius: 26, padding: 16,
      display: 'flex', flexDirection: 'column', gap: 10,
      boxShadow: '0 1px 0 rgba(30,26,20,0.03), 0 6px 14px rgba(30,26,20,0.05)',
      position: 'relative', minHeight: 168,
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: 18,
        background: tone.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>{glyph(tone.ink)}</div>
      {isNew && (
        <span style={{
          position:'absolute', top: 14, right: 14,
          background: PV.ink, color: PV.bg,
          fontSize: 10, fontWeight: 800, letterSpacing: 0.6,
          padding: '3px 7px', borderRadius: 999,
        }}>NEW</span>
      )}
      <div style={{ marginTop: 'auto' }}>
        <div style={{ fontWeight: 800, fontSize: 17, color: PV.ink, lineHeight: 1.1 }}>{name}</div>
        <div style={{ fontWeight: 500, fontSize: 13, color: PV.inkMuted, marginTop: 3, lineHeight: 1.25 }}>{blurb}</div>
      </div>
      {streak != null && streak > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: PV.inkSoft, fontWeight: 700, fontSize: 12 }}>
          {Ico.flame()}<span>{streak} day streak</span>
        </div>
      )}
    </div>
  );
}

function HomeScreen() {
  const cats = [
    { key:'All',    color: null },
    { key:'Word',   color: PV.word.bg },
    { key:'Number', color: PV.number.bg },
    { key:'Logic',  color: PV.logic.bg },
    { key:'Visual', color: PV.visual.bg },
    { key:'Classic',color: PV.classic.bg },
  ];
  const games = [
    { name:'Sudoku',      blurb:'Classic 9×9 number grid',  cat:'logic',   glyph:Glyph.grid,   streak:5 },
    { name:'Word Hunt',   blurb:'Find words in the board',  cat:'word',    glyph:Glyph.word,   streak:0, isNew:true },
    { name:'Tangram',     blurb:'Fit the shapes together',  cat:'visual',  glyph:Glyph.shapes, streak:2 },
    { name:'Two Numbers', blurb:'Add up to the target',     cat:'number',  glyph:(c)=>Glyph.number(c,'8'), streak:0 },
    { name:'Solitaire',   blurb:'Klondike, your way',       cat:'classic', glyph:Glyph.chip,   streak:12 },
    { name:'Flow',        blurb:'Connect the matching dots',cat:'visual',  glyph:Glyph.dots,   streak:0, isNew:true },
  ];

  return (
    <PVAtoms.ScreenShell label="Home" tab="home">
      {/* Header */}
      <div style={{ padding:'64px 22px 6px', display:'flex', alignItems:'flex-end', justifyContent:'space-between' }}>
        <div>
          <div style={{ fontSize:14, color: PV.inkMuted, fontWeight:600, whiteSpace:'nowrap' }}>Good morning</div>
          <div style={{ fontSize:26, fontWeight:900, color: PV.ink, marginTop:2, letterSpacing:-0.5 }}>Sam</div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{
            height:40, padding:'0 12px', borderRadius:999, background: PV.surface,
            display:'flex', alignItems:'center', gap:6,
            boxShadow:'0 1px 0 rgba(30,26,20,0.04), 0 2px 8px rgba(30,26,20,0.05)',
            fontWeight:800, fontSize:14, color: PV.ink,
          }}>{Ico.flame()}<span>7</span></div>
          <div style={{
            width:40, height:40, borderRadius:999, background: PV.surface,
            display:'flex', alignItems:'center', justifyContent:'center',
            boxShadow:'0 1px 0 rgba(30,26,20,0.04), 0 2px 8px rgba(30,26,20,0.05)',
            color: PV.inkSoft,
          }}>{Ico.search()}</div>
        </div>
      </div>

      {/* Today's puzzle */}
      <div style={{ padding:'14px 22px 4px' }}>
        <div style={{
          background: PV.word.bg, borderRadius:28, padding:22,
          position:'relative', overflow:'hidden', color: PV.word.ink, minHeight:168,
          display:'flex', flexDirection:'column',
        }}>
          <div style={{ position:'absolute', right:-30, top:-30, width:140, height:140, borderRadius:'50%', background: PV.word.soft }}/>
          <div style={{ position:'absolute', right:30, bottom:-40, width:90, height:90, borderRadius:24, background: PV.word.soft, transform:'rotate(20deg)' }}/>
          <div style={{ position:'relative', display:'flex', alignItems:'center', gap:8, fontSize:12, fontWeight:800, letterSpacing:0.8, textTransform:'uppercase', opacity:.85 }}>
            <span style={{ width:6, height:6, borderRadius:3, background: PV.word.ink }}/>Today's Puzzle
          </div>
          <div style={{ position:'relative', fontSize:30, fontWeight:900, letterSpacing:-0.8, marginTop:8, lineHeight:1.05, maxWidth:220 }}>
            Crossword<br/>Mini
          </div>
          <div style={{ position:'relative', fontSize:14, fontWeight:600, marginTop:8, opacity:.8, maxWidth:220 }}>
            5×5 grid · about 3 min
          </div>
          <div style={{ position:'relative', marginTop:'auto', paddingTop:14, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ display:'flex', alignItems:'center' }}>
              {[0,1,2].map(i => (
                <div key={i} style={{
                  width:24, height:24, borderRadius:999,
                  background: [PV.word.soft, PV.logic.soft, PV.visual.soft][i],
                  border:`2px solid ${PV.word.bg}`,
                  marginLeft: i ? -8 : 0,
                }}/>
              ))}
              <span style={{ marginLeft:8, fontSize:12, fontWeight:700, opacity:.8 }}>4,218 solved today</span>
            </div>
            <div style={{
              background: PV.ink, color: PV.bg, borderRadius:999, padding:'10px 16px',
              fontWeight:800, fontSize:14, display:'flex', alignItems:'center', gap:6,
            }}>{Ico.play(PV.bg)} Play</div>
          </div>
        </div>
      </div>

      {/* Category pills */}
      <div className="pv-scroll" style={{ display:'flex', gap:8, overflowX:'auto', padding:'18px 22px 6px' }}>
        {cats.map((c, i) => <HomePill key={c.key} active={i===0} color={c.color}>{c.key}</HomePill>)}
      </div>

      {/* Continue */}
      <div style={{ padding:'14px 22px 2px' }}>
        <div style={{ fontSize:13, fontWeight:800, color: PV.inkMuted, letterSpacing:0.6, textTransform:'uppercase' }}>Pick up where you left off</div>
      </div>
      <div style={{
        margin:'8px 22px 0', background: PV.surface, borderRadius:22, padding:14,
        display:'flex', alignItems:'center', gap:14,
        boxShadow:'0 1px 0 rgba(30,26,20,0.03), 0 4px 12px rgba(30,26,20,0.05)',
      }}>
        <div style={{ width:48, height:48, borderRadius:14, background: PV.logic.bg, display:'flex', alignItems:'center', justifyContent:'center' }}>
          {Glyph.grid(PV.logic.ink)}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontWeight:800, fontSize:15, color: PV.ink }}>Sudoku — Medium</div>
          <div style={{ fontWeight:600, fontSize:12, color: PV.inkMuted, marginTop:2 }}>32 of 81 squares filled · 4:12</div>
          <div style={{ height:5, background: PV.rule, borderRadius:99, marginTop:8, overflow:'hidden' }}>
            <div style={{ width:'40%', height:'100%', background: PV.logic.ink, borderRadius:99 }}/>
          </div>
        </div>
        <div style={{ color: PV.inkMuted }}>{Ico.chevron()}</div>
      </div>

      {/* All games */}
      <div style={{ padding:'24px 22px 2px', display:'flex', alignItems:'baseline', justifyContent:'space-between' }}>
        <div style={{ fontSize:20, fontWeight:900, color: PV.ink, letterSpacing:-0.4 }}>All puzzles</div>
        <div style={{ fontSize:13, fontWeight:700, color: PV.inkMuted }}>102 games</div>
      </div>
      <div style={{ padding:'14px 22px 12px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        {games.map(g => <HomeGameTile key={g.name} {...g}/>)}
      </div>
      <div style={{ textAlign:'center', color: PV.inkMuted, fontSize:13, fontWeight:600, padding:'6px 0 20px' }}>
        That's all for now — more coming soon
      </div>
    </PVAtoms.ScreenShell>
  );
}

window.HomeScreen = HomeScreen;
