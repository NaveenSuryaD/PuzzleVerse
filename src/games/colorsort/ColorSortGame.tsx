import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { fonts } from '../../theme/typography';
import { generateColorSort, isSolved, canMove, applyMove } from './generator';
import type { Tube } from './types';
import * as Haptics from 'expo-haptics';

interface Props {
  onComplete: (won: boolean, timeSeconds: number) => void;
  onBack?: () => void;
}

const COLOR_MAP: Record<string, string> = {
  red: '#E74C3C',
  blue: '#3498DB',
  green: '#2ECC71',
  yellow: '#F1C40F',
  purple: '#9B59B6',
};

export function ColorSortGame({ onComplete, onBack }: Props) {
  const colors = useTheme();
  const elapsedRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completedRef = useRef(false);

  const [tubes, setTubes] = useState<Tube[]>(() => generateColorSort().tubes);
  const [selected, setSelected] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const [moves, setMoves] = useState(0);

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

  const handleTubeTap = useCallback((idx: number) => {
    if (selected === null) {
      if (tubes[idx].length > 0) setSelected(idx);
      return;
    }
    if (selected === idx) {
      setSelected(null);
      return;
    }
    if (canMove(tubes, selected, idx)) {
      const next = applyMove(tubes, selected, idx);
      setTubes(next);
      setMoves(m => m + 1);
      setSelected(null);
      if (isSolved(next)) finish(true);
    } else {
      setSelected(idx);
    }
  }, [selected, tubes, finish]);

  const TUBE_H = 180;
  const BALL_H = TUBE_H / 4 - 4;

  return (
    <View style={s.container}>
      <Text style={s.title}>Color Sort</Text>
      <Text style={s.subtitle}>Sort each color into its own tube · Moves: {moves}</Text>

      <View style={s.tubesRow}>
        {tubes.map((tube, ti) => (
          <TouchableOpacity
            key={ti}
            style={[
              s.tube,
              selected === ti && s.tubeSelected,
              { height: TUBE_H },
            ]}
            onPress={() => handleTubeTap(ti)}
            activeOpacity={0.85}
          >
            <View style={s.tubeInner}>
              {/* Show balls from bottom to top (reverse) */}
              {[...Array(4)].map((_, bi) => {
                const ballIdx = bi; // 0=bottom ... 3=top
                const ballColor = tube[ballIdx];
                return (
                  <View
                    key={bi}
                    style={[
                      s.ball,
                      { height: BALL_H, backgroundColor: ballColor ? COLOR_MAP[ballColor] : 'transparent' },
                    ]}
                  />
                );
              })}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={s.resetBtn} onPress={() => {
        setTubes(generateColorSort().tubes);
        setSelected(null);
        setMoves(0);
      }} activeOpacity={0.8}>
        <Text style={s.resetBtnText}>New Game</Text>
      </TouchableOpacity>

      <Modal visible={done} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalEmoji}>🎨</Text>
            <Text style={s.modalTitle}>Sorted!</Text>
            <Text style={s.modalSub}>Completed in {moves} moves</Text>
            {onBack && (
              <TouchableOpacity
                style={[s.modalBtn, { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.rule, marginTop: 8 }]}
                onPress={onBack}
              >
                <Text style={[s.modalBtnText, { color: colors.inkSoft }]}>Go Back</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={s.modalBtn} onPress={() => {
              setDone(false);
              completedRef.current = false;
              setTubes(generateColorSort().tubes);
              setSelected(null);
              setMoves(0);
              elapsedRef.current = 0;
              timerRef.current = setInterval(() => { elapsedRef.current += 1; }, 1000);
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
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  title: { fontFamily: fonts.black, fontSize: 22, color: colors.ink, marginBottom: 4 },
  subtitle: { fontFamily: fonts.semiBold, fontSize: 13, color: colors.inkMuted, marginBottom: 28 },
  tubesRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-end', marginBottom: 32 },
  tube: {
    width: 44, borderRadius: 22, borderWidth: 2.5,
    borderColor: colors.divider, backgroundColor: colors.surface,
    justifyContent: 'flex-end', overflow: 'hidden',
  },
  tubeSelected: { borderColor: colors.logic.ink, shadowColor: colors.logic.ink, shadowRadius: 8, shadowOpacity: 0.4, elevation: 6 },
  tubeInner: { flex: 1, justifyContent: 'flex-end' },
  ball: { width: '100%', borderRadius: 4 },
  resetBtn: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.divider, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 999 },
  resetBtnText: { fontFamily: fonts.bold, fontSize: 14, color: colors.inkSoft },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  modal: { backgroundColor: colors.surface, borderRadius: 24, padding: 32, alignItems: 'center', width: 300 },
  modalEmoji: { fontSize: 52, marginBottom: 12 },
  modalTitle: { fontFamily: fonts.black, fontSize: 26, color: colors.ink, marginBottom: 8 },
  modalSub: { fontFamily: fonts.semiBold, fontSize: 15, color: colors.inkMuted, marginBottom: 24 },
  modalBtn: { backgroundColor: colors.ink, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 999 },
  modalBtnText: { fontFamily: fonts.extraBold, fontSize: 15, color: colors.bg },
});
