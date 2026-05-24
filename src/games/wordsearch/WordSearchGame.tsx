import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  PanResponder,
  Dimensions,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, type ThemeColors } from '../../theme/useTheme';
import { useSettingsStore } from '../../store/useSettingsStore';
import { fonts } from '../../theme/typography';
import { playSound } from '../../audio/sounds';
import {
  generateWordSearch,
  getCellsOnLine,
  checkWordSelection,
  GRID_SIZE,
} from './generator';
import { DIR_VECTORS } from './types';
import type { PlacedWord, WordSearchPuzzle, CellCoord } from './types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_PADDING = 16;
const CELL_SIZE = Math.floor((SCREEN_WIDTH - GRID_PADDING * 2) / GRID_SIZE);
const GRID_PX = CELL_SIZE * GRID_SIZE;

const FOUND_PALETTES = (colors: ThemeColors) => [
  { bg: colors.word.bg,     text: colors.word.ink },
  { bg: colors.number.bg,   text: colors.number.ink },
  { bg: colors.logic.bg,    text: colors.logic.ink },
  { bg: colors.visual.bg,   text: colors.visual.ink },
  { bg: colors.classic.bg,  text: colors.classic.ink },
  { bg: colors.word.soft,   text: colors.word.ink },
  { bg: colors.number.soft, text: colors.number.ink },
  { bg: colors.logic.soft,  text: colors.logic.ink },
  { bg: colors.visual.soft, text: colors.visual.ink },
  { bg: colors.classic.soft,text: colors.classic.ink },
];

const formatTime = (secs: number): string => {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

// Children are pointerEvents="none", so locationX/Y are always relative to the grid container.
function coordToCell(x: number, y: number): CellCoord | null {
  const col = Math.floor(x / CELL_SIZE);
  const row = Math.floor(y / CELL_SIZE);
  if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) return null;
  return { row, col };
}

function buildFoundCellMap(words: PlacedWord[]): Map<string, number> {
  const map = new Map<string, number>();
  let colorIdx = 0;
  for (const pw of words) {
    if (!pw.found) continue;
    const [dr, dc] = DIR_VECTORS[pw.direction];
    for (let j = 0; j < pw.word.length; j++) {
      const key = `${pw.startRow + j * dr}-${pw.startCol + j * dc}`;
      if (!map.has(key)) map.set(key, colorIdx);
    }
    colorIdx++;
  }
  return map;
}

interface WordSearchGameProps {
  onComplete?: (won: boolean, timeSeconds: number) => void;
  onBack?: () => void;
}

export const WordSearchGame: React.FC<WordSearchGameProps> = ({ onComplete, onBack }) => {
  const colors = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);
  const palettes = useMemo(() => FOUND_PALETTES(colors), [colors]);
  const hapticsEnabled = useSettingsStore(st => st.hapticsEnabled);

  const [puzzle, setPuzzle] = useState<WordSearchPuzzle>(() => generateWordSearch());
  const [words, setWords] = useState<PlacedWord[]>(() => puzzle.words);
  const [selectedCells, setSelectedCells] = useState<CellCoord[]>([]);
  const [showComplete, setShowComplete] = useState(false);
  const [completedTime, setCompletedTime] = useState(0);

  // Mutable state the stable PanResponder closure reads via refs
  const startCellRef = useRef<CellCoord | null>(null);
  const wordsRef = useRef<PlacedWord[]>(puzzle.words);
  const gridRef = useRef<string[][]>(puzzle.grid);
  // Snapshot of selectedCells readable synchronously on release
  const selSnapshotRef = useRef<CellCoord[]>([]);
  const hapticsRef = useRef(hapticsEnabled);
  const onWordFoundRef = useRef<(w: string) => void>(() => {});

  const elapsedRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Keep refs in sync
  useEffect(() => { wordsRef.current = words; }, [words]);
  useEffect(() => { hapticsRef.current = hapticsEnabled; }, [hapticsEnabled]);
  useEffect(() => { selSnapshotRef.current = selectedCells; }, [selectedCells]);

  useEffect(() => {
    wordsRef.current = puzzle.words;
    gridRef.current = puzzle.grid;
    setWords(puzzle.words);
    setSelectedCells([]);
    elapsedRef.current = 0;
  }, [puzzle]);

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => { elapsedRef.current += 1; }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [puzzle]);

  const foundCellMap = useMemo(() => buildFoundCellMap(words), [words]);
  const selectedSet = useMemo(
    () => new Set(selectedCells.map(c => `${c.row}-${c.col}`)),
    [selectedCells],
  );

  const foundCount = words.filter(w => w.found).length;
  const totalCount = words.length;

  const handleWordFound = useCallback((word: string) => {
    if (hapticsRef.current) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    playSound('correct');

    setWords(prev => {
      const next = prev.map(pw => pw.word === word ? { ...pw, found: true } : pw);
      wordsRef.current = next;

      if (next.every(pw => pw.found)) {
        if (timerRef.current) clearInterval(timerRef.current);
        const t = elapsedRef.current;
        setCompletedTime(t);
        setTimeout(() => {
          setShowComplete(true);
          playSound('win');
          if (hapticsRef.current) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          onComplete?.(true, t);
        }, 500);
      }
      return next;
    });
  }, [onComplete]);

  // Always point to the latest callback
  onWordFoundRef.current = handleWordFound;

  // ── Stable PanResponder (created once, never recreated) ──────────────────
  // Children inside the grid have pointerEvents="none", so locationX/locationY
  // from every event are relative to the grid container View — no measurement needed.
  const panHandlers = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,

      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        const cell = coordToCell(locationX, locationY);
        if (!cell) return;
        startCellRef.current = cell;
        setSelectedCells([cell]);
      },

      onPanResponderMove: (evt) => {
        if (!startCellRef.current) return;
        const { locationX, locationY } = evt.nativeEvent;
        const endCell = coordToCell(locationX, locationY) ?? startCellRef.current;
        const cells = getCellsOnLine(startCellRef.current, endCell, GRID_SIZE);
        setSelectedCells(cells);
      },

      onPanResponderRelease: () => {
        if (!startCellRef.current) return;
        const cells = selSnapshotRef.current;
        const found = checkWordSelection(cells, gridRef.current, wordsRef.current);
        if (found) {
          onWordFoundRef.current(found);
        } else if (cells.length > 1 && hapticsRef.current) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        startCellRef.current = null;
        setSelectedCells([]);
      },

      onPanResponderTerminate: () => {
        startCellRef.current = null;
        setSelectedCells([]);
      },
    })
  ).current.panHandlers;
  // ─────────────────────────────────────────────────────────────────────────

  const startNewGame = useCallback(() => {
    setShowComplete(false);
    setPuzzle(generateWordSearch());
  }, []);

  return (
    <View style={s.root}>
      {/* Stats strip */}
      <View style={s.statsStrip}>
        <View style={s.statItem}>
          <Text style={s.statValue} numberOfLines={1}>{puzzle.themeEmoji} {puzzle.theme}</Text>
          <Text style={s.statLabel}>THEME</Text>
        </View>
        <View style={s.statDivider} />
        <View style={s.statItem}>
          <Text style={[s.statValue, { color: colors.word.ink }]}>{foundCount} / {totalCount}</Text>
          <Text style={s.statLabel}>FOUND</Text>
        </View>
        <View style={s.statDivider} />
        <View style={s.statItem}>
          <Text style={[s.statValue, { color: colors.inkSoft }]}>{totalCount - foundCount}</Text>
          <Text style={s.statLabel}>LEFT</Text>
        </View>
      </View>

      {/* Grid ─────────────────────────────────────────────────────────────── */}
      {/* The outer View centers the grid. The inner View has PanResponder.   */}
      {/* ALL children inside it have pointerEvents="none" so that             */}
      {/* locationX/locationY are always relative to this container.          */}
      <View style={s.gridOuter}>
        <View style={s.gridWrapper} {...panHandlers}>
          {puzzle.grid.map((row, r) => (
            // pointerEvents="none" propagates to all descendants
            <View key={r} style={s.row} pointerEvents="none">
              {row.map((letter, c) => {
                const key = `${r}-${c}`;
                const foundIdx = foundCellMap.get(key);
                const isFound = foundIdx !== undefined;
                const isSelected = selectedSet.has(key);
                const palette = isFound ? palettes[foundIdx! % palettes.length] : null;

                return (
                  <View
                    key={c}
                    style={[
                      s.cell,
                      isFound  && { backgroundColor: palette!.bg },
                      isSelected && !isFound && s.cellSelected,
                    ]}
                  >
                    <Text
                      style={[
                        s.cellText,
                        isFound  && { color: palette!.text, fontFamily: fonts.extraBold },
                        isSelected && !isFound && s.cellTextSelected,
                      ]}
                    >
                      {letter}
                    </Text>
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      </View>

      {/* Word chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.wordList}
        contentContainerStyle={s.wordListContent}
      >
        {words.map((pw, i) => {
          const pal = palettes[i % palettes.length];
          return (
            <View key={pw.word} style={[s.chip, pw.found && { backgroundColor: pal.bg }]}>
              {pw.found && (
                <Ionicons name="checkmark" size={12} color={pal.text} style={{ marginRight: 3 }} />
              )}
              <Text style={[s.chipText, pw.found && { textDecorationLine: 'line-through', color: pal.text }]}>
                {pw.word}
              </Text>
            </View>
          );
        })}
      </ScrollView>

      {/* Complete modal */}
      <Modal visible={showComplete} transparent animationType="fade" onRequestClose={() => {}}>
        <View style={s.overlay}>
          <View style={s.sheet}>
            <View style={[s.trophyCircle, { backgroundColor: colors.word.bg }]}>
              <Text style={s.trophyEmoji}>🏆</Text>
            </View>

            <Text style={s.completeTitle}>Puzzle Complete!</Text>
            <Text style={s.completeSub}>{puzzle.themeEmoji} {puzzle.theme}</Text>

            <View style={s.statsRow}>
              {[
                { value: String(foundCount), label: 'WORDS' },
                { value: formatTime(completedTime), label: 'TIME' },
                { value: String(totalCount), label: 'TOTAL' },
              ].map(item => (
                <View key={item.label} style={[s.statTile, { backgroundColor: colors.bg }]}>
                  <Text style={s.statTileValue}>{item.value}</Text>
                  <Text style={s.statTileLabel}>{item.label}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={[s.playAgainBtn, { backgroundColor: colors.ink }]}
              onPress={startNewGame}
              activeOpacity={0.82}
            >
              <Ionicons name="refresh" size={16} color={colors.bg} />
              <Text style={[s.playAgainText, { color: colors.bg }]}>Play Again</Text>
            </TouchableOpacity>
            {onBack && (
              <TouchableOpacity
                style={[s.playAgainBtn, { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.rule, marginTop: 10 }]}
                onPress={onBack}
                activeOpacity={0.82}
              >
                <Text style={[s.playAgainText, { color: colors.inkSoft }]}>Go Back</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  // Stats strip
  statsStrip: {
    marginHorizontal: 22,
    marginTop: 6,
    marginBottom: 12,
    backgroundColor: colors.surface,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontFamily: fonts.extraBold,
    fontSize: 15,
    color: colors.ink,
  },
  statLabel: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: colors.inkMuted,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: colors.rule,
  },

  // Grid
  gridOuter: {
    alignItems: 'center',
    paddingHorizontal: GRID_PADDING,
  },
  gridWrapper: {
    width: GRID_PX,
    height: GRID_PX,
    backgroundColor: colors.surface,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: colors.rule,
  },
  cellSelected: {
    backgroundColor: colors.ink,
  },
  cellText: {
    fontFamily: fonts.bold,
    fontSize: CELL_SIZE > 35 ? 14 : 13,
    color: colors.ink,
  },
  cellTextSelected: {
    color: colors.bg,
    fontFamily: fonts.extraBold,
  },

  // Word list
  wordList: {
    marginTop: 14,
  },
  wordListContent: {
    paddingHorizontal: 16,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.surface,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  chipText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.inkSoft,
    letterSpacing: 0.3,
  },

  // Complete modal
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 60,
    paddingBottom: 48,
    paddingHorizontal: 28,
    alignItems: 'center',
  },
  trophyCircle: {
    position: 'absolute',
    top: -40,
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  trophyEmoji: { fontSize: 36 },
  completeTitle: {
    fontFamily: fonts.black,
    fontSize: 26,
    color: colors.ink,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  completeSub: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    color: colors.inkMuted,
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 28,
    width: '100%',
  },
  statTile: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
  },
  statTileValue: {
    fontFamily: fonts.black,
    fontSize: 20,
    color: colors.ink,
    letterSpacing: -0.3,
  },
  statTileLabel: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: colors.inkMuted,
    letterSpacing: 0.5,
    marginTop: 3,
  },
  playAgainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 999,
    width: '100%',
    justifyContent: 'center',
  },
  playAgainText: {
    fontFamily: fonts.extraBold,
    fontSize: 16,
  },
});
