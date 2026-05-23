// PuzzleVerse — Splash screen

function SplashScreen() {
  return (
    <div data-screen-label="Splash" style={{
      width:'100%', height:'100%', background: PV.bg,
      display:'flex', alignItems:'center', justifyContent:'center',
      fontFamily:'Nunito, sans-serif', color: PV.ink,
      position:'relative', overflow:'hidden',
    }}>
      {/* Soft decorative shapes — extracted from category palette */}
      <div style={{ position:'absolute', top:-40, left:-60, width:220, height:220, borderRadius:'50%', background: PV.word.accent, opacity:.45 }}/>
      <div style={{ position:'absolute', top:120, right:-80, width:200, height:200, borderRadius:'50%', background: PV.visual.accent, opacity:.4 }}/>
      <div style={{ position:'absolute', bottom:-50, left:60, width:180, height:180, borderRadius:'50%', background: PV.number.accent, opacity:.45 }}/>
      <div style={{ position:'absolute', bottom:80, right:40, width:120, height:120, borderRadius:32, background: PV.logic.accent, opacity:.5, transform:'rotate(18deg)' }}/>

      <div style={{
        position:'relative', display:'flex', flexDirection:'column',
        alignItems:'center', gap:18,
      }}>
        {/* Wordmark logo — geometric "puzzle piece" formed from rounded shapes */}
        <div style={{
          width: 108, height: 108, position:'relative',
        }}>
          <div style={{
            position:'absolute', inset:0, background: PV.ink,
            borderRadius: 30, transform: 'rotate(8deg)',
          }}/>
          <div style={{
            position:'absolute', inset:0, background: PV.bg,
            borderRadius: 30, transform: 'rotate(-6deg)',
            display:'grid', gridTemplateColumns:'1fr 1fr', gridTemplateRows:'1fr 1fr', gap: 6, padding: 14,
          }}>
            <div style={{ background: PV.word.accent,   borderRadius: 10 }}/>
            <div style={{ background: PV.logic.accent,  borderRadius: 10 }}/>
            <div style={{ background: PV.number.accent, borderRadius: 10 }}/>
            <div style={{ background: PV.visual.accent, borderRadius: 10 }}/>
          </div>
        </div>

        <div style={{
          fontSize: 38, fontWeight: 900, letterSpacing:-1, lineHeight:1,
          color: PV.ink, marginTop: 8,
        }}>PuzzleVerse</div>

        <div style={{ fontSize: 15, fontWeight: 600, color: PV.inkSoft, marginTop: -6 }}>
          Every puzzle. Unlimited.
        </div>

        <div style={{ display:'flex', gap:6, marginTop: 26 }}>
          {[0,1,2].map(i => (
            <div key={i} style={{
              width: 8, height: 8, borderRadius: 4,
              background: PV.ink, opacity: i === 1 ? 1 : 0.3,
            }}/>
          ))}
        </div>
      </div>

      <div style={{
        position:'absolute', bottom: 28, left:0, right:0,
        textAlign:'center', fontSize:12, fontWeight:600, color: PV.inkMuted,
      }}>v1.0 · made with care</div>
    </div>
  );
}

window.SplashScreen = SplashScreen;
