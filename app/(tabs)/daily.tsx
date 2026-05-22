import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { dark as colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';
import { text as typography } from '../../src/theme/typography';

export default function DailyScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Daily Challenges</Text>
      </View>
      <View style={styles.center}>
        <Text style={styles.emoji}>📅</Text>
        <Text style={styles.coming}>Coming in MVP 2</Text>
        <Text style={styles.sub}>Daily puzzles with streaks</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.primary },
  header: { padding: spacing.lg },
  title: { ...typography.hero, color: colors.text.primary },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 48, marginBottom: spacing.lg },
  coming: { ...typography.h1, color: colors.text.primary, marginBottom: spacing.sm },
  sub: { ...typography.body, color: colors.text.secondary },
});
