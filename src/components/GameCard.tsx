import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { dark as colors } from '../theme/colors';
import { spacing, radius } from '../theme/spacing';
import { text as typography, fonts } from '../theme/typography';
import { easings } from '../theme/animations';
import type { GameDefinition } from '../constants/games';

interface GameCardProps {
  game: GameDefinition;
  onPress: () => void;
  playsCount?: number;
  streak?: number;
  isNew?: boolean;
}

const CARD_WIDTH = (Dimensions.get('window').width - spacing.lg * 2 - spacing.md) / 2;

export const GameCard: React.FC<GameCardProps> = ({
  game,
  onPress,
  playsCount = 0,
  streak = 0,
  isNew = false,
}) => {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const categoryColor = colors.categories[game.category] ?? colors.brand.primary;

  return (
    <Animated.View style={[styles.wrapper, animStyle]}>
      <TouchableOpacity
        style={styles.card}
        onPress={onPress}
        onPressIn={() => { scale.value = withSpring(0.96, easings.stiffSpring); }}
        onPressOut={() => { scale.value = withSpring(1.0, easings.spring); }}
        activeOpacity={1}
      >
        {isNew && <View style={styles.newBadge}><Text style={styles.newBadgeText}>NEW</Text></View>}
        <View style={[styles.iconCircle, { backgroundColor: categoryColor + '33' }]}>
          <Text style={styles.emoji}>{game.emoji}</Text>
        </View>
        <View style={[styles.tag, { backgroundColor: categoryColor + '22' }]}>
          <Text style={[styles.tagText, { color: categoryColor }]}>
            {game.category.toUpperCase()}
          </Text>
        </View>
        <Text style={styles.gameName} numberOfLines={1}>{game.name}</Text>
        <Text style={styles.tagline} numberOfLines={2}>{game.tagline}</Text>
        <View style={styles.statsRow}>
          {streak > 0 && (
            <Text style={styles.statText}>🔥 {streak}</Text>
          )}
          {streak > 0 && <Text style={styles.dot}>·</Text>}
          <Text style={styles.statText}>{playsCount} plays</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: CARD_WIDTH,
  },
  card: {
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    minHeight: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  newBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.brand.secondary,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  newBadgeText: {
    ...typography.label,
    color: '#FFFFFF',
    fontSize: 9,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  emoji: {
    fontSize: 20,
  },
  tag: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    marginBottom: spacing.sm,
  },
  tagText: {
    ...typography.label,
    fontSize: 9,
  },
  gameName: {
    ...typography.h2,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  tagline: {
    ...typography.small,
    color: colors.text.secondary,
    flex: 1,
    marginBottom: spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statText: {
    ...typography.small,
    color: colors.text.tertiary,
  },
  dot: {
    ...typography.small,
    color: colors.text.tertiary,
  },
});
