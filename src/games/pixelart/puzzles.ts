// 8x8 pixel art patterns
// Numbers 1-5 correspond to colors
export interface PixelArtDesign {
  name: string;
  grid: number[][];
  colors: string[]; // index 0 = background, 1-5 = colors
}

export const PIXEL_ART_DESIGNS: PixelArtDesign[] = [
  {
    name: 'Heart',
    colors: ['#FFF', '#E74C3C', '#FF8C9A', '#C0392B', '#FFB3C1', '#FFECEE'],
    grid: [
      [0, 1, 1, 0, 0, 1, 1, 0],
      [1, 2, 2, 1, 1, 2, 2, 1],
      [1, 2, 2, 2, 2, 2, 2, 1],
      [1, 2, 2, 2, 2, 2, 2, 1],
      [0, 1, 2, 2, 2, 2, 1, 0],
      [0, 0, 1, 2, 2, 1, 0, 0],
      [0, 0, 0, 1, 1, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
    ],
  },
  {
    name: 'Star',
    colors: ['#FFF', '#F1C40F', '#F39C12', '#E67E22', '#FDEBD0', '#FDFEFE'],
    grid: [
      [0, 0, 0, 1, 1, 0, 0, 0],
      [0, 0, 0, 2, 2, 0, 0, 0],
      [1, 1, 1, 2, 2, 1, 1, 1],
      [0, 2, 2, 2, 2, 2, 2, 0],
      [0, 0, 2, 2, 2, 2, 0, 0],
      [0, 1, 2, 1, 1, 2, 1, 0],
      [0, 2, 0, 0, 0, 0, 2, 0],
      [0, 1, 0, 0, 0, 0, 1, 0],
    ],
  },
  {
    name: 'Smiley',
    colors: ['#FFF', '#F1C40F', '#F39C12', '#2C3E50', '#E74C3C', '#FDFEFE'],
    grid: [
      [0, 0, 1, 1, 1, 1, 0, 0],
      [0, 1, 2, 2, 2, 2, 1, 0],
      [1, 2, 3, 2, 2, 3, 2, 1],
      [1, 2, 3, 2, 2, 3, 2, 1],
      [1, 2, 2, 2, 2, 2, 2, 1],
      [1, 2, 4, 2, 2, 4, 2, 1],
      [0, 1, 2, 4, 4, 2, 1, 0],
      [0, 0, 1, 1, 1, 1, 0, 0],
    ],
  },
];
