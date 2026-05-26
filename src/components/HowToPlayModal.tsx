import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  useColorScheme,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface HowToPlayModalProps {
  visible: boolean;
  gameEmoji: string;
  gameName: string;
  instructions: string[];
  example?: string;
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({
  visible,
  gameEmoji,
  gameName,
  instructions,
  example,
  onClose,
}) => {
  const isDark = useColorScheme() === 'dark';
  const insets = useSafeAreaInsets();

  const bg = isDark ? '#16162A' : '#FFFFFF';
  const textPrimary = isDark ? '#F0F0FF' : '#12122A';
  const textSecondary = isDark ? '#9898B8' : '#4A4A72';
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const handleColor = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          activeOpacity={1}
        />
        <View style={[
          styles.sheet,
          {
            backgroundColor: bg,
            paddingBottom: insets.bottom + 16,
            maxHeight: SCREEN_HEIGHT * 0.85,
          },
        ]}>
          <View style={[styles.handle, { backgroundColor: handleColor }]} />
          <View style={styles.header}>
            <Text style={styles.headerEmoji}>{gameEmoji}</Text>
            <Text style={[styles.headerTitle, { color: textPrimary }]}>How to Play</Text>
            <Text style={[styles.headerSubtitle, { color: textSecondary }]}>{gameName}</Text>
          </View>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={true}
          >
            {instructions.map((instruction, index) => (
              <View key={index} style={styles.instructionRow}>
                <View style={[styles.stepBadge, { backgroundColor: '#6C63FF' }]}>
                  <Text style={styles.stepNumber}>{index + 1}</Text>
                </View>
                <Text style={[styles.instructionText, { color: textPrimary }]}>
                  {instruction}
                </Text>
              </View>
            ))}
            {example && (
              <View style={[styles.exampleBox, { borderColor: border, backgroundColor: isDark ? '#1E1E35' : '#F5F5FF' }]}>
                <Text style={[styles.exampleLabel, { color: textSecondary }]}>EXAMPLE</Text>
                <Text style={[styles.exampleText, { color: textPrimary }]}>{example}</Text>
              </View>
            )}
            <View style={{ height: 16 }} />
          </ScrollView>
          <TouchableOpacity style={styles.gotItBtn} onPress={onClose} activeOpacity={0.85}>
            <Text style={styles.gotItText}>Got it, let's play!</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 20,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  headerEmoji: { fontSize: 44, marginBottom: 8 },
  headerTitle: { fontSize: 22, fontWeight: '800', marginBottom: 4 },
  headerSubtitle: { fontSize: 14, fontWeight: '600' },
  scrollView: { flexGrow: 0 },
  scrollContent: { flexGrow: 1 },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  stepNumber: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  instructionText: { flex: 1, fontSize: 15, lineHeight: 22 },
  exampleBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  exampleLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginBottom: 8 },
  exampleText: { fontSize: 14, lineHeight: 20 },
  gotItBtn: {
    marginTop: 16,
    height: 52,
    backgroundColor: '#6C63FF',
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gotItText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
