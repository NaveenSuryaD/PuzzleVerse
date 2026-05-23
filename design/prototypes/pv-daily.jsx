// PuzzleVerse — Daily Challenges screen

function DailyScreen() {
  const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const status = ['done','done','done','today','locked','locked','locked'];
  const todayIdx = 3;

  const challenges = [
    { name:'Crossword Mini', cat:'word',    glyph:Glyph.word,   diff:'Easy',   time:'3 min',  streak:7,  state:'done' },
    { name:'Sudoku',         cat:'logic',   glyph:Glyph.grid,   diff:'Medium', time:'8 min',  streak:5,  state:'playing' },
    { name:'Two Numbers',    cat:'number',  glyph:(c)=>Glyph.number(c,'8'), diff:'Medium', time:'5 min', streak:0, state:'todo' },
    { name:'Tangram',        cat:'visual',  glyph:Glyph.shapes, diff:'Hard',   time:'12 min', streak:0,  state:'todo' },
    { name:'Solitaire',      cat:'classic', glyph:Glyph.chip,   diff:'Easy',   time:'6 min',  streak:12, state:'todo' },
  ];

  return (
    <PVAtoms.ScreenShell label="Daily" tab="daily">
      {/* Header */}
      <div style={{ padding:'64px 22px 4px' }}>
        <div style={{ fontSize:14, color: PV.inkMuted, fontWeight:600 }}>Thursday, May 22</div>
        <div style={{ fontSize:30, fontWeight:900, color: PV.ink, marginTop:2, letterSpacing:-0.8 }}>Daily Challenges</div>
      </div>

      {/* Countdown */}
      <div style={{ padding:'10px 22px 4px' }}>
        <div style={{
          background: PV.surface, borderRadius:16, padding:'10px 14px',
          display:'flex', alignItems:'center', justifyContent:'space-between',
          boxShadow:'0 1px 0 rgba(30,26,20,0.03), 0 2px 8px rgba(30,26,20,0.04)',
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, color: PV.inkSoft }}>
            {Ico.clock(PV.inkSoft)}
            <span style={{ fontSize:13, fontWeight:700 }}>New puzzles in</span>
          </div>
          <div style={{ fontFamily:'Nunito', fontVariantNumeric:'tabular-nums', fontWeight:900, fontSize:18, color: PV.ink, letterSpacing:0.5 }}>
            04:32:18
          </div>
        </div>
      </div>

      {/* Week strip */}
      <div style={{
        margin:'14px 22px 0', background: PV.surface, borderRadius:22, padding:'14px 10px',
        display:'flex', justifyContent:'space-between',
        boxShadow:'0 1px 0 rgba(30,26,20,0.03), 0 4px 12px rgba(30,26,20,0.05)',
      }}>
        {days.map((d, i) => {
          const st = status[i];
          const isToday = i === todayIdx;
          return (
            <div key={d} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8, width:36 }}>
              <span style={{ fontSize:11, fontWeight:700, color: isToday ? PV.ink : PV.inkMuted }}>{d}</span>
              <div style={{
                width:32, height:32, borderRadius:999,
                background: st==='done' ? PV.number.bg : isToday ? PV.ink : PV.rule,
                color: st==='done' ? PV.number.ink : isToday ? PV.bg : PV.inkMuted,
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:13, fontWeight:800,
              }}>
                {st==='done' ? Ico.check(PV.number.ink, 14)
                  : isToday ? (i + 18)
                  : st==='locked' ? <span style={{ opacity:.6 }}>·</span>
                  : (i + 18)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div style={{ padding:'18px 22px 2px', display:'flex', alignItems:'baseline', justifyContent:'space-between' }}>
        <div style={{ fontSize:20, fontWeight:900, color: PV.ink, letterSpacing:-0.4 }}>Today's set</div>
        <div style={{ fontSize:13, fontWeight:700, color: PV.inkMuted }}>1 of 5 done</div>
      </div>

      {/* Challenge list */}
      <div style={{ padding:'10px 22px 12px', display:'flex', flexDirection:'column', gap:12 }}>
        {challenges.map(ch => {
          const tone = PV[ch.cat];
          const done = ch.state === 'done';
          const playing = ch.state === 'playing';
          return (
            <div key={ch.name} style={{
              background: PV.surface, borderRadius:22, padding:16,
              display:'flex', alignItems:'center', gap:14,
              boxShadow:'0 1px 0 rgba(30,26,20,0.03), 0 4px 12px rgba(30,26,20,0.05)',
              opacity: done ? .6 : 1, position:'relative',
            }}>
              <div style={{
                width:54, height:54, borderRadius:18,
                background: tone.bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
                position:'relative',
              }}>
                {ch.glyph(tone.ink)}
                {done && (
                  <div style={{
                    position:'absolute', inset:0, borderRadius:18,
                    background:'rgba(58,138,74,0.85)', display:'flex', alignItems:'center', justifyContent:'center',
                  }}>{Ico.check('#fff', 22)}</div>
                )}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:800, fontSize:16, color: PV.ink }}>{ch.name}</div>
                <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:4, color: PV.inkMuted, fontWeight:600, fontSize:12 }}>
                  <span style={{ background: tone.bg, color: tone.ink, padding:'2px 8px', borderRadius:6, fontWeight:800, fontSize:10, letterSpacing:0.4, textTransform:'uppercase' }}>{ch.diff}</span>
                  <span>·</span>
                  <span>{ch.time}</span>
                  {ch.streak > 0 && (<><span>·</span><span style={{ display:'inline-flex', alignItems:'center', gap:2 }}>{Ico.flame('#E26A2C', 11)} {ch.streak}</span></>)}
                </div>
              </div>
              <div style={{
                padding: playing ? '8px 12px' : '8px 12px',
                borderRadius:999,
                background: done ? 'transparent' : playing ? PV.ink : PV.bg,
                color: done ? PV.success : playing ? PV.bg : PV.ink,
                fontWeight:800, fontSize:13,
                border: done ? `1.5px solid ${PV.success}` : 'none',
                display:'flex', alignItems:'center', gap:4,
              }}>
                {done ? 'Done' : playing ? <>{Ico.play(PV.bg, 11)} Resume</> : 'Start'}
              </div>
            </div>
          );
        })}
      </div>
    </PVAtoms.ScreenShell>
  );
}

window.DailyScreen = DailyScreen;
