import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import type { PatternItem as PatternItemType } from './types';

const SIZE_PX = [24, 34, 46];

interface Props {
  item: PatternItemType;
  containerSize?: number;
}

export function PatternItemView({ item, containerSize = 56 }: Props) {
  const colors = useTheme();
  const tone = colors[item.color];
  const px = SIZE_PX[item.size - 1];
  const bg = tone.bg;
  const ink = tone.ink;

  const shapes = Array.from({ length: item.count }, (_, i) => {
    if (item.shape === 'circle') {
      return (
        <View key={i} style={[
          s.shape,
          { width: px / item.count, height: px / item.count, borderRadius: 999, backgroundColor: ink },
        ]} />
      );
    }
    if (item.shape === 'square') {
      return <View key={i} style={[s.shape, { width: px / item.count, height: px / item.count, borderRadius: 4, backgroundColor: ink }]} />;
    }
    if (item.shape === 'diamond') {
      const d = px / item.count;
      return (
        <View key={i} style={[s.shape, {
          width: d, height: d, backgroundColor: ink,
          transform: [{ rotate: '45deg' }],
        }]} />
      );
    }
    // triangle — use a border trick
    const d = px / item.count;
    return (
      <View key={i} style={[s.shape, {
        width: 0, height: 0,
        borderLeftWidth: d / 2, borderRightWidth: d / 2, borderBottomWidth: d,
        borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: ink,
        backgroundColor: 'transparent',
      }]} />
    );
  });

  return (
    <View style={[s.container, {
      width: containerSize, height: containerSize, borderRadius: 14, backgroundColor: bg,
    }]}>
      <View style={s.shapeRow}>{shapes}</View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  shapeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  shape: {},
});
