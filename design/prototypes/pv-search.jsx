// PuzzleVerse — Search modal (full screen)

function SearchScreen() {
  const query = 'sud';
  const recent = ['Sudoku', 'Word Hunt', 'Tangram'];
  const trending = ['Logic', 'Daily', 'Word', 'Quick'];

  const results = [
    { name:'Sudoku',          blurb:'Classic 9×9 number grid',  cat:'logic',   glyph:Glyph.grid },
    { name:'Mini Sudoku',     blurb:'Quick 4×4 for breaks',     cat:'logic',   glyph:Glyph.grid },
    { name:'Killer Sudoku',   blurb:'Cages instead of regions', cat:'logic',   glyph:Glyph.grid },
  ];

  return (
    <div data-screen-label="Search" style={{
      width:'100%', height:'100%', background: PV.bg,
      display:'flex', flexDirection:'column', position:'relative', overflow:'hidden',
      color: PV.ink, fontFamily:'Nunito, sans-serif',
    }}>
      <div style={{ height: 54 }}/>

      {/* Search bar */}
      <div style={{ padding:'4px 16px 8px', display:'flex', alignItems:'center', gap:10 }}>
        <div style={{
          flex:1, height:48, background: PV.surface, borderRadius:999,
          display:'flex', alignItems:'center', gap:10, padding:'0 16px',
          boxShadow:'0 1px 0 rgba(30,26,20,0.03), 0 2px 8px rgba(30,26,20,0.05)',
        }}>
          {Ico.search(PV.inkMuted, 18)}
          <div style={{ flex:1, fontSize:15, fontWeight:600, color: PV.ink }}>
            {query}<span style={{ display:'inline-block', width:2, height:18, background: PV.ink, marginLeft:1, verticalAlign:'middle', animation:'pvBlink 1s steps(1) infinite' }}/>
          </div>
          <div style={{
            width:22, height:22, borderRadius:'50%', background: PV.rule,
            display:'flex', alignItems:'center', justifyContent:'center', color: PV.inkSoft,
          }}>{Ico.close(PV.inkSoft, 12)}</div>
        </div>
        <div style={{ fontSize:15, fontWeight:800, color: PV.inkSoft }}>Cancel</div>
      </div>

      <style>{`@keyframes pvBlink { 50% { opacity: 0; } }`}</style>

      {/* Recent */}
      <div style={{ padding:'12px 22px 0', fontSize:12, fontWeight:800, color: PV.inkMuted, letterSpacing:0.6, textTransform:'uppercase' }}>Recent</div>
      <div style={{ display:'flex', gap:8, padding:'10px 22px 0', flexWrap:'wrap' }}>
        {recent.map(t => (
          <div key={t} style={{
            background: PV.surface, padding:'8px 14px', borderRadius:999,
            fontSize:13, fontWeight:700, color: PV.ink,
            boxShadow:'0 1px 0 rgba(30,26,20,0.03), 0 2px 6px rgba(30,26,20,0.04)',
            display:'flex', alignItems:'center', gap:6,
          }}>
            {Ico.clock(PV.inkMuted, 12)} {t}
          </div>
        ))}
      </div>

      {/* Trending */}
      <div style={{ padding:'18px 22px 0', fontSize:12, fontWeight:800, color: PV.inkMuted, letterSpacing:0.6, textTransform:'uppercase' }}>Trending searches</div>
      <div style={{ display:'flex', gap:8, padding:'10px 22px 0', flexWrap:'wrap' }}>
        {trending.map(t => (
          <div key={t} style={{
            background:'transparent', padding:'6px 12px', borderRadius:999,
            border:`1.5px solid ${PV.rule}`,
            fontSize:13, fontWeight:700, color: PV.inkSoft,
          }}>{t}</div>
        ))}
      </div>

      {/* Results */}
      <div style={{ padding:'22px 22px 6px', display:'flex', alignItems:'baseline', justifyContent:'space-between' }}>
        <div style={{ fontSize:13, fontWeight:800, color: PV.inkMuted, letterSpacing:0.6, textTransform:'uppercase' }}>Results</div>
        <div style={{ fontSize:13, fontWeight:700, color: PV.inkMuted }}>{results.length} games</div>
      </div>
      <div style={{ padding:'0 22px', display:'flex', flexDirection:'column', gap:10 }}>
        {results.map(g => {
          const tone = PV[g.cat];
          return (
            <div key={g.name} style={{
              background: PV.surface, borderRadius:18, padding:14,
              display:'flex', alignItems:'center', gap:12,
              boxShadow:'0 1px 0 rgba(30,26,20,0.03), 0 2px 8px rgba(30,26,20,0.05)',
            }}>
              <div style={{
                width:44, height:44, borderRadius:14, background: tone.bg,
                display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
              }}>{g.glyph(tone.ink)}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:15, fontWeight:800, color: PV.ink }}>
                  <span style={{ background: PV.logic.bg, borderRadius:4, padding:'0 2px' }}>{g.name.slice(0,3)}</span>{g.name.slice(3)}
                </div>
                <div style={{ fontSize:12, fontWeight:600, color: PV.inkMuted, marginTop:2 }}>{g.blurb}</div>
              </div>
              <div style={{ color: PV.inkMuted }}>{Ico.chevron()}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

window.SearchScreen = SearchScreen;
