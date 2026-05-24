import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fonts } from '../theme/typography';

interface Props {
  id: string;
  color: string;
  size?: number;
}

function GridGlyph({ color, size = 20 }: { color: string; size?: number }) {
  const dot = Math.floor((size - 4) / 3);
  return (
    <View style={{ width: size, height: size, flexDirection: 'row', flexWrap: 'wrap', gap: 2 }}>
      {Array.from({ length: 9 }).map((_, i) => (
        <View key={i} style={{
          width: dot, height: dot, borderRadius: 1,
          backgroundColor: color, opacity: i % 2 === 0 ? 1 : 0.55,
        }} />
      ))}
    </View>
  );
}

export function GameGlyph({ id, color, size = 22 }: Props) {
  const t = (txt: string, sz?: number) => (
    <Text style={{ fontFamily: fonts.black, fontSize: sz ?? size, color, lineHeight: (sz ?? size) + 4 }}>{txt}</Text>
  );
  const ico = (name: React.ComponentProps<typeof Ionicons>['name'], sz?: number) => (
    <Ionicons name={name} size={sz ?? size} color={color} />
  );

  switch (id) {
    case 'sudoku':          return <GridGlyph color={color} size={size} />;
    case 'word-guess':      return t('Aa');
    case 'word-search':     return ico('search');
    case 'group-it':        return ico('grid');
    case 'hangman':         return t('_');
    case 'number-bonds':    return t('+');
    case 'crossword-mini':  return ico('pencil');
    case 'pattern-recog':   return ico('eye-outline');
    case 'sequence-fill':   return t('…');
    case 'math-sprint':     return ico('flash');
    case 'anagram':         return t('ABC', Math.round(size * 0.72));
    case 'compound-words':  return t('+');
    case 'game-2048':       return t('2048', Math.round(size * 0.55));
    case 'kakuro':          return t('∑');
    case 'color-sort':      return ico('color-palette-outline');
    case 'pipe-connect':    return t('⊕');
    case 'tower-of-hanoi':  return t('🗼');
    case 'sliding-puzzle':  return ico('grid-outline');
    case 'hidden-words':    return ico('search-outline');
    case 'word-chain':      return ico('link-outline');
    case 'word-ladder':     return t('↑');
    case 'minesweeper':     return t('💣');
    case 'magic-square':    return t('✨');
    case 'balance-scales':  return t('⚖️');
    case 'flood-fill':      return ico('water-outline');
    case 'maze-runner':     return ico('navigate-outline');
    case 'pixel-art':       return ico('brush-outline');
    case 'flag-quiz':       return t('🚩');
    case 'noughts-crosses': return t('✕');
    case 'boggle':          return t('BGL', Math.round(size * 0.6));
    case 'rhyme-time':      return ico('musical-notes-outline');
    case 'backwards-words': return t('↩');
    case 'cryptogram':      return ico('lock-closed-outline');
    case 'kenken':          return t('±');
    case 'math-crossword':  return ico('pencil-outline');
    case 'nonogram':        return t('▪');
    case 'hitori':          return t('⬛');
    case 'chess-puzzles':   return t('♟');
    case 'science-symbols': return t('⚗', Math.round(size * 0.85));
    case 'word-hive':       return t('⬡');
    case 'missing-vowels':  return t('_');
    case 'quote-guess':     return ico('chatbubble-outline');
    case 'letter-soup':     return t('🍲');
    case 'memory-match':    return ico('albums-outline');
    case 'symbol-sequence': return ico('pulse-outline');
    case 'peg-solitaire':   return t('●');
    case 'skyscrapers':     return t('🏙');
    case 'takuzu':          return t('01', Math.round(size * 0.65));
    case 'dots-boxes':      return t('□');
    case 'logic-grid':      return ico('grid-outline');
    case 'word-bingo':      return t('BINGO', Math.round(size * 0.48));
    case 'vocab-builder':   return ico('book-outline');
    case 'abbreviations':   return t('ABC', Math.round(size * 0.65));
    case 'dominoes':        return t('▮');
    case 'shikaku':         return t('▦');
    case 'typeshift':       return t('↕');
    case 'word-morph':      return t('↔');
    case 'emoji-story':     return t('🎬');
    case 'reversi':         return t('◑');
    case 'last-letter':     return ico('link-outline');
    case 'speed-tap':       return ico('flash-outline');
    case 'number-maze':     return t('#');
    case 'mirror-puzzle':   return t('⟺', Math.round(size * 0.85));
    case 'mahjong':         return t('🀄');
    case 'checkers':        return t('⬤');
    case 'masyu':           return t('○');
    case 'tapa':            return t('■');
    case 'fillomino':       return t('N');
    case 'acrostic':        return ico('document-text-outline');
    case 'syllable-split':  return t('·');
    case 'word-parts':      return ico('pulse-outline');
    case 'phonetic-spelling': return ico('radio-outline');
    case 'emoji-sudoku':    return t('🐶');
    case 'letter-drop':     return t('⬇');
    case 'word-maze':       return ico('map-outline');
    case 'wordsmiths-duel': return ico('trophy-outline');
    case 'gravity-blocks':  return t('⬤');
    case 'daily-challenge': return ico('star-outline');
    default: {
      const fallbacks: Record<string, string> = { word: 'Aa', number: '7', logic: '≡', visual: '◆', classic: '♟' };
      return t(fallbacks[id] ?? '?');
    }
  }
}
