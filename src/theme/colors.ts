export const dark = {
  bg: {
    primary:   '#0D0D1A',
    secondary: '#16162A',
    tertiary:  '#1E1E35',
    elevated:  '#252540',
  },
  brand: {
    primary:   '#6C63FF',
    secondary: '#FF6584',
    tertiary:  '#43E6FC',
    gold:      '#FFD166',
  },
  text: {
    primary:   '#F0F0FF',
    secondary: '#9898B8',
    tertiary:  '#5C5C80',
    inverse:   '#0D0D1A',
  },
  success:   '#43E6A0',
  warning:   '#FFD166',
  error:     '#FF5C8A',
  info:      '#43C6FC',
  categories: {
    word:    '#A78BFA',
    number:  '#34D399',
    logic:   '#60A5FA',
    visual:  '#F472B6',
    classic: '#FBBF24',
    trivia:  '#FB923C',
  },
  border: {
    subtle: 'rgba(255,255,255,0.06)',
    normal: 'rgba(255,255,255,0.12)',
    strong: 'rgba(255,255,255,0.24)',
  },
  overlay: {
    light: 'rgba(0,0,0,0.3)',
    medium: 'rgba(0,0,0,0.6)',
    heavy: 'rgba(0,0,0,0.85)',
  },
};

export const light = {
  bg: {
    primary:   '#F5F5FF',
    secondary: '#FFFFFF',
    tertiary:  '#EEEEFF',
    elevated:  '#FFFFFF',
  },
  brand: {
    primary:   '#5B54E8',
    secondary: '#E8506A',
    tertiary:  '#0BBDD4',
    gold:      '#F0B429',
  },
  text: {
    primary:   '#12122A',
    secondary: '#4A4A72',
    tertiary:  '#9898B8',
    inverse:   '#F0F0FF',
  },
  success:   '#16A34A',
  warning:   '#D97706',
  error:     '#DC2626',
  info:      '#0284C7',
  categories: {
    word:    '#7C3AED',
    number:  '#059669',
    logic:   '#2563EB',
    visual:  '#DB2777',
    classic: '#D97706',
    trivia:  '#EA580C',
  },
  border: {
    subtle: 'rgba(0,0,0,0.04)',
    normal: 'rgba(0,0,0,0.10)',
    strong: 'rgba(0,0,0,0.20)',
  },
  overlay: {
    light: 'rgba(0,0,0,0.1)',
    medium: 'rgba(0,0,0,0.4)',
    heavy: 'rgba(0,0,0,0.75)',
  },
};

export type ColorScheme = typeof dark;
