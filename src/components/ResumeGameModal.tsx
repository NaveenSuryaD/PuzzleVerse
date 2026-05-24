import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../theme/useTheme';
import { fonts } from '../theme/typography';

interface Props {
  visible: boolean;
  gameEmoji: string;
  gameName: string;
  elapsedSeconds: number;
  progressSummary?: string;
  onResume: () => void;
  onStartFresh: () => void;
}

function fmt(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

export function ResumeGameModal({
  visible, gameEmoji, gameName, elapsedSeconds, progressSummary, onResume, onStartFresh,
}: Props) {
  const colors = useTheme();
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={s.overlay}>
        <View style={[s.card, { backgroundColor: colors.surface }]}>
          <Text style={s.emoji}>{gameEmoji}</Text>
          <Text style={[s.title, { color: colors.ink }]}>Resume Previous Game?</Text>
          <Text style={[s.time, { color: colors.inkMuted }]}>You were playing for {fmt(elapsedSeconds)}</Text>
          {progressSummary ? (
            <Text style={[s.progress, { color: colors.inkSoft }]}>{progressSummary}</Text>
          ) : null}
          <TouchableOpacity style={[s.btn, { backgroundColor: colors.ink }]} onPress={onResume} activeOpacity={0.82}>
            <Text style={[s.btnText, { color: colors.bg }]}>Resume</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.btn, { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.rule, marginTop: 4 }]}
            onPress={onStartFresh}
            activeOpacity={0.82}
          >
            <Text style={[s.btnText, { color: colors.inkSoft }]}>Start Fresh</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { width: '100%', borderRadius: 28, padding: 28, alignItems: 'center', gap: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 24, elevation: 12 },
  emoji: { fontSize: 52, marginBottom: 4 },
  title: { fontFamily: fonts.black, fontSize: 22, letterSpacing: -0.3, textAlign: 'center' },
  time: { fontFamily: fonts.semiBold, fontSize: 14, marginBottom: 4 },
  progress: { fontFamily: fonts.semiBold, fontSize: 13, textAlign: 'center', marginBottom: 4 },
  btn: { width: '100%', paddingVertical: 16, borderRadius: 999, alignItems: 'center', marginTop: 4 },
  btnText: { fontFamily: fonts.extraBold, fontSize: 16 },
});
