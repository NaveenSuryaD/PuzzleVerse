// PuzzleVerse — Puzzle Complete (success sheet over completed board)

function CompleteScreen() {
  // Completed sudoku board (sampled — solid for screenshot)
  const solved = [
    [5,3,4,6,7,8,9,1,2],
    [6,7,2,1,9,5,3,4,8],
    [1,9,8,3,4,2,5,6,7],
    [8,5,9,7,6,1,4,2,3],
    [4,2,6,8,5,3,7,9,1],
    [7,1,3,9,2,4,8,5,6],
    [9,6,1,5,3,7,2,8,4],
    [2,8,7,4,1,9,6,3,5],
    [3,4,5,2,8,6,1,7,9],
  ];
  const cellSize = 26;

  return (
    <div data-screen-label="Complete" style={{
      width:'100%', height:'100%', background: PV.bg,
      display:'flex', flexDirection:'column', position:'relative', overflow:'hidden',
      color: PV.ink, fontFamily:'Nunito, sans-serif',
    }}>
      <div style={{ height: 54 }}/>

      {/* Faded board behind */}
      <div style={{
        position:'absolute', top: 80, left:0, right:0,
        display:'flex', justifyContent:'center', opacity:.4, filter:'blur(0.5px)',
      }}>
        <div style={{
          display:'grid',
          gridTemplateColumns:`repeat(9, ${cellSize}px)`,
          gridTemplateRows:`repeat(9, ${cellSize}px)`,
          background: PV.surface,
          border:`2px solid ${PV.ink}`,
          borderRadius: 10, overflow:'hidden',
        }}>
          {solved.flatMap((row, r) => row.map((v, c) => (
            <div key={`${r}-${c}`} style={{
              width: cellSize, height: cellSize, background: PV.surface,
              borderRight: c === 8 ? 'none' : ((c % 3 === 2) ? `2px solid ${PV.ink}` : `1px solid ${PV.divider}`),
              borderBottom: r === 8 ? 'none' : ((r % 3 === 2) ? `2px solid ${PV.ink}` : `1px solid ${PV.divider}`),
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:13, fontWeight:700, color: PV.ink,
            }}>{v}</div>
          )))}
        </div>
      </div>

      {/* Confetti dots — use accent so they pop in both modes */}
      {[
        {x:30,  y:90,  c: PV.word.accent,    s:14},
        {x:330, y:120, c: PV.logic.accent,   s:18},
        {x:60,  y:200, c: PV.number.accent,  s:10},
        {x:340, y:240, c: PV.visual.accent,  s:12},
        {x:24,  y:340, c: PV.classic.accent, s:16},
        {x:350, y:380, c: PV.word.accent,    s:10},
        {x:18,  y:90,  c: PV.logic.accent,   s:8},
      ].map((d, i) => (
        <div key={i} style={{
          position:'absolute', left:d.x, top:d.y,
          width:d.s, height:d.s, borderRadius: i%2 ? '50%' : 4,
          background:d.c, transform:`rotate(${i*30}deg)`,
        }}/>
      ))}

      {/* Sheet at bottom */}
      <div style={{
        position:'absolute', left:0, right:0, bottom:0,
        background: PV.surface,
        borderTopLeftRadius: 32, borderTopRightRadius: 32,
        padding:'14px 24px 24px',
        boxShadow:'0 -8px 28px rgba(30,26,20,0.10)',
        display:'flex', flexDirection:'column', gap:14,
      }}>
        <div style={{
          width:38, height:5, borderRadius:99, background: PV.rule,
          margin:'0 auto 4px',
        }}/>

        {/* Trophy + title */}
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
          <div style={{
            width:64, height:64, borderRadius:'50%', background: PV.logic.bg,
            display:'flex', alignItems:'center', justifyContent:'center',
            boxShadow:`0 0 0 8px ${PV.bg}`,
            marginTop:-44, // hover above sheet
          }}>{Ico.trophy(PV.logic.ink, 30)}</div>
          <div style={{ fontSize:28, fontWeight:900, color: PV.ink, letterSpacing:-0.6, marginTop:6 }}>Solved!</div>
          <div style={{ fontSize:14, fontWeight:600, color: PV.inkSoft }}>Sudoku Medium · #042</div>
        </div>

        {/* Stats */}
        <div style={{ display:'flex', gap:10 }}>
          {[
            { label:'Time',     value:'7:24',  tint: PV.word.bg,   inkc: PV.word.ink },
            { label:'Accuracy', value:'94%',   tint: PV.number.bg, inkc: PV.number.ink },
            { label:'Streak',   value:'13d',   tint: PV.logic.bg,  inkc: PV.logic.ink, icon: true },
          ].map(s => (
            <div key={s.label} style={{
              flex:1, background: s.tint, borderRadius:18, padding:'12px 8px',
              display:'flex', flexDirection:'column', alignItems:'center', gap:2,
            }}>
              <div style={{ fontSize:20, fontWeight:900, color: s.inkc, letterSpacing:-0.4, display:'flex', alignItems:'center', gap:3 }}>
                {s.icon && Ico.flame('#E26A2C', 14)}{s.value}
              </div>
              <div style={{ fontSize:11, fontWeight:700, color: s.inkc, opacity:.8, textTransform:'uppercase', letterSpacing:0.5 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Personal best */}
        <div style={{
          background: PV.bg, borderRadius:14, padding:'10px 14px',
          display:'flex', alignItems:'center', justifyContent:'space-between',
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{
              width:24, height:24, borderRadius:'50%', background: PV.success,
              display:'flex', alignItems:'center', justifyContent:'center',
            }}>{Ico.check('#fff', 14)}</div>
            <span style={{ fontSize:13, fontWeight:700, color: PV.ink }}>New personal best</span>
          </div>
          <span style={{ fontSize:12, fontWeight:700, color: PV.inkMuted }}>−0:48 vs last</span>
        </div>

        {/* Actions */}
        <div style={{ display:'flex', gap:10, marginTop:2 }}>
          <div style={{
            width:54, height:54, borderRadius:18, background: PV.bg,
            display:'flex', alignItems:'center', justifyContent:'center', color: PV.ink,
          }}>{Ico.share(PV.ink, 20)}</div>
          <div style={{
            flex:1, height:54, borderRadius:18, background: PV.surface,
            border:`1.5px solid ${PV.rule}`,
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:15, fontWeight:800, color: PV.ink,
          }}>Play Again</div>
          <div style={{
            flex:1.4, height:54, borderRadius:18, background: PV.ink,
            display:'flex', alignItems:'center', justifyContent:'center', gap:6,
            fontSize:15, fontWeight:800, color: PV.bg,
          }}>Next Puzzle {Ico.chevron(PV.bg, 14)}</div>
        </div>
      </div>
    </div>
  );
}

window.CompleteScreen = CompleteScreen;
