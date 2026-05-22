import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, Switch, ScrollView } from 'react-native';
import { dark as colors } from '../../src/theme/colors';
import { spacing, radius } from '../../src/theme/spacing';
import { text as typography } from '../../src/theme/typography';
import { useSettingsStore } from '../../src/store/useSettingsStore';

interface SettingRowProps {
  label: string;
  description?: string;
  value: boolean;
  onToggle: (v: boolean) => void;
}

const SettingRow: React.FC<SettingRowProps> = ({ label, description, value, onToggle }) => (
  <View style={styles.row}>
    <View style={styles.rowInfo}>
      <Text style={styles.rowLabel}>{label}</Text>
      {description && <Text style={styles.rowDesc}>{description}</Text>}
    </View>
    <Switch
      value={value}
      onValueChange={onToggle}
      trackColor={{ false: colors.bg.elevated, true: colors.brand.primary }}
      thumbColor="#FFFFFF"
    />
  </View>
);

export default function SettingsScreen() {
  const {
    hapticsEnabled, setHapticsEnabled,
    soundEnabled, setSoundEnabled,
    showTimer, setShowTimer,
  } = useSettingsStore();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionHeader}>GAMEPLAY</Text>
        <View style={styles.section}>
          <SettingRow
            label="Haptic Feedback"
            description="Vibrate on interactions"
            value={hapticsEnabled}
            onToggle={setHapticsEnabled}
          />
          <View style={styles.divider} />
          <SettingRow
            label="Sound Effects"
            description="Audio cues"
            value={soundEnabled}
            onToggle={setSoundEnabled}
          />
          <View style={styles.divider} />
          <SettingRow
            label="Show Timer"
            description="Display timer during games"
            value={showTimer}
            onToggle={setShowTimer}
          />
        </View>

        <Text style={styles.sectionHeader}>ABOUT</Text>
        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Version</Text>
            <Text style={styles.rowValue}>1.0.0 (MVP 1)</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.primary },
  header: { padding: spacing.lg },
  title: { ...typography.hero, color: colors.text.primary },
  content: { padding: spacing.lg },
  sectionHeader: {
    ...typography.label,
    color: colors.text.tertiary,
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
  },
  section: {
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
  },
  rowInfo: { flex: 1, marginRight: spacing.md },
  rowLabel: { ...typography.h3, color: colors.text.primary },
  rowDesc: { ...typography.small, color: colors.text.secondary, marginTop: 2 },
  rowValue: { ...typography.body, color: colors.text.secondary },
  divider: { height: 1, backgroundColor: colors.border.subtle, marginLeft: spacing.lg },
});
