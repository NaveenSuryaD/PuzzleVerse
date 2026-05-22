export const fonts = {
  regular:   'Nunito_400Regular',
  semiBold:  'Nunito_600SemiBold',
  bold:      'Nunito_700Bold',
  extraBold: 'Nunito_800ExtraBold',
  black:     'Nunito_900Black',
};

export const text = {
  display: { fontSize: 48, fontFamily: fonts.black, letterSpacing: -1, lineHeight: 56 },
  hero:    { fontSize: 32, fontFamily: fonts.extraBold, letterSpacing: -0.5, lineHeight: 40 },
  h1:      { fontSize: 24, fontFamily: fonts.bold, letterSpacing: -0.3, lineHeight: 32 },
  h2:      { fontSize: 18, fontFamily: fonts.bold, letterSpacing: 0, lineHeight: 26 },
  h3:      { fontSize: 15, fontFamily: fonts.semiBold, letterSpacing: 0.1, lineHeight: 22 },
  body:    { fontSize: 15, fontFamily: fonts.regular, letterSpacing: 0, lineHeight: 24 },
  small:   { fontSize: 12, fontFamily: fonts.regular, letterSpacing: 0.2, lineHeight: 18 },
  label:   { fontSize: 11, fontFamily: fonts.bold, letterSpacing: 1.2, textTransform: 'uppercase' as const, lineHeight: 16 },
  mono:    { fontSize: 20, fontFamily: fonts.extraBold, letterSpacing: 2, lineHeight: 28 },
};
