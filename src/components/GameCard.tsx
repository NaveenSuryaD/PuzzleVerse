import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, type ThemeColors } from '../theme/useTheme';
import { fonts } from '../theme/typography';
import { easings } from '../theme/animations';
import type { GameDefinition } from '../constants/games';

interface GameCardProps {
  game: GameDefinition;
  onPress: () => void;
  playsCount?: number;
  streak?: number;
  isNew?: boolean;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = (SCREEN_WIDTH - 22 * 2 - 12) / 2;

function GridGlyph({ color }: { color: string }) {
  return (
    <View style={{ width: 26, height: 26, flexDirection: 'row', flexWrap: 'wrap', gap: 2 }}>
      {Array.from({ length: 9 }).map((_, i) => (
        <View key={i} style={{
          width: 7, height: 7, borderRadius: 1.5,
          backgroundColor: color, opacity: i % 2 === 0 ? 1 : 0.55,
        }} />
      ))}
    </View>
  );
}

const GLYPHS: Record<string, string> = {
  word: 'Aa',
  number: '7',
  logic: '≡',
  visual: '◆',
  classic: '♟',
};

export const GameCard: React.FC<GameCardProps> = ({
  game,
  onPress,
  playsCount = 0,
  streak = 0,
  isNew = false,
}) => {
  const colors = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const tone = colors[game.category];

  return (
    <Animated.View style={[{ width: CARD_WIDTH }, animStyle]}>
      <TouchableOpacity
        style={s.card}
        onPress={onPress}
        onPressIn={() => { scale.value = withSpring(0.96, easings.stiffSpring); }}
        onPressOut={() => { scale.value = withSpring(1.0, easings.spring); }}
        activeOpacity={1}
      >
        {isNew && (
          <View style={s.newBadge}>
            <Text style={s.newBadgeText}>NEW</Text>
          </View>
        )}
        <View style={[s.glyphWell, { backgroundColor: tone.bg }]}>
          {game.id === 'sudoku'
            ? <GridGlyph color={tone.ink} />
            : <Text style={[s.glyphText, { color: tone.ink }]}>
                {GLYPHS[game.category] ?? '?'}
              </Text>
          }
        </View>
        <View style={s.textBlock}>
          <Text style={s.gameName} numberOfLines={1}>{game.name}</Text>
          <Text style={s.tagline} numberOfLines={2}>{game.tagline}</Text>
        </View>
        {streak > 0 && (
          <View style={s.streakRow}>
            <Ionicons name="flame" size={12} color="#E26A2C" />
            <Text style={s.streakText}>{streak} day streak</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 26,
    padding: 16,
    minHeight: 168,
    gap: 10,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  newBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    backgroundColor: colors.ink,
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  newBadgeText: {
    fontFamily: fonts.extraBold,
    fontSize: 10,
    color: colors.bg,
    letterSpacing: 0.6,
  },
  glyphWell: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyphText: {
    fontFamily: fonts.black,
    fontSize: 24,
    lineHeight: 28,
  },
  textBlock: {
    marginTop: 'auto' as any,
  },
  gameName: {
    fontFamily: fonts.extraBold,
    fontSize: 17,
    color: colors.ink,
    lineHeight: 20,
  },
  tagline: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.inkMuted,
    marginTop: 3,
    lineHeight: 17,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  streakText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.inkSoft,
  },
});
