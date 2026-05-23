import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, type ThemeColors } from '../src/theme/useTheme';
import { fonts } from '../src/theme/typography';

function Section({ title, children, colors, s }: {
  title: string;
  children: React.ReactNode;
  colors: ThemeColors;
  s: ReturnType<typeof makeStyles>;
}) {
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function NoItem({ label }: { label: string }) {
  const colors = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={s.noItem}>
      <Text style={s.noIcon}>🚫</Text>
      <Text style={s.noLabel}>{label}</Text>
    </View>
  );
}

function BulletItem({ text, colors, s }: { text: string; colors: ThemeColors; s: ReturnType<typeof makeStyles> }) {
  return (
    <View style={s.bullet}>
      <Text style={s.bulletArrow}>→</Text>
      <Text style={s.bulletText}>{text}</Text>
    </View>
  );
}

const NO_COLLECT = [
  'Your name', 'Email address', 'Phone number', 'Location data',
  'Device identifiers', 'Usage analytics', 'Crash reports', 'Advertising IDs',
  'IP address', 'Contacts', 'Photos or media', 'Health data',
];

const STORED_LOCALLY = [
  'Your game progress, scores, and statistics',
  'Daily streak counts',
  "Achievements you've unlocked",
  'Your app preferences (dark mode, sound, haptics settings)',
  "Games you've marked as favourites",
];

export default function PrivacyScreen() {
  const router = useRouter();
  const colors = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity
          style={s.backBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={20} color={colors.ink} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Privacy Policy</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
      >
        {/* App name + date */}
        <View style={s.logoRow}>
          <View style={s.logoMark}>
            <View style={{ flexDirection: 'row', gap: 3 }}>
              <View style={[s.logoCell, { backgroundColor: colors.word.bg }]} />
              <View style={[s.logoCell, { backgroundColor: colors.number.bg }]} />
            </View>
            <View style={{ flexDirection: 'row', gap: 3, marginTop: 3 }}>
              <View style={[s.logoCell, { backgroundColor: colors.logic.bg }]} />
              <View style={[s.logoCell, { backgroundColor: colors.visual.bg }]} />
            </View>
          </View>
          <View>
            <Text style={s.appName}>PuzzleVerse</Text>
            <Text style={s.metaDate}>Last updated: June 2025</Text>
          </View>
        </View>

        {/* TL;DR highlight */}
        <View style={[s.highlight, { backgroundColor: colors.logic.bg, borderColor: colors.logic.soft }]}>
          <Text style={s.highlightText}>
            <Text style={[s.highlightBold, { color: colors.logic.ink }]}>The short version: </Text>
            <Text>PuzzleVerse collects absolutely no personal data. Everything stays on your device. We don't know who you are, and we don't want to.</Text>
          </Text>
        </View>

        {/* 1 */}
        <Section title="1. Who We Are" colors={colors} s={s}>
          <Text style={s.body}>PuzzleVerse is an independent mobile application developed and maintained by a solo developer. This privacy policy explains how the app handles (or rather, doesn't handle) your information.</Text>
        </Section>

        {/* 2 */}
        <Section title="2. Data We Do Not Collect" colors={colors} s={s}>
          <Text style={s.body}>We want to be crystal clear. PuzzleVerse does <Text style={s.bold}>not</Text> collect, store, transmit, or share any of the following:</Text>
          <View style={s.noGrid}>
            {NO_COLLECT.map(label => <NoItem key={label} label={label} />)}
          </View>
        </Section>

        {/* 3 */}
        <Section title="3. Data Stored on Your Device" colors={colors} s={s}>
          <Text style={s.body}>The app stores the following information <Text style={s.bold}>locally on your device only</Text>. This data never leaves your device and is never accessible to us:</Text>
          <View style={s.bulletList}>
            {STORED_LOCALLY.map(t => <BulletItem key={t} text={t} colors={colors} s={s} />)}
          </View>
          <Text style={s.body}>This data is stored using your device's local storage. It is deleted if you uninstall the app.</Text>
        </Section>

        {/* 4 */}
        <Section title="4. Network Access" colors={colors} s={s}>
          <Text style={s.body}>PuzzleVerse does not require an internet connection and makes no network requests during normal gameplay. All puzzle generation happens entirely on your device.</Text>
          <Text style={s.body}>The only potential network activity is loading the Nunito font on first launch if not already cached by your device — this is a standard Google Fonts request and contains no personal identifiers.</Text>
        </Section>

        {/* 5 */}
        <Section title="5. Third-Party Services" colors={colors} s={s}>
          <Text style={s.body}>PuzzleVerse does not integrate any third-party analytics, advertising, tracking, or data collection SDKs. There are no third parties with access to any information from your use of the app.</Text>
        </Section>

        {/* 6 */}
        <Section title="6. Children's Privacy" colors={colors} s={s}>
          <Text style={s.body}>PuzzleVerse is appropriate for all ages including children under 13. Because we collect no data whatsoever, the app fully complies with COPPA (Children's Online Privacy Protection Act) and similar regulations globally.</Text>
        </Section>

        {/* 7 */}
        <Section title="7. Your Rights" colors={colors} s={s}>
          <Text style={s.body}>Since we hold no personal data about you, there is nothing to access, correct, export, or delete on our end. To remove all locally stored data, simply uninstall the app from your device.</Text>
        </Section>

        {/* 8 */}
        <Section title="8. Changes to This Policy" colors={colors} s={s}>
          <Text style={s.body}>If we ever update this privacy policy, we will update the date at the top of this page and note the changes clearly. We will never introduce data collection without being fully transparent about it.</Text>
        </Section>

        {/* 9 */}
        <Section title="9. Contact" colors={colors} s={s}>
          <Text style={s.body}>Questions about this privacy policy? Get in touch:</Text>
          <TouchableOpacity
            style={[s.contactCard, { backgroundColor: colors.surface, borderColor: colors.divider }]}
            onPress={() => Linking.openURL('mailto:naveen.thinkbigstudio@gmail.com')}
            activeOpacity={0.75}
          >
            <Text style={s.contactEmail}>📧 support@puzzleversegames.com</Text>
            <Text style={s.contactSub}>We'll respond personally. Usually within 48 hours.</Text>
          </TouchableOpacity>
        </Section>

        <View style={s.footer}>
          <Text style={s.footerText}>© 2025 PuzzleVerse</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.rule,
  },
  backBtn: {
    width: 40, height: 40,
    alignItems: 'center', justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: colors.surface,
  },
  headerTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 17,
    color: colors.ink,
    letterSpacing: -0.3,
  },

  scroll: { paddingHorizontal: 22, paddingBottom: 60 },

  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingTop: 24,
    paddingBottom: 20,
  },
  logoMark: {
    width: 48, height: 48,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.divider,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  logoCell: { width: 14, height: 14, borderRadius: 3 },
  appName: { fontFamily: fonts.black, fontSize: 18, color: colors.ink, letterSpacing: -0.4 },
  metaDate: { fontFamily: fonts.regular, fontSize: 13, color: colors.inkMuted, marginTop: 2 },

  highlight: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    marginBottom: 28,
  },
  highlightText: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.inkSoft,
    lineHeight: 22,
  },
  highlightBold: { fontFamily: fonts.extraBold },

  section: { marginBottom: 28 },
  sectionTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 16,
    color: colors.ink,
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },

  body: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.inkSoft,
    lineHeight: 23,
    marginBottom: 10,
  },
  bold: { fontFamily: fonts.extraBold, color: colors.ink },

  noGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
    marginBottom: 4,
  },
  noItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  noIcon: { fontSize: 16 },
  noLabel: { fontFamily: fonts.semiBold, fontSize: 13, color: colors.ink },

  bulletList: { marginTop: 8, marginBottom: 10, gap: 4 },
  bullet: { flexDirection: 'row', gap: 8, paddingVertical: 3 },
  bulletArrow: { fontFamily: fonts.bold, fontSize: 14, color: colors.logic.ink, width: 16 },
  bulletText: { fontFamily: fonts.regular, fontSize: 15, color: colors.inkSoft, flex: 1, lineHeight: 22 },

  contactCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginTop: 10,
    gap: 6,
  },
  contactEmail: { fontFamily: fonts.bold, fontSize: 15, color: colors.ink },
  contactSub: { fontFamily: fonts.regular, fontSize: 13, color: colors.inkMuted },

  footer: { paddingTop: 24, alignItems: 'center' },
  footerText: { fontFamily: fonts.regular, fontSize: 13, color: colors.inkMuted },
});
