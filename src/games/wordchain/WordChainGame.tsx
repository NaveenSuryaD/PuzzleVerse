import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Modal, ScrollView } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { fonts } from '../../theme/typography';
import * as Haptics from 'expo-haptics';
import { useGameTimer } from '../../hooks/useGameTimer';
import { usePersistentGameState } from '../../hooks/usePersistentGameState';
import { ResumeGameModal } from '../../components/ResumeGameModal';

interface Props {
  onComplete: (won: boolean, timeSeconds: number) => void;
  onBack?: () => void;
  paused?: boolean;
}

interface SaveState {
  words: string[];
}

const VALID_WORDS = new Set([
  'apple','eagle','elephant','toad','dog','goat','tiger','rhino','owl','wolf',
  'fox','xray','yacht','top','pen','nut','tap','pit','tin','net','tan',
  'ant','tape','even','never','rain','night','train','noon','nail','lane',
  'era','act','tip','pot','toe','eel','lily','yell','lot','ten','nap',
  'peel','loop','polo','open','noon','name','edge','dye','yes','sun',
  'new','wit','two','one','end','den','now','wan','war','rap','par',
  'arm','may','yam','mad','dim','mid','dip','pin','nip','pad','dad',
  'dark','kind','dusk','keen','nest','stem','mode','desk','seal','also',
  'slow','west','tree','earn','road','dart','time','mind','lime','meal',
  'lean','note','even','near','real','late','tale','ever','rest','test',
]);

const STARTER_WORDS = ['apple','train','night','eagle','polar','tower','steam'];

function initWords() {
  const starter = STARTER_WORDS[Math.floor(Math.random() * STARTER_WORDS.length)];
  return [starter];
}

export function WordChainGame({ onComplete, onBack,
  paused = false,
}: Props) {
  const colors = useTheme();
  const timer = useGameTimer();
  useEffect(() => {
    if (paused) timer.pause();
    else timer.resume();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused]);

  const { save, load, clear } = usePersistentGameState<SaveState>('word-chain');

  const [timeLeft, setTimeLeft] = useState(60);
  const [words, setWords] = useState<string[]>(() => initWords());
  const wordsRef = useRef<string[]>([]);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [showResumeModal, setShowResumeModal] = useState(false);
  const [resumeElapsed, setResumeElapsed] = useState(0);
  const [pendingSavedState, setPendingSavedState] = useState<SaveState | null>(null);

  const s = useMemo(() => makeStyles(colors), [colors]);

  const finish = useCallback((w: boolean) => {
    clear();
    timer.pause();
    if (countdownRef.current) clearInterval(countdownRef.current);
    setDone(true);
    onComplete(w, timer.elapsedSeconds);
  }, [onComplete, clear, timer]);

  const startCountdown = useCallback(() => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(countdownRef.current!);
          finish(wordsRef.current.length > 1);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }, [finish]);

  // Mount: load saved state
  useEffect(() => {
    load().then(result => {
      if (result.found && result.gameState) {
        setPendingSavedState(result.gameState);
        setResumeElapsed(result.elapsedSeconds);
        setShowResumeModal(true);
      } else {
        timer.start();
        startCountdown();
      }
    });
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save on meaningful changes
  useEffect(() => {
    if (!done && timer.isRunning) {
      save({ words }, timer.elapsedSeconds);
    }
  }, [words]);

  const handleResume = useCallback(() => {
    if (!pendingSavedState) return;
    setWords(pendingSavedState.words);
    setShowResumeModal(false);
    timer.restoreAndResume(resumeElapsed);
    startCountdown();
  }, [pendingSavedState, resumeElapsed, timer, startCountdown]);

  const handleStartFresh = useCallback(() => {
    clear();
    setWords(initWords());
    setTimeLeft(60);
    setShowResumeModal(false);
    timer.start();
    startCountdown();
  }, [clear, timer, startCountdown]);

  wordsRef.current = words;
  const lastWord = words[words.length - 1];
  const requiredStart = lastWord[lastWord.length - 1].toUpperCase();

  const handleSubmit = useCallback(() => {
    const word = input.trim().toLowerCase();
    if (word.length < 2) { setError('Too short'); return; }
    if (word[0] !== lastWord[lastWord.length - 1]) {
      setError(`Must start with "${requiredStart}"`);
      return;
    }
    if (!VALID_WORDS.has(word)) { setError('Not a valid word'); return; }
    if (words.includes(word)) { setError('Already used'); return; }
    setWords(prev => [...prev, word]);
    setInput('');
    setError('');
  }, [input, lastWord, words, requiredStart]);

  return (
    <View style={s.container}>
      <ResumeGameModal
        visible={showResumeModal}
        gameEmoji="🔗"
        gameName="Word Chain"
        elapsedSeconds={resumeElapsed}
        progressSummary={pendingSavedState ? `${pendingSavedState.words.length - 1} words chained` : undefined}
        onResume={handleResume}
        onStartFresh={handleStartFresh}
      />

      <View style={s.timerRow}>
        <Text style={s.timerText}>{timeLeft}s</Text>
        <Text style={s.scoreText}>Words: {words.length - 1}</Text>
      </View>

      <Text style={s.instruction}>
        Next word must start with: <Text style={s.highlight}>{requiredStart}</Text>
      </Text>

      <ScrollView style={s.wordList} contentContainerStyle={{ paddingVertical: 8 }}>
        {[...words].reverse().map((w, i) => (
          <View key={i} style={s.wordItem}>
            <Text style={s.wordText}>{w.toUpperCase()}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={s.inputRow}>
        <TextInput
          style={s.input}
          value={input}
          onChangeText={t => { setInput(t); setError(''); }}
          placeholder={`Start with "${requiredStart}"...`}
          placeholderTextColor={colors.inkMuted}
          autoCapitalize="none"
          returnKeyType="done"
          onSubmitEditing={handleSubmit}
        />
        <TouchableOpacity style={s.goBtn} onPress={handleSubmit} activeOpacity={0.8}>
          <Text style={s.goBtnText}>Go</Text>
        </TouchableOpacity>
      </View>
      {error ? <Text style={s.error}>{error}</Text> : null}

      <Modal visible={done} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalEmoji}>⛓️</Text>
            <Text style={s.modalTitle}>Time's Up!</Text>
            <Text style={s.modalSub}>Words chained: {words.length - 1}</Text>
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
              setWords(initWords()); setInput(''); setError('');
              setTimeLeft(60);
              timer.start();
              startCountdown();
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
  container: { flex: 1, padding: 24 },
  timerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  timerText: { fontFamily: fonts.black, fontSize: 24, color: colors.danger },
  scoreText: { fontFamily: fonts.extraBold, fontSize: 18, color: colors.ink },
  instruction: { fontFamily: fonts.semiBold, fontSize: 16, color: colors.inkMuted, marginBottom: 12, textAlign: 'center' },
  highlight: { color: colors.word.ink, fontFamily: fonts.black, fontSize: 20 },
  wordList: { flex: 1, marginBottom: 12 },
  wordItem: { paddingVertical: 6, borderBottomWidth: 1, borderColor: colors.rule },
  wordText: { fontFamily: fonts.bold, fontSize: 15, color: colors.ink },
  inputRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  input: {
    flex: 1, height: 48, backgroundColor: colors.surface, borderRadius: 12,
    paddingHorizontal: 16, fontFamily: fonts.semiBold, fontSize: 16, color: colors.ink,
    borderWidth: 1.5, borderColor: colors.divider,
  },
  goBtn: { backgroundColor: colors.ink, paddingHorizontal: 20, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  goBtnText: { fontFamily: fonts.extraBold, fontSize: 16, color: colors.bg },
  error: { fontFamily: fonts.semiBold, fontSize: 13, color: colors.danger, textAlign: 'center' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  modal: { backgroundColor: colors.surface, borderRadius: 24, padding: 32, alignItems: 'center', width: 300 },
  modalEmoji: { fontSize: 52, marginBottom: 12 },
  modalTitle: { fontFamily: fonts.black, fontSize: 26, color: colors.ink, marginBottom: 8 },
  modalSub: { fontFamily: fonts.semiBold, fontSize: 15, color: colors.inkMuted, marginBottom: 24 },
  modalBtn: { backgroundColor: colors.ink, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 999 },
  modalBtnText: { fontFamily: fonts.extraBold, fontSize: 15, color: colors.bg },
});
