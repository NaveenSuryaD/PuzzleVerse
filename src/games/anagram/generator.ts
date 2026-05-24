import type { AnagramPuzzle } from './types';

const WORD_BANK = [
  'PLANET', 'CASTLE', 'BRIDGE', 'FLOWER', 'GARDEN', 'ISLAND', 'JUNGLE',
  'MARKET', 'MUSEUM', 'ORANGE', 'PUZZLE', 'RABBIT', 'SILVER', 'TEMPLE',
  'VIOLET', 'WALNUT', 'YELLOW', 'ZIPPER', 'CANDLE', 'BOTTLE',
  'DRAGON', 'PILLOW', 'FINGER', 'GLOBAL', 'HUMBLE', 'IMPACT', 'JACKET',
  'KITTEN', 'LEMON', 'MIRROR', 'NEEDLE', 'OYSTER', 'PARROT', 'QUARTZ',
  'ROCKET', 'SUNSET', 'TRIPLE', 'UNICORN', 'VELVET', 'WINTER', 'YELLOW',
  'ANCHOR', 'BALLET', 'CAMERA', 'DANCER', 'ENGINE', 'FABRIC', 'GOBLIN',
  'HUNTER', 'INSECT', 'JIGSAW', 'KERNEL', 'LAPTOP', 'MUFFIN', 'NOODLE',
  'PEPPER', 'RIBBON', 'SADDLE', 'TURTLE', 'UMBRELLA', 'WAFFLE',
];

function scramble(word: string): string[] {
  const letters = word.split('');
  for (let i = letters.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [letters[i], letters[j]] = [letters[j], letters[i]];
  }
  // Ensure scrambled !== original
  if (letters.join('') === word && word.length > 1) {
    const tmp = letters[0];
    letters[0] = letters[1];
    letters[1] = tmp;
  }
  return letters;
}

export function generateAnagram(): AnagramPuzzle {
  const word = WORD_BANK[Math.floor(Math.random() * WORD_BANK.length)];
  return { word, scrambled: scramble(word) };
}
