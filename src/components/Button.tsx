import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '../theme/useTheme';
import { fonts } from '../theme/typography';
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
  const colors = useTheme();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const bgColor =
    variant === 'primary' ? colors.ink :
    variant === 'ghost'   ? colors.surface2 :
    'transparent';

  const textColor =
    variant === 'primary'   ? colors.bg :
    variant === 'secondary' ? colors.ink :
    colors.inkSoft;

  const borderColor = variant === 'secondary' ? colors.rule : 'transparent';

  return (
    <Animated.View style={animStyle}>
      <TouchableOpacity
        style={[
          styles.button,
          { backgroundColor: bgColor, borderColor, borderWidth: variant === 'secondary' ? 1.5 : 0 },
          disabled && styles.disabled,
        ]}
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
          <ActivityIndicator color={textColor} />
        ) : (
          <Text style={[styles.label, { color: textColor }]}>{label}</Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 52,
    paddingHorizontal: 28,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.45,
  },
  label: {
    fontSize: 15,
    fontFamily: fonts.bold,
    letterSpacing: 0.1,
  },
});
