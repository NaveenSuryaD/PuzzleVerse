import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Share, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, type ThemeColors } from '../../src/theme/useTheme';
import { fonts } from '../../src/theme/typography';
import { useSettingsStore } from '../../src/store/useSettingsStore';

type ThemeOption = 'dark' | 'light' | 'system';

function Toggle({ on, onPress }: { on: boolean; onPress: () => void }) {
  const colors = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={{
        width: 46, height: 28, borderRadius: 99, padding: 3,
        backgroundColor: on ? colors.ink : colors.rule,
        justifyContent: 'center',
      }}
    >
      <View style={{
        width: 22, height: 22, borderRadius: 99,
        backgroundColor: colors.surface,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
        elevation: 2,
        transform: [{ translateX: on ? 18 : 0 }],
      }} />
    </TouchableOpacity>
  );
}

function SettingRow({
  label, sub, control, isLast, onPress, colors,
}: {
  label: string;
  sub?: string;
  control: React.ReactNode;
  isLast?: boolean;
  onPress?: () => void;
  colors: ThemeColors;
}) {
  const s = useMemo(() => rowStyles(colors), [colors]);
  const content = (
    <View style={[s.row, !isLast && s.rowBorder]}>
      <View style={s.rowText}>
        <Text style={s.rowLabel}>{label}</Text>
        {sub && <Text style={s.rowSub}>{sub}</Text>}
      </View>
      {control}
    </View>
  );
  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }
  return content;
}

function SettingGroup({ title, children, colors }: { title: string; children: React.ReactNode; colors: ThemeColors }) {
  const s = useMemo(() => groupStyles(colors), [colors]);
  return (
    <View style={s.group}>
      <Text style={s.groupTitle}>{title}</Text>
      <View style={s.groupCard}>{children}</View>
    </View>
  );
}

export default function SettingsScreen() {
  const colors = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);
  const {
    theme, setTheme,
    hapticsEnabled, setHapticsEnabled,
    soundEnabled, setSoundEnabled,
    showTimer, setShowTimer,
    reducedMotion, setReducedMotion,
  } = useSettingsStore();

  const handleShare = async () => {
    try {
      await Share.share({
        message: 'I\'ve been playing PuzzleVerse — every puzzle, unlimited. Check it out!',
        title: 'PuzzleVerse',
      });
    } catch {}
  };

  const handleRate = () => {
    // Opens App Store — replace with real App Store URL when published
    Linking.openURL('https://apps.apple.com/app/puzzleverse').catch(() =>
      Alert.alert('Coming soon', 'Rating will be available when the app is published.')
    );
  };

  const handlePrivacy = () => {
    Linking.openURL('https://puzzleverse.app/privacy').catch(() =>
      Alert.alert('Coming soon', 'Privacy policy will be available at puzzleverse.app')
    );
  };

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
        {/* Header */}
        <View style={s.header}>
          <Text style={s.eyebrow}>Customize your app</Text>
          <Text style={s.title}>Settings</Text>
        </View>

        {/* Appearance */}
        <SettingGroup title="APPEARANCE" colors={colors}>
          <SettingRow
            label="Theme"
            colors={colors}
            control={(
              <View style={[s.segmented, { backgroundColor: colors.bg }]}>
                {(['Light', 'Dark', 'System'] as const).map(t => {
                  const val = t.toLowerCase() as ThemeOption;
                  const active = theme === val;
                  return (
                    <TouchableOpacity
                      key={t}
                      onPress={() => setTheme(val)}
                      style={[s.seg, active && { backgroundColor: colors.surface }]}
                      activeOpacity={0.75}
                    >
                      <Text style={[s.segText, { color: active ? colors.ink : colors.inkMuted }]}>
                        {t}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          />
          <SettingRow
            label="Haptic feedback"
            isLast
            colors={colors}
            control={<Toggle on={hapticsEnabled} onPress={() => setHapticsEnabled(!hapticsEnabled)} />}
          />
        </SettingGroup>

        {/* Gameplay */}
        <SettingGroup title="GAMEPLAY" colors={colors}>
          <SettingRow
            label="Sound effects"
            colors={colors}
            control={<Toggle on={soundEnabled} onPress={() => setSoundEnabled(!soundEnabled)} />}
          />
          <SettingRow
            label="Show timer"
            sub="Display elapsed time while playing"
            colors={colors}
            control={<Toggle on={showTimer} onPress={() => setShowTimer(!showTimer)} />}
          />
          <SettingRow
            label="Animations"
            sub="Reduce for accessibility"
            isLast
            colors={colors}
            control={<Toggle on={!reducedMotion} onPress={() => setReducedMotion(!reducedMotion)} />}
          />
        </SettingGroup>

        {/* About */}
        <SettingGroup title="ABOUT" colors={colors}>
          <SettingRow
            label="Rate PuzzleVerse"
            colors={colors}
            onPress={handleRate}
            control={<Ionicons name="chevron-forward" size={14} color={colors.inkMuted} />}
          />
          <SettingRow
            label="Share with a friend"
            colors={colors}
            onPress={handleShare}
            control={<Ionicons name="chevron-forward" size={14} color={colors.inkMuted} />}
          />
          <SettingRow
            label="Privacy & terms"
            colors={colors}
            onPress={handlePrivacy}
            control={<Ionicons name="chevron-forward" size={14} color={colors.inkMuted} />}
          />
          <SettingRow
            label="Version"
            sub="1.0.0 (build 1)"
            isLast
            colors={colors}
            control={null}
          />
        </SettingGroup>

        <View style={{ height: 8 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const rowStyles = (colors: ThemeColors) => StyleSheet.create({
  row: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.rule,
  },
  rowText: { flex: 1, minWidth: 0 },
  rowLabel: { fontFamily: fonts.bold, fontSize: 15, color: colors.ink },
  rowSub: { fontFamily: fonts.regular, fontSize: 12, color: colors.inkMuted, marginTop: 2 },
});

const groupStyles = (colors: ThemeColors) => StyleSheet.create({
  group: { paddingHorizontal: 22, paddingTop: 14 },
  groupTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 12,
    color: colors.inkMuted,
    letterSpacing: 0.6,
    paddingHorizontal: 4,
    paddingBottom: 8,
  },
  groupCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
});

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scrollContent: { paddingBottom: 110 },
  header: { paddingHorizontal: 22, paddingTop: 14, paddingBottom: 4 },
  eyebrow: { fontFamily: fonts.semiBold, fontSize: 14, color: colors.inkMuted },
  title: { fontFamily: fonts.black, fontSize: 30, color: colors.ink, marginTop: 2, letterSpacing: -0.8 },

  segmented: {
    flexDirection: 'row',
    borderRadius: 99,
    padding: 3,
    gap: 2,
  },
  seg: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 99,
  },
  segText: {
    fontFamily: fonts.bold,
    fontSize: 13,
  },
});
