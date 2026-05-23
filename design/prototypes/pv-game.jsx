// PuzzleVerse — Game screen (Sudoku in progress)

function GameScreen() {
  // Sample sudoku board state: 0 = empty, number = filled
  // Given values come from puzzle, user values are highlighted differently
  const given = [
    [5,3,0,0,7,0,0,0,0],
    [6,0,0,1,9,5,0,0,0],
    [0,9,8,0,0,0,0,6,0],
    [8,0,0,0,6,0,0,0,3],
    [4,0,0,8,0,3,0,0,1],
    [7,0,0,0,2,0,0,0,6],
    [0,6,0,0,0,0,2,8,0],
    [0,0,0,4,1,9,0,0,5],
    [0,0,0,0,8,0,0,7,9],
  ];
  const userFills = { '0-2':4, '1-1':7, '1-2':2, '2-0':1, '2-3':3 };
  const selected = { r:4, c:4 }; // empty cell, highlighted

  const cellSize = 38;

  return (
    <div data-screen-label="Game" style={{
      width:'100%', height:'100%', background: PV.bg,
      display:'flex', flexDirection:'column', position:'relative',
      color: PV.ink, fontFamily:'Nunito, sans-serif', overflow:'hidden',
    }}>
      {/* Status bar spacer */}
      <div style={{ height: 54 }}/>

      {/* Header */}
      <div style={{
        padding:'4px 16px 8px', display:'flex', alignItems:'center', gap:8,
      }}>
        <div style={{
          width:40, height:40, borderRadius:999, background: PV.surface,
          display:'flex', alignItems:'center', justifyContent:'center',
          boxShadow:'0 1px 0 rgba(30,26,20,0.04), 0 2px 6px rgba(30,26,20,0.04)',
          color: PV.ink,
        }}>{Ico.chevronLeft()}</div>

        <div style={{ flex:1, textAlign:'center' }}>
          <div style={{ fontSize:16, fontWeight:900, color: PV.ink, letterSpacing:-0.2 }}>Sudoku</div>
          <div style={{ fontSize:11, fontWeight:700, color: PV.inkMuted, marginTop:1 }}>Medium · #042</div>
        </div>

        <div style={{
          height:40, padding:'0 12px', borderRadius:999, background: PV.surface,
          display:'flex', alignItems:'center', gap:5,
          boxShadow:'0 1px 0 rgba(30,26,20,0.04), 0 2px 6px rgba(30,26,20,0.04)',
        }}>
          {Ico.clock(PV.inkSoft, 14)}
          <span style={{ fontSize:13, fontWeight:800, color: PV.ink, fontVariantNumeric:'tabular-nums' }}>04:12</span>
        </div>
        <div style={{
          width:40, height:40, borderRadius:999, background: PV.surface,
          display:'flex', alignItems:'center', justifyContent:'center',
          boxShadow:'0 1px 0 rgba(30,26,20,0.04), 0 2px 6px rgba(30,26,20,0.04)',
          color: PV.inkSoft,
        }}>{Ico.more()}</div>
      </div>

      {/* Stats strip */}
      <div style={{
        margin:'4px 22px 0', display:'flex', justifyContent:'space-around',
        background: PV.surface, borderRadius:16, padding:'10px 8px',
        boxShadow:'0 1px 0 rgba(30,26,20,0.03), 0 2px 8px rgba(30,26,20,0.04)',
      }}>
        {[
          { label:'Mistakes', value:'1', tint: PV.inkSoft },
          { label:'Hints',    value:'2/3', tint: PV.inkSoft },
          { label:'Progress', value:'46%', tint: PV.logic.ink },
        ].map(s => (
          <div key={s.label} style={{ textAlign:'center' }}>
            <div style={{ fontSize:16, fontWeight:900, color: s.tint }}>{s.value}</div>
            <div style={{ fontSize:10, fontWeight:700, color: PV.inkMuted, textTransform:'uppercase', letterSpacing:0.5, marginTop:1 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Board */}
      <div style={{ padding:'18px 0 0', display:'flex', justifyContent:'center' }}>
        <div style={{
          background: PV.surface, borderRadius:16, padding:6,
          boxShadow:'0 1px 0 rgba(30,26,20,0.03), 0 4px 14px rgba(30,26,20,0.06)',
        }}>
          <div style={{
            display:'grid',
            gridTemplateColumns:`repeat(9, ${cellSize}px)`,
            gridTemplateRows:`repeat(9, ${cellSize}px)`,
            background: PV.ink,
            gap: 0,
            border:`2px solid ${PV.ink}`,
            borderRadius: 10,
            overflow:'hidden',
          }}>
            {given.flatMap((row, r) => row.map((v, c) => {
              const key = `${r}-${c}`;
              const user = userFills[key];
              const value = v || user;
              const isGiven = v !== 0;
              const isSelected = r === selected.r && c === selected.c;
              const sameRowCol = (r === selected.r || c === selected.c) && !isSelected;
              const sameBox =
                Math.floor(r/3) === Math.floor(selected.r/3) &&
                Math.floor(c/3) === Math.floor(selected.c/3) && !isSelected && !sameRowCol;
              // Borders
              const borderRight = (c % 3 === 2 && c !== 8) ? `2px solid ${PV.ink}` : `1px solid ${PV.divider}`;
              const borderBottom = (r % 3 === 2 && r !== 8) ? `2px solid ${PV.ink}` : `1px solid ${PV.divider}`;
              return (
                <div key={key} style={{
                  width: cellSize, height: cellSize,
                  background: isSelected ? PV.logic.bg
                            : sameRowCol ? PV.cellHi
                            : sameBox    ? PV.cellHi
                            : PV.surface,
                  borderRight: c === 8 ? 'none' : borderRight,
                  borderBottom: r === 8 ? 'none' : borderBottom,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:18, fontWeight: isGiven ? 800 : 700,
                  color: isGiven ? PV.ink : PV.logic.ink,
                  fontVariantNumeric:'tabular-nums',
                  position:'relative',
                }}>
                  {value || ''}
                </div>
              );
            }))}
          </div>
        </div>
      </div>

      {/* Number pad */}
      <div style={{
        padding:'18px 22px 0',
        display:'grid', gridTemplateColumns:'repeat(9, 1fr)', gap:6,
      }}>
        {[1,2,3,4,5,6,7,8,9].map(n => (
          <div key={n} style={{
            background: PV.surface, borderRadius:12,
            display:'flex', alignItems:'center', justifyContent:'center',
            height:44, fontSize:20, fontWeight:800, color: PV.ink,
            boxShadow:'0 1px 0 rgba(30,26,20,0.03), 0 2px 6px rgba(30,26,20,0.04)',
            fontVariantNumeric:'tabular-nums',
          }}>{n}</div>
        ))}
      </div>

      {/* Tool row */}
      <div style={{
        padding:'14px 22px 0',
        display:'flex', justifyContent:'space-between', gap:8,
      }}>
        {[
          { icon: Ico.undo(PV.ink, 18),  label:'Undo' },
          { icon: (<span style={{ fontWeight:900, color: PV.ink, fontSize:14 }}>✎</span>), label:'Notes', badge: 'on' },
          { icon: Ico.hint(PV.ink, 18),  label:'Hint',  badge: '3' },
          { icon: (<span style={{ fontWeight:900, color: PV.ink, fontSize:18 }}>⌫</span>), label:'Erase' },
        ].map(t => (
          <div key={t.label} style={{
            flex:1, background: PV.surface, borderRadius:16, padding:'10px 6px',
            display:'flex', flexDirection:'column', alignItems:'center', gap:3,
            boxShadow:'0 1px 0 rgba(30,26,20,0.03), 0 2px 6px rgba(30,26,20,0.04)',
            position:'relative',
          }}>
            {t.icon}
            <div style={{ fontSize:11, fontWeight:700, color: PV.inkSoft }}>{t.label}</div>
            {t.badge && (
              <span style={{
                position:'absolute', top:6, right:8,
                fontSize:9, fontWeight:800, color: PV.bg, background: PV.ink,
                padding:'1px 5px', borderRadius:999,
              }}>{t.badge}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

window.GameScreen = GameScreen;
