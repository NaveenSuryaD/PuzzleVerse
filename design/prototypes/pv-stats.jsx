// PuzzleVerse — Stats screen

function StatBig({ icon, value, label, tint }) {
  return (
    <div style={{
      flex:1, background: PV.surface, borderRadius:20, padding:'14px 10px',
      display:'flex', flexDirection:'column', alignItems:'center', gap:6,
      boxShadow:'0 1px 0 rgba(30,26,20,0.03), 0 2px 8px rgba(30,26,20,0.05)',
    }}>
      <div style={{
        width:32, height:32, borderRadius:10, background: tint,
        display:'flex', alignItems:'center', justifyContent:'center',
      }}>{icon}</div>
      <div style={{ fontSize:22, fontWeight:900, color: PV.ink, letterSpacing:-0.6, lineHeight:1 }}>{value}</div>
      <div style={{ fontSize:11, fontWeight:700, color: PV.inkMuted, textTransform:'uppercase', letterSpacing:0.5 }}>{label}</div>
    </div>
  );
}

function StatsScreen() {
  const perGame = [
    { name:'Sudoku',    cat:'logic',   glyph:Glyph.grid,   played:48, best:'2:34', streak:5  },
    { name:'Word Hunt', cat:'word',    glyph:Glyph.word,   played:32, best:'1:48', streak:0  },
    { name:'Solitaire', cat:'classic', glyph:Glyph.chip,   played:21, best:'3:12', streak:12 },
    { name:'Tangram',   cat:'visual',  glyph:Glyph.shapes, played:14, best:'5:30', streak:2  },
  ];

  // Last 7 days of solved puzzles
  const bars = [3, 5, 2, 6, 4, 7, 5];
  const labels = ['Fri','Sat','Sun','Mon','Tue','Wed','Thu'];
  const maxBar = Math.max(...bars);

  const achievements = [
    { name:'First Solve',    earned:true,  cat:'word'    },
    { name:'7-day Streak',   earned:true,  cat:'logic'   },
    { name:'Speed Demon',    earned:true,  cat:'number'  },
    { name:'No Hints',       earned:false, cat:'visual'  },
    { name:'100 Puzzles',    earned:false, cat:'classic' },
  ];

  return (
    <PVAtoms.ScreenShell label="Stats" tab="stats">
      <div style={{ padding:'64px 22px 4px' }}>
        <div style={{ fontSize:14, color: PV.inkMuted, fontWeight:600 }}>Your progress</div>
        <div style={{ fontSize:30, fontWeight:900, color: PV.ink, marginTop:2, letterSpacing:-0.8 }}>Stats</div>
      </div>

      {/* Top 4 stats */}
      <div style={{ padding:'14px 22px 0', display:'flex', gap:8 }}>
        <StatBig icon={Ico.flame('#E26A2C', 16)} value="12" label="Streak"   tint={PV.word.bg}/>
        <StatBig icon={Ico.trophy(PV.logic.ink, 18)} value="48" label="Solved"   tint={PV.logic.bg}/>
        <StatBig icon={(<span style={{ fontWeight:900, color: PV.number.ink, fontSize:14 }}>%</span>)} value="76" label="Accuracy" tint={PV.number.bg}/>
        <StatBig icon={Ico.clock(PV.visual.ink, 16)} value="2:34" label="Avg"      tint={PV.visual.bg}/>
      </div>

      {/* Activity chart */}
      <div style={{ padding:'18px 22px 0' }}>
        <div style={{
          background: PV.surface, borderRadius:22, padding:18,
          boxShadow:'0 1px 0 rgba(30,26,20,0.03), 0 4px 12px rgba(30,26,20,0.05)',
        }}>
          <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between' }}>
            <div style={{ fontSize:14, fontWeight:800, color: PV.ink }}>This week</div>
            <div style={{ fontSize:12, fontWeight:700, color: PV.inkMuted }}>32 solved</div>
          </div>
          <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', gap:6, marginTop:14, height:80 }}>
            {bars.map((v, i) => (
              <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
                <div style={{
                  width:'100%',
                  height: `${(v/maxBar)*72}px`,
                  background: i === bars.length - 1 ? PV.ink : PV.logic.bg,
                  borderRadius:8,
                }}/>
                <div style={{ fontSize:11, fontWeight:700, color: i === bars.length - 1 ? PV.ink : PV.inkMuted }}>{labels[i]}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Per-game */}
      <div style={{ padding:'22px 22px 6px', fontSize:13, fontWeight:800, color: PV.inkMuted, letterSpacing:0.6, textTransform:'uppercase' }}>By game</div>
      <div style={{ padding:'0 22px', display:'flex', flexDirection:'column', gap:8 }}>
        {perGame.map(g => {
          const tone = PV[g.cat];
          return (
            <div key={g.name} style={{
              background: PV.surface, borderRadius:18, padding:'12px 14px',
              display:'flex', alignItems:'center', gap:12,
              boxShadow:'0 1px 0 rgba(30,26,20,0.03), 0 2px 8px rgba(30,26,20,0.04)',
            }}>
              <div style={{
                width:38, height:38, borderRadius:12, background: tone.bg,
                display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
              }}>{g.glyph(tone.ink)}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:800, fontSize:15, color: PV.ink }}>{g.name}</div>
                <div style={{ fontSize:12, fontWeight:600, color: PV.inkMuted, marginTop:2 }}>{g.played} games · best {g.best}</div>
              </div>
              {g.streak > 0 && (
                <div style={{ display:'flex', alignItems:'center', gap:3, fontWeight:800, fontSize:13, color: PV.ink }}>
                  {Ico.flame('#E26A2C', 13)}{g.streak}
                </div>
              )}
              <div style={{ color: PV.inkMuted }}>{Ico.chevron()}</div>
            </div>
          );
        })}
      </div>

      {/* Achievements */}
      <div style={{ padding:'22px 22px 6px', fontSize:13, fontWeight:800, color: PV.inkMuted, letterSpacing:0.6, textTransform:'uppercase' }}>Achievements</div>
      <div className="pv-scroll" style={{ display:'flex', gap:10, padding:'2px 22px 12px', overflowX:'auto' }}>
        {achievements.map(a => {
          const tone = PV[a.cat];
          return (
            <div key={a.name} style={{
              minWidth:104, background: PV.surface, borderRadius:18, padding:14,
              display:'flex', flexDirection:'column', alignItems:'center', gap:6,
              boxShadow:'0 1px 0 rgba(30,26,20,0.03), 0 2px 8px rgba(30,26,20,0.04)',
              opacity: a.earned ? 1 : 0.55,
            }}>
              <div style={{
                width:48, height:48, borderRadius:'50%',
                background: a.earned ? tone.bg : PV.rule,
                display:'flex', alignItems:'center', justifyContent:'center',
                filter: a.earned ? 'none' : 'grayscale(1)',
              }}>
                {a.earned ? Ico.trophy(tone.ink, 22) : <span style={{ color: PV.inkMuted, fontWeight:900, fontSize:20 }}>?</span>}
              </div>
              <div style={{ fontSize:12, fontWeight:800, color: PV.ink, textAlign:'center', lineHeight:1.2 }}>{a.name}</div>
            </div>
          );
        })}
      </div>
    </PVAtoms.ScreenShell>
  );
}

window.StatsScreen = StatsScreen;
