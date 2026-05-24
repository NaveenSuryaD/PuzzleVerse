export interface CryptogramPuzzle {
  quote: string;
  author: string;
  cipher: Record<string, string>; // encoded letter -> decoded letter
}

function makeCipher(quote: string): Record<string, string> {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const shuffled = [...letters].sort(() => Math.random() - 0.5);
  const map: Record<string, string> = {};
  letters.forEach((l, i) => { map[l] = shuffled[i]; });
  return map;
}

// Pre-built ciphers for determinism
export const CRYPTOGRAM_PUZZLES: CryptogramPuzzle[] = [
  {
    quote: 'BE THE CHANGE YOU WISH TO SEE',
    author: 'Gandhi',
    cipher: { B:'M', E:'Q', T:'X', H:'K', A:'V', C:'J', N:'Y', G:'Z', O:'P', U:'F', W:'S', I:'R', S:'G', M:'B', Q:'E', X:'T', K:'H', V:'A', J:'C', Z:'D', P:'L', F:'U', L:'W', R:'N' },
  },
  {
    quote: 'LIFE IS WHAT HAPPENS WHILE YOU ARE BUSY',
    author: 'John Lennon',
    cipher: { L:'W', I:'X', F:'Y', E:'Z', S:'A', W:'B', H:'C', A:'D', P:'E', N:'F', G:'H', U:'I', Y:'J', R:'K', B:'L', M:'M', T:'N', O:'O' },
  },
];

// Simple static cipher for gameplay
export const STATIC_PUZZLES: Array<{ encoded: string; decoded: string; author: string; letterMap: Record<string,string> }> = [
  {
    decoded: 'KNOWLEDGE IS POWER',
    encoded: 'NXYATMPOM QA ZYAMO',
    author: 'Francis Bacon',
    letterMap: { N:'K', X:'N', Y:'O', A:'W', T:'L', M:'E', P:'D', Q:'I', Z:'P', O:'S' },
  },
  {
    decoded: 'TIME FLIES LIKE AN ARROW',
    encoded: 'BDXJ QWBJG WBPJ LZ LHHKC',
    author: 'Groucho Marx',
    letterMap: { B:'T', D:'I', X:'M', J:'E', Q:'F', W:'L', G:'S', P:'K', L:'A', Z:'N', C:'W' },
  },
  {
    decoded: 'ALL THAT GLITTERS IS NOT GOLD',
    encoded: 'MCC XZMX YCAXXPBQ AQ FBX YBCD',
    author: 'Shakespeare',
    letterMap: { M:'A', C:'L', X:'T', Z:'H', Y:'G', P:'E', B:'R', Q:'S', F:'N', D:'D' },
  },
];
