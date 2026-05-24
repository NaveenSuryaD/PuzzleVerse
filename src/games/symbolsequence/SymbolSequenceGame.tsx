import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/useTheme';
import { fonts } from '../../theme/typography';
import * as Haptics from 'expo-haptics';

interface Props {
  onComplete: (won: boolean, timeSeconds: number) => void;
  onBack?: () => void;
}

type IconName = 'star' | 'heart' | 'moon' | 'sunny' | 'flash' | 'diamond';

const SYMBOLS: Array<{ icon: IconName; color: string }> = [
  { icon: 'star', color: '#F1C40F' },
  { icon: 'heart', color: '#E74C3C' },
  { icon: 'moon', color: '#9B59B6' },
  { icon: 'sunny', color: '#E67E22' },
  { icon: 'flash', color: '#3498DB' },
  { icon: 'diamond', color: '#2ECC71' },
];

export function SymbolSequenceGame({ onComplete, onBack }: Props) {
  const colors = useTheme();
  const elapsedRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completedRef = useRef(false);

  const [phase, setPhase] = useState<'show' | 'input' | 'result'>('show');
  const [sequence, setSequence] = useState<number[]>([]);
  const [playerInput, setPlayerInput] = useState<number[]>([]);
  const [showing, setShowing] = useState<number>(-1);
  const [round, setRound] = useState(1);
  const [done, setDone] = useState(false);

  const s = useMemo(() => makeStyles(colors), [colors]);

  useEffect(() => {
    timerRef.current = setInterval(() => { elapsedRef.current += 1; }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const finish = useCallback((w: boolean) => {
    if (completedRef.current) return;
    completedRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);
    setDone(true);
    onComplete(w, elapsedRef.current);
  }, [onComplete]);

  const startRound = useCallback((r: number) => {
    const newSeq = Array.from({ length: r + 3 }, () => Math.floor(Math.random() * SYMBOLS.length));
    setSequence(newSeq);
    setPlayerInput([]);
    setPhase('show');
    setShowing(-1);
    let i = 0;
    const showNext = () => {
      if (i < newSeq.length) {
        setShowing(newSeq[i]);
        setTimeout(() => { setShowing(-1); setTimeout(() => { i++; showNext(); }, 200); }, 600);
      } else {
        setPhase('input');
      }
    };
    setTimeout(showNext, 500);
  }, []);

  useEffect(() => { startRound(1); }, []);

  const handleSymbolTap = useCallback((idx: number) => {
    if (phase !== 'input') return;
    const newInput = [...playerInput, idx];
    setPlayerInput(newInput);
    const pos = newInput.length - 1;
    if (newInput[pos] !== sequence[pos]) {
      setPhase('result');
      setTimeout(() => finish(round > 5), 500);
      return;
    }
    if (newInput.length === sequence.length) {
      setPhase('result');
      setTimeout(() => {
        setRound(r => r + 1);
        startRound(round);
      }, 500);
    }
  }, [phase, playerInput, sequence, round, finish, startRound]);

  return (
    <View style={s.container}>
      <Text style={s.round}>Round {round}  ·  Sequence length: {sequence.length}</Text>
      <Text style={s.status}>
        {phase === 'show' ? 'Watch the sequence...' :
         phase === 'input' ? 'Now repeat it!' :
         playerInput[playerInput.length - 1] === sequence[playerInput.length - 1] ? '✓ Correct!' : '✗ Wrong!'}
      </Text>

      {/* Show flashing symbol */}
      <View style={s.flashArea}>
        {showing >= 0 ? (
          <View style={[s.flashSymbol, { backgroundColor: SYMBOLS[showing].color + '30' }]}>
            <Ionicons name={SYMBOLS[showing].icon} size={64} color={SYMBOLS[showing].color} />
          </View>
        ) : (
          <View style={[s.flashSymbol, { backgroundColor: colors.surface2 }]} />
        )}
      </View>

      {/* Symbol buttons */}
      <View style={s.symbolGrid}>
        {SYMBOLS.map((sym, i) => (
          <TouchableOpacity
            key={i}
            style={[s.symBtn, { backgroundColor: sym.color + '20' }]}
            onPress={() => handleSymbolTap(i)}
            disabled={phase !== 'input'}
            activeOpacity={0.7}
          >
            <Ionicons name={sym.icon} size={36} color={sym.color} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Progress dots */}
      <View style={s.dots}>
        {sequence.map((_, i) => (
          <View
            key={i}
            style={[s.dot, playerInput.length > i && { backgroundColor: colors.success }]}
          />
        ))}
      </View>

      <Modal visible={done} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalEmoji}>{round > 5 ? '🧠' : '💫'}</Text>
            <Text style={s.modalTitle}>{round > 5 ? 'Amazing Memory!' : `Round ${round}`}</Text>
            <Text style={s.modalSub}>Got to sequence length {sequence.length}</Text>
            {onBack && (
              <TouchableOpacity
                style={[s.modalBtn, { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.rule, marginTop: 8 }]}
                onPress={onBack}
              >
                <Text style={[s.modalBtnText, { color: colors.inkSoft }]}>Go Back</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={s.modalBtn} onPress={() => {
              setDone(false); completedRef.current = false;
              setRound(1); setPlayerInput([]); setPhase('show');
              elapsedRef.current = 0;
              timerRef.current = setInterval(() => { elapsedRef.current += 1; }, 1000);
              startRound(1);
            }}>
              <Text style={s.modalBtnText}>Play Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const makeStyles = (colors: ReturnType<typeof useTheme>) => StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  round: { fontFamily: fonts.bold, fontSize: 14, color: colors.inkMuted, marginBottom: 8 },
  status: { fontFamily: fonts.extraBold, fontSize: 18, color: colors.ink, marginBottom: 20 },
  flashArea: { width: 120, height: 120, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  flashSymbol: { width: 120, height: 120, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  symbolGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center', width: 220, marginBottom: 24 },
  symBtn: { width: 80, height: 80, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  dots: { flexDirection: 'row', gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.divider },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  modal: { backgroundColor: colors.surface, borderRadius: 24, padding: 32, alignItems: 'center', width: 300 },
  modalEmoji: { fontSize: 52, marginBottom: 12 },
  modalTitle: { fontFamily: fonts.black, fontSize: 26, color: colors.ink, marginBottom: 8 },
  modalSub: { fontFamily: fonts.semiBold, fontSize: 15, color: colors.inkMuted, marginBottom: 24 },
  modalBtn: { backgroundColor: colors.ink, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 999 },
  modalBtnText: { fontFamily: fonts.extraBold, fontSize: 15, color: colors.bg },
});
