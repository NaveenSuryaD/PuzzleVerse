import { Easing } from 'react-native-reanimated';

export const easings = {
  spring:       { damping: 15, stiffness: 300, mass: 0.8 },
  bouncySpring: { damping: 8, stiffness: 400, mass: 0.6 },
  stiffSpring:  { damping: 20, stiffness: 500 },
  easeOut:      Easing.bezier(0.16, 1, 0.3, 1),
  easeInOut:    Easing.bezier(0.4, 0, 0.2, 1),
};

export const durations = {
  instant:  80,
  fast:     150,
  normal:   250,
  slow:     400,
  verySlow: 600,
};
