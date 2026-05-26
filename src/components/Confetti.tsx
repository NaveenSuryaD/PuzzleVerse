import React, { useEffect } from 'react';
import { StyleSheet, Dimensions, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';

const { width: W, height: H } = Dimensions.get('window');

const COLORS = ['#FFD166', '#06D6A0', '#118AB2', '#EF476F', '#FFB347', '#A8DADC', '#E26A2C', '#6FB47F'];

interface Particle {
  x: number;
  y: number;
  dx: number;
  dy: number;
  rot: number;
  drot: number;
  color: string;
  size: number;
  shape: 'rect' | 'circle';
}

function generateParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.8;
    const speed = 180 + Math.random() * 220;
    return {
      x: W * 0.5,
      y: H * 0.35,
      dx: Math.cos(angle) * speed,
      dy: Math.sin(angle) * speed - 80,
      rot: Math.random() * 360,
      drot: (Math.random() - 0.5) * 720,
      color: COLORS[i % COLORS.length],
      size: 6 + Math.random() * 6,
      shape: Math.random() > 0.5 ? 'rect' : 'circle',
    };
  });
}

interface ParticleViewProps {
  p: Particle;
  index: number;
  duration: number;
}

function ParticleView({ p, index, duration }: ParticleViewProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      index * 12,
      withTiming(1, { duration, easing: Easing.out(Easing.cubic) })
    );
  }, []);

  const style = useAnimatedStyle(() => {
    const t = progress.value;
    const gravity = 320 * t * t;
    return {
      position: 'absolute',
      left: p.x + p.dx * t - p.size / 2,
      top: p.y + p.dy * t + gravity - p.size / 2,
      width: p.shape === 'rect' ? p.size * 1.6 : p.size,
      height: p.size,
      borderRadius: p.shape === 'circle' ? p.size / 2 : 2,
      backgroundColor: p.color,
      opacity: t < 0.7 ? 1 : (1 - t) / 0.3,
      transform: [{ rotate: `${p.rot + p.drot * t}deg` }],
    };
  });

  return <Animated.View style={style} />;
}

interface ConfettiProps {
  active: boolean;
  count?: number;
  duration?: number;
}

export function Confetti({ active, count = 40, duration = 1400 }: ConfettiProps) {
  const particles = React.useMemo(() => generateParticles(count), [count]);

  if (!active) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map((p, i) => (
        <ParticleView key={i} p={p} index={i} duration={duration} />
      ))}
    </View>
  );
}
