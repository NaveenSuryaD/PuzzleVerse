import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { dark as colors } from '../theme/colors';
import { spacing, radius } from '../theme/spacing';
import { text as typography } from '../theme/typography';
import { easings } from '../theme/animations';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={animStyle}>
      <TouchableOpacity
        style={[styles.button, styles[variant], disabled && styles.disabled]}
        onPress={onPress}
        onPressIn={() => {
          scale.value = withSpring(0.97, easings.stiffSpring);
          opacity.value = withSpring(0.85, easings.stiffSpring);
        }}
        onPressOut={() => {
          scale.value = withSpring(1.0, easings.spring);
          opacity.value = withSpring(1.0, easings.spring);
        }}
        disabled={disabled || loading}
        activeOpacity={1}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={[styles.label, styles[`${variant}Label` as keyof typeof styles]]}>{label}</Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 52,
    paddingHorizontal: spacing.xxl,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: colors.brand.primary,
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.brand.primary,
  },
  ghost: {
    backgroundColor: colors.bg.tertiary,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    ...typography.h3,
    color: '#FFFFFF',
  },
  primaryLabel: {
    color: '#FFFFFF',
  },
  secondaryLabel: {
    color: colors.brand.primary,
  },
  ghostLabel: {
    color: colors.text.secondary,
  },
});
