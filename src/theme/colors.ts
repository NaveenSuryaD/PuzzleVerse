export const light = {
  bg:       '#FBF6EE',
  surface:  '#FFFFFF',
  ink:      '#1E1A14',
  inkSoft:  '#5A5247',
  inkMuted: '#9A9183',
  divider:  '#EDE5D6',
  rule:     '#F3ECDD',
  cellHi:   '#FCF7E4',
  surface2: '#F3ECDD',
  word:    { bg: '#FFE0CC', ink: '#7A3A12', soft: '#FFD2B5', accent: '#FFE0CC' },
  number:  { bg: '#D8ECD4', ink: '#27502F', soft: '#C3E0BD', accent: '#D8ECD4' },
  logic:   { bg: '#FFEDB8', ink: '#6B4B08', soft: '#FFE49C', accent: '#FFEDB8' },
  visual:  { bg: '#E3D8FF', ink: '#382673', soft: '#D2C2FF', accent: '#E3D8FF' },
  classic: { bg: '#CFE3F5', ink: '#1F4263', soft: '#B9D5EF', accent: '#CFE3F5' },
  success: '#3A8A4A',
  danger:  '#C0432F',
};

export const dark = {
  bg:       '#16110A',
  surface:  '#221C13',
  ink:      '#FBF6EE',
  inkSoft:  '#CFC6B3',
  inkMuted: '#857B6C',
  divider:  '#2D2619',
  rule:     '#2A2418',
  cellHi:   '#2E2718',
  surface2: '#1D170F',
  word:    { bg: '#3E2417', ink: '#FFD2B5', soft: '#52301E', accent: '#FFD2B5' },
  number:  { bg: '#1F3927', ink: '#C3E0BD', soft: '#2A4A33', accent: '#C3E0BD' },
  logic:   { bg: '#3A2E0E', ink: '#FFE49C', soft: '#4D3D14', accent: '#FFE49C' },
  visual:  { bg: '#251E48', ink: '#D2C2FF', soft: '#332961', accent: '#D2C2FF' },
  classic: { bg: '#142E48', ink: '#B9D5EF', soft: '#1D3F60', accent: '#B9D5EF' },
  success: '#6FB47F',
  danger:  '#E37863',
};

export type ColorScheme = typeof dark;
