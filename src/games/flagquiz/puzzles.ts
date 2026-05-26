export interface FlagDesign {
  country: string;
  stripes: { color: string; flex: number }[];
  direction: 'horizontal' | 'vertical';
  emblem?: string;
}

// Simplified flag designs using colored stripes
export const FLAGS: FlagDesign[] = [
  { country: 'France', stripes: [{ color: '#002395', flex: 1 }, { color: '#FFFFFF', flex: 1 }, { color: '#ED2939', flex: 1 }], direction: 'vertical' },
  { country: 'Germany', stripes: [{ color: '#000000', flex: 1 }, { color: '#DD0000', flex: 1 }, { color: '#FFCE00', flex: 1 }], direction: 'horizontal' },
  { country: 'Italy', stripes: [{ color: '#009246', flex: 1 }, { color: '#FFFFFF', flex: 1 }, { color: '#CE2B37', flex: 1 }], direction: 'vertical' },
  { country: 'Russia', stripes: [{ color: '#FFFFFF', flex: 1 }, { color: '#0039A6', flex: 1 }, { color: '#D52B1E', flex: 1 }], direction: 'horizontal' },
  { country: 'Netherlands', stripes: [{ color: '#AE1C28', flex: 1 }, { color: '#FFFFFF', flex: 1 }, { color: '#21468B', flex: 1 }], direction: 'horizontal' },
  { country: 'Belgium', stripes: [{ color: '#000000', flex: 1 }, { color: '#FAE042', flex: 1 }, { color: '#EF3340', flex: 1 }], direction: 'vertical' },
  { country: 'Ireland', stripes: [{ color: '#169B62', flex: 1 }, { color: '#FFFFFF', flex: 1 }, { color: '#FF883E', flex: 1 }], direction: 'vertical' },
  { country: 'Romania', stripes: [{ color: '#002B7F', flex: 1 }, { color: '#FCD116', flex: 1 }, { color: '#CE1126', flex: 1 }], direction: 'vertical' },
  { country: 'Hungary', stripes: [{ color: '#CE2939', flex: 1 }, { color: '#FFFFFF', flex: 1 }, { color: '#477050', flex: 1 }], direction: 'horizontal' },
  { country: 'Austria', stripes: [{ color: '#ED2939', flex: 1 }, { color: '#FFFFFF', flex: 1 }, { color: '#ED2939', flex: 1 }], direction: 'horizontal' },
  { country: 'Sweden', stripes: [{ color: '#006AA7', flex: 3 }, { color: '#FECC02', flex: 1 }, { color: '#006AA7', flex: 5 }], direction: 'horizontal' },
  { country: 'Norway', stripes: [{ color: '#EF2B2D', flex: 1 }, { color: '#FFFFFF', flex: 1 }, { color: '#002868', flex: 1 }], direction: 'vertical' },
  { country: 'Poland', stripes: [{ color: '#FFFFFF', flex: 1 }, { color: '#DC143C', flex: 1 }], direction: 'horizontal' },
  { country: 'Ukraine', stripes: [{ color: '#005BBB', flex: 1 }, { color: '#FFD500', flex: 1 }], direction: 'horizontal' },
  { country: 'Mexico', stripes: [{ color: '#006847', flex: 1 }, { color: '#FFFFFF', flex: 1 }, { color: '#CE1126', flex: 1 }], direction: 'vertical' },
  { country: 'India', stripes: [{ color: '#FF9933', flex: 1 }, { color: '#FFFFFF', flex: 1 }, { color: '#138808', flex: 1 }], direction: 'horizontal' },
  { country: 'Japan', stripes: [{ color: '#FFFFFF', flex: 1 }], direction: 'horizontal', emblem: '🔴' },
  { country: 'China', stripes: [{ color: '#DE2910', flex: 1 }], direction: 'horizontal', emblem: '★' },
  { country: 'Brazil', stripes: [{ color: '#009C3B', flex: 1 }], direction: 'horizontal', emblem: '◆' },
  { country: 'Australia', stripes: [{ color: '#00008B', flex: 1 }], direction: 'horizontal', emblem: '☆' },
];
