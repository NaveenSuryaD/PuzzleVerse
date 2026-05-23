import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, type ThemeColors } from '../src/theme/useTheme';
import { fonts } from '../src/theme/typography';
import { GAMES } from '../src/constants/games';
import type { GameDefinition } from '../src/constants/games';

const RECENT = ['Sudoku', 'Word Guess'];
const TRENDING = ['Logic', 'Daily', 'Word', 'Quick', 'Classic'];

const CATEGORY_GLYPHS: Record<string, string> = {
  word: 'Aa', number: '7', logic: '≡', visual: '◆', classic: '♟',
};

const GLYPH_WELL_STYLE = { width: 44, height: 44, borderRadius: 14, alignItems: 'center' as const, justifyContent: 'center' as const, flexShrink: 0 as const };
const RESULT_NAME_STYLE = { fontSize: 15, fontFamily: fonts.extraBold };

function GameGlyph({ game, colors }: { game: GameDefinition; colors: ThemeColors }) {
  const glyph = CATEGORY_GLYPHS[game.category] ?? '?';
  const cat = colors[game.category as keyof ThemeColors] as { bg: string; ink: string };
  return (
    <View style={[GLYPH_WELL_STYLE, { backgroundColor: cat.bg }]}>
      <Text style={{ fontFamily: fonts.black, fontSize: 22, color: cat.ink, lineHeight: 28 }}>
        {glyph}
      </Text>
    </View>
  );
}

function highlight(text: string, query: string, colors: ThemeColors) {
  if (!query) return <Text style={[RESULT_NAME_STYLE, { color: colors.ink }]}>{text}</Text>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <Text style={[RESULT_NAME_STYLE, { color: colors.ink }]}>{text}</Text>;
  return (
    <Text style={[RESULT_NAME_STYLE, { color: colors.ink }]}>
      {text.slice(0, idx)}
      <Text style={[RESULT_NAME_STYLE, { color: colors.ink, backgroundColor: colors.logic.bg, borderRadius: 4 }]}>
        {text.slice(idx, idx + query.length)}
      </Text>
      {text.slice(idx + query.length)}
    </Text>
  );
}

export default function SearchScreen() {
  const router = useRouter();
  const colors = useTheme();
  const [query, setQuery] = useState('');
  const inputRef = useRef<TextInput>(null);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return GAMES.filter(
      g => g.name.toLowerCase().includes(q) || g.tagline.toLowerCase().includes(q) || g.category.includes(q)
    );
  }, [query]);

  const handleCancel = useCallback(() => {
    Keyboard.dismiss();
    router.back();
  }, [router]);

  const handleClear = useCallback(() => {
    setQuery('');
    inputRef.current?.focus();
  }, []);

  const handleGamePress = useCallback((game: GameDefinition) => {
    Keyboard.dismiss();
    router.push(`/game/${game.id}`);
  }, [router]);

  const s = makeStyles(colors);

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      {/* Search bar */}
      <View style={s.searchRow}>
        <View style={s.inputWrap}>
          <Ionicons name="search-outline" size={18} color={colors.inkMuted} />
          <TextInput
            ref={inputRef}
            style={s.input}
            placeholder="Search games…"
            placeholderTextColor={colors.inkMuted}
            value={query}
            onChangeText={setQuery}
            autoFocus
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={handleClear} style={s.clearBtn} activeOpacity={0.7}>
              <Ionicons name="close-circle" size={18} color={colors.inkSoft} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity onPress={handleCancel} activeOpacity={0.7}>
          <Text style={s.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={s.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {query.trim() === '' ? (
          <>
            {/* Recent */}
            <Text style={s.sectionLabel}>Recent</Text>
            <View style={s.pillRow}>
              {RECENT.map(t => (
                <TouchableOpacity
                  key={t}
                  style={[s.recentPill, { backgroundColor: colors.surface }]}
                  activeOpacity={0.7}
                  onPress={() => setQuery(t)}
                >
                  <Ionicons name="time-outline" size={12} color={colors.inkMuted} />
                  <Text style={[s.pillText, { color: colors.ink }]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Trending */}
            <Text style={s.sectionLabel}>Trending searches</Text>
            <View style={s.pillRow}>
              {TRENDING.map(t => (
                <TouchableOpacity
                  key={t}
                  style={[s.trendingPill, { borderColor: colors.rule }]}
                  activeOpacity={0.7}
                  onPress={() => setQuery(t)}
                >
                  <Text style={[s.pillText, { color: colors.inkSoft }]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        ) : (
          <>
            {/* Results header */}
            <View style={s.resultsHeader}>
              <Text style={s.sectionLabel}>Results</Text>
              <Text style={[s.resultCount, { color: colors.inkMuted }]}>
                {results.length} game{results.length !== 1 ? 's' : ''}
              </Text>
            </View>

            {results.length === 0 ? (
              <View style={s.emptyState}>
                <Text style={[s.emptyTitle, { color: colors.ink }]}>No games found</Text>
                <Text style={[s.emptyBlurb, { color: colors.inkMuted }]}>
                  Try searching by name or category
                </Text>
              </View>
            ) : (
              <View style={s.resultsList}>
                {results.map(game => (
                  <TouchableOpacity
                    key={game.id}
                    style={[s.resultRow, { backgroundColor: colors.surface }]}
                    activeOpacity={0.7}
                    onPress={() => handleGamePress(game)}
                  >
                    <GameGlyph game={game} colors={colors} />
                    <View style={s.resultInfo}>
                      {highlight(game.name, query, colors)}
                      <Text style={[s.resultBlurb, { color: colors.inkMuted }]} numberOfLines={1}>
                        {game.tagline}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.inkMuted} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: ReturnType<typeof useTheme>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 10,
  },
  inputWrap: {
    flex: 1,
    height: 48,
    backgroundColor: colors.surface,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 10,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: fonts.semiBold,
    color: colors.ink,
  },
  clearBtn: {
    padding: 2,
  },
  cancelText: {
    fontSize: 15,
    fontFamily: fonts.extraBold,
    color: colors.inkSoft,
  },
  scroll: {
    flex: 1,
  },
  sectionLabel: {
    fontSize: 12,
    fontFamily: fonts.black,
    color: colors.inkMuted,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 10,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 22,
    gap: 8,
  },
  recentPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  trendingPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
  pillText: {
    fontSize: 13,
    fontFamily: fonts.bold,
  },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingRight: 22,
  },
  resultCount: {
    fontSize: 13,
    fontFamily: fonts.bold,
    marginTop: 18,
  },
  resultsList: {
    paddingHorizontal: 22,
    gap: 10,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 18,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  resultInfo: {
    flex: 1,
    minWidth: 0,
  },
  resultBlurb: {
    fontSize: 12,
    fontFamily: fonts.semiBold,
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: fonts.bold,
    marginBottom: 8,
  },
  emptyBlurb: {
    fontSize: 14,
    fontFamily: fonts.regular,
    textAlign: 'center',
  },
});
