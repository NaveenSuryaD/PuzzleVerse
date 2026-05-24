import React, { useEffect, useCallback, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { playSound } from '../../src/audio/sounds';
import { useTheme } from '../../src/theme/useTheme';
import { useSettingsStore } from '../../src/store/useSettingsStore';
import { fonts } from '../../src/theme/typography';
import { GAMES } from '../../src/constants/games';
import { getHints } from '../../src/constants/gameHints';
import { Confetti } from '../../src/components/Confetti';
import { SudokuGame } from '../../src/games/sudoku/SudokuGame';
import { WordGuessGame } from '../../src/games/wordguess/WordGuessGame';
import { WordSearchGame } from '../../src/games/wordsearch/WordSearchGame';
import { GroupItGame } from '../../src/games/groupit/GroupItGame';
import { HangmanGame } from '../../src/games/hangman/HangmanGame';
import { NumberBondsGame } from '../../src/games/numberbonds/NumberBondsGame';
import { CrosswordGame } from '../../src/games/crossword/CrosswordGame';
import { PatternRecogGame } from '../../src/games/patternrecog/PatternRecogGame';
import { SequenceFillGame } from '../../src/games/sequencefill/SequenceFillGame';
import { MathSprintGame } from '../../src/games/mathsprint/MathSprintGame';
// MVP 8
import { AnagramGame } from '../../src/games/anagram/AnagramGame';
import { CompoundWordsGame } from '../../src/games/compoundwords/CompoundWordsGame';
import { Game2048Game } from '../../src/games/game2048/Game2048Game';
import { KakuroGame } from '../../src/games/kakuro/KakuroGame';
import { ColorSortGame } from '../../src/games/colorsort/ColorSortGame';
import { PipeConnectGame } from '../../src/games/pipeconnect/PipeConnectGame';
import { TowerOfHanoiGame } from '../../src/games/towerofhanoi/TowerOfHanoiGame';
import { SlidingPuzzleGame } from '../../src/games/slidingpuzzle/SlidingPuzzleGame';
// MVP 9
import { HiddenWordsGame } from '../../src/games/hiddenwords/HiddenWordsGame';
import { WordChainGame } from '../../src/games/wordchain/WordChainGame';
import { WordLadderGame } from '../../src/games/wordladder/WordLadderGame';
import { MinesweeperGame } from '../../src/games/minesweeper/MinesweeperGame';
import { MagicSquareGame } from '../../src/games/magicsquare/MagicSquareGame';
import { BalanceScalesGame } from '../../src/games/balancescales/BalanceScalesGame';
import { FloodFillGame } from '../../src/games/floodfill/FloodFillGame';
import { MazeRunnerGame } from '../../src/games/mazerunner/MazeRunnerGame';
import { PixelArtGame } from '../../src/games/pixelart/PixelArtGame';
import { FlagQuizGame } from '../../src/games/flagquiz/FlagQuizGame';
import { NoughtsCrossesGame } from '../../src/games/noughtscrosses/NoughtsCrossesGame';
// MVP 10
import { BoggleGame } from '../../src/games/boggle/BoggleGame';
import { RhymeTimeGame } from '../../src/games/rhymetime/RhymeTimeGame';
import { BackwardsWordsGame } from '../../src/games/backwardswords/BackwardsWordsGame';
import { CryptogramGame } from '../../src/games/cryptogram/CryptogramGame';
import { KenKenGame } from '../../src/games/kenken/KenKenGame';
import { MathCrosswordGame } from '../../src/games/mathcrossword/MathCrosswordGame';
import { NonogramGame } from '../../src/games/nonogram/NonogramGame';
import { HitoriGame } from '../../src/games/hitori/HitoriGame';
import { ChessPuzzlesGame } from '../../src/games/chesspuzzles/ChessPuzzlesGame';
import { ScienceSymbolsGame } from '../../src/games/sciencesymbols/ScienceSymbolsGame';
// MVP 11
import { WordHiveGame } from '../../src/games/wordhive/WordHiveGame';
import { MissingVowelsGame } from '../../src/games/missingvowels/MissingVowelsGame';
import { QuoteGuessGame } from '../../src/games/quoteguess/QuoteGuessGame';
import { LetterSoupGame } from '../../src/games/lettersoup/LetterSoupGame';
import { MemoryMatchGame } from '../../src/games/memorymatch/MemoryMatchGame';
import { SymbolSequenceGame } from '../../src/games/symbolsequence/SymbolSequenceGame';
import { PegSolitaireGame } from '../../src/games/pegsolitaire/PegSolitaireGame';
import { SkyscrapersGame } from '../../src/games/skyscrapers/SkyscrapersGame';
import { TakuzuGame } from '../../src/games/takuzu/TakuzuGame';
import { DotsBoxesGame } from '../../src/games/dotsboxes/DotsBoxesGame';
import { LogicGridGame } from '../../src/games/logicgrid/LogicGridGame';
// MVP 12
import { WordBingoGame } from '../../src/games/wordbingo/WordBingoGame';
import { VocabBuilderGame } from '../../src/games/vocabbuilder/VocabBuilderGame';
import { AbbreviationsGame } from '../../src/games/abbreviations/AbbreviationsGame';
import { DominoesGame } from '../../src/games/dominoes/DominoesGame';
import { ShikakuGame } from '../../src/games/shikaku/ShikakuGame';
import { TypeshiftGame } from '../../src/games/typeshift/TypeshiftGame';
// MVP 13
import { WordMorphGame } from '../../src/games/wordmorph/WordMorphGame';
import { EmojiStoryGame } from '../../src/games/emojistory/EmojiStoryGame';
import { ReversiGame } from '../../src/games/reversi/ReversiGame';
import { LastLetterGame } from '../../src/games/lastletter/LastLetterGame';
import { SpeedTapGame } from '../../src/games/speedtap/SpeedTapGame';
import { NumberMazeGame } from '../../src/games/numbermaze/NumberMazeGame';
import { MirrorPuzzleGame } from '../../src/games/mirrorpuzzle/MirrorPuzzleGame';
// MVP 14
import { MahjongGame } from '../../src/games/mahjong/MahjongGame';
import { CheckersGame } from '../../src/games/checkers/CheckersGame';
import { MasyuGame } from '../../src/games/masyu/MasyuGame';
import { TapaGame } from '../../src/games/tapa/TapaGame';
import { FillominoGame } from '../../src/games/fillomino/FillominoGame';
import { AcrosticGame } from '../../src/games/acrostic/AcrosticGame';
import { SyllableSplitGame } from '../../src/games/syllablesplit/SyllableSplitGame';
import { WordPartsGame } from '../../src/games/wordparts/WordPartsGame';
import { PhoneticSpellingGame } from '../../src/games/phoneticspelling/PhoneticSpellingGame';
import { EmojiSudokuGame } from '../../src/games/emojisudoku/EmojiSudokuGame';
// MVP 15
import { LetterDropGame } from '../../src/games/letterdrop/LetterDropGame';
import { WordMazeGame } from '../../src/games/wordmaze/WordMazeGame';
import { WordsmithsDuelGame } from '../../src/games/wordsmithsduel/WordsmithsDuelGame';
import { GravityBlocksGame } from '../../src/games/gravityblocks/GravityBlocksGame';
import { DailyChallengeGame } from '../../src/games/dailychallenge/DailyChallengeGame';
import { useProgressStore } from '../../src/store/useProgressStore';
import { useGameStore } from '../../src/store/useGameStore';
import type { GameMode } from '../../src/games/wordguess/types';

const todayStr = () => new Date().toISOString().slice(0, 10);

const EPOCH = new Date('2026-01-01T00:00:00Z');
function getDailyPuzzleNumber(): number {
  const now = new Date();
  return Math.floor((now.getTime() - EPOCH.getTime()) / 86400000) + 1;
}

const formatTime = (secs: number): string => {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

export default function GameScreen() {
  const { gameId, mode, date, difficulty, daily: dailyParam } = useLocalSearchParams<{ gameId: string; mode?: string; date?: string; difficulty?: string; daily?: string }>();
  const router = useRouter();
  const colors = useTheme();
  const { recordGame, recordDailyComplete, games: progressGames } = useProgressStore();
  const { startGame, endGame } = useGameStore();

  const showTimer = useSettingsStore(s => s.showTimer);
  const hapticsEnabled = useSettingsStore(s => s.hapticsEnabled);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(true);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showHintModal, setShowHintModal] = useState(false);
  const [hintsRemaining, setHintsRemaining] = useState(3);
  const [hintIndex, setHintIndex] = useState(0);
  const [sessionHintsUsed, setSessionHintsUsed] = useState(0);
  const [sudokuDone, setSudokuDone] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [streakMsg, setStreakMsg] = useState('');
  const [starCount, setStarCount] = useState(0);
  const [showStars, setShowStars] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const game = GAMES.find(g => g.id === gameId);

  useEffect(() => {
    if (gameId) startGame(gameId);
    // Show tutorial on first play
    if (gameId && (progressGames[gameId]?.gamesPlayed ?? 0) === 0) {
      setShowTutorial(true);
    }
  }, [gameId]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  const handleComplete = useCallback((won: boolean, timeSeconds: number, guessCount?: number) => {
    if (!gameId) return;
    setRunning(false);
    recordGame(gameId, won, timeSeconds, sessionHintsUsed, guessCount);
    endGame(won);
    if (gameId === 'sudoku') setSudokuDone(true);
    if (hapticsEnabled) {
      if (won) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      else Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
    // GroupIt and Hangman manage their own sounds; skip double-play
    if (gameId !== 'group-it' && gameId !== 'hangman') {
      playSound(won ? 'win' : 'lose');
    }
    if (won) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2000);
      // Star rating: compare time vs estimated
      const estimatedSecs = (game?.estimatedMinutes ?? 3) * 60;
      const ratio = timeSeconds / estimatedSecs;
      const stars = ratio < 0.5 ? 3 : ratio < 1.0 ? 2 : 1;
      setStarCount(stars);
      setShowStars(true);
      setTimeout(() => setShowStars(false), 2200);
      // Streak milestone messaging
      const newStreak = (progressGames[gameId]?.currentStreak ?? 0) + 1;
      if (newStreak === 3) setStreakMsg("3 days in a row! You're building a habit 🔥");
      else if (newStreak === 7) setStreakMsg('7-day streak! Word Wizard unlocked 🏆');
      else if (newStreak === 14) setStreakMsg('14 days strong! Unstoppable 💪');
      else if (newStreak === 30) setStreakMsg('30-day streak! Legendary 🌟');
      if (newStreak === 3 || newStreak === 7 || newStreak === 14 || newStreak === 30) {
        setTimeout(() => setStreakMsg(''), 3500);
      }
    }
  }, [gameId, recordGame, endGame, hapticsEnabled, progressGames, sessionHintsUsed]);

  const handleDailyComplete = useCallback((won: boolean, timeSeconds: number, dailyDate: string) => {
    if (!gameId) return;
    setRunning(false);
    recordGame(gameId, won, timeSeconds);
    endGame(won);
    recordDailyComplete(gameId, dailyDate, won);
    if (hapticsEnabled) {
      if (won) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      else Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
    playSound(won ? 'win' : 'lose');
    if (won) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2000);
    }
  }, [gameId, recordGame, endGame, recordDailyComplete, hapticsEnabled]);

  const s = makeStyles(colors);

  if (!game) {
    return (
      <SafeAreaView style={s.container}>
        <Text style={s.error}>Game not found: {gameId}</Text>
      </SafeAreaView>
    );
  }

  const gameMode: GameMode = (mode === 'daily' || mode === 'unlimited') ? mode : 'unlimited';
  const dailyDate = date ?? todayStr();
  const isDailyGame = dailyParam === 'true' || gameMode === 'daily';
  const sudokuDifficulty = (difficulty === 'easy' || difficulty === 'medium' || difficulty === 'hard') ? difficulty : undefined;

  const SUBTITLES: Record<string, string> = {
    'word-guess':         isDailyGame ? `Daily #${getDailyPuzzleNumber()}` : 'Unlimited',
    'word-search':        'Find the hidden words',
    'group-it':           'Find four groups of four',
    'hangman':            'Guess the hidden word',
    'number-bonds':       'Clear the board',
    'crossword-mini':     isDailyGame ? `Daily Crossword #${getDailyPuzzleNumber()}` : 'Mini Crossword',
    'pattern-recog':      'What comes next?',
    'sequence-fill':      'Complete the sequence',
    'math-sprint':        '20 questions · timed',
    'sudoku':             isDailyGame ? `Daily Sudoku #${getDailyPuzzleNumber()}` : (sudokuDifficulty ? sudokuDifficulty.charAt(0).toUpperCase() + sudokuDifficulty.slice(1) : 'Medium'),
    'anagram':            'Unscramble the word',
    'compound-words':     'Build compound words',
    'game-2048':          'Reach 2048!',
    'kakuro':             'Number crossword',
    'color-sort':         'Sort the colors',
    'pipe-connect':       'Connect all pipes',
    'tower-of-hanoi':     'Move the discs',
    'sliding-puzzle':     '15-tile puzzle',
    'hidden-words':       'Find the words',
    'word-chain':         'Chain the words',
    'word-ladder':        'Change one letter',
    'minesweeper':        'Clear the minefield',
    'magic-square':       'Make rows sum equal',
    'balance-scales':     'Balance the weights',
    'flood-fill':         'Paint the grid',
    'maze-runner':        'Find the exit',
    'pixel-art':          'Color by numbers',
    'flag-quiz':          'Name the country',
    'noughts-crosses':    'Tic-tac-toe',
    'boggle':             'Find words in grid',
    'rhyme-time':         'Find the rhyming word',
    'backwards-words':    'Read it backwards',
    'cryptogram':         'Decode the message',
    'kenken':             'Math constraint grid',
    'math-crossword':     'Fill with numbers',
    'nonogram':           'Color the grid',
    'hitori':             'Circle and blacken',
    'chess-puzzles':      'Find the best move',
    'science-symbols':    'Name the symbol',
    'word-hive':          'Find words in hive',
    'missing-vowels':     'Fill in the blanks',
    'quote-guess':        'Complete the quote',
    'letter-soup':        'Find hidden words',
    'memory-match':       'Match the pairs',
    'symbol-sequence':    'What comes next?',
    'peg-solitaire':      'Remove all but one',
    'skyscrapers':        'Fill the city grid',
    'takuzu':             '0s and 1s puzzle',
    'dots-boxes':         'Claim the squares',
    'logic-grid':         'Deduce the solution',
    'word-bingo':         'Complete your card',
    'vocab-builder':      'Learn new words',
    'abbreviations':      'Expand the acronym',
    'dominoes':           'Place all tiles',
    'shikaku':            'Divide into rectangles',
    'typeshift':          'Shift the columns',
    'word-morph':         'Transform the word',
    'emoji-story':        'Tell the story',
    'reversi':            'Flip the pieces',
    'last-letter':        'Chain the letters',
    'speed-tap':          'Tap as fast as you can',
    'number-maze':        'Navigate by numbers',
    'mirror-puzzle':      'Reflect the path',
    'mahjong':            'Match the tiles',
    'checkers':           'Capture all pieces',
    'masyu':              'Draw the loop',
    'tapa':               'Shade the cells',
    'fillomino':          'Fill with polyominoes',
    'acrostic':           'Find the hidden word',
    'syllable-split':     'Split the syllables',
    'word-parts':         'Build from parts',
    'phonetic-spelling':  'Spell it phonetically',
    'emoji-sudoku':       'Emoji number grid',
    'letter-drop':        'Drop the letters',
    'word-maze':          'Navigate to the word',
    'wordsmiths-duel':    'Words from the pool',
    'gravity-blocks':     'Connect four',
    'daily-challenge':    isDailyGame ? `Challenge #${getDailyPuzzleNumber()}` : "Today's challenge",
  };
  const subtitle = SUBTITLES[game.id] ?? game.description ?? 'Play';

  const TUTORIALS: Record<string, string> = {
    'word-guess':       'Guess the 5-letter word in 6 tries.\n\nGreen tile = right letter, right spot.\nYellow tile = right letter, wrong spot.\nGray tile = letter not in word.',
    'sudoku':           'Fill every row, column, and 3×3 box with the digits 1–9.\n\nNo digit can repeat in the same row, column, or box.',
    'group-it':         'Find four groups of four words that share something in common.\n\nSelect 4 words, then tap Submit. You have 4 mistakes.',
    'crossword-mini':   'Fill the 5×5 grid using the across and down clues.\n\nTap a cell or clue to select it, then type letters.',
    'hangman':          'Guess the hidden word by selecting letters one at a time.\n\n6 wrong guesses and the game is over.',
    'math-sprint':      'Solve 20 math problems as fast as you can.\n\nEnter your answer on the number pad and tap ✓ to confirm. Wrong answers add a 10-second penalty.',
    'anagram':          'Rearrange all the letters shown to form a valid English word.',
    'number-bonds':     'Tap pairs of numbers that add up to the target number to clear the board.',
    'sequence-fill':    'Study the pattern and fill in the missing numbers or letters.',
    'pattern-recog':    'Look at the sequence and select what comes next.',
    'word-search':      'Find all the listed words hidden in the letter grid.\nWords can go in any direction.',
    'kakuro':           'Fill the grid with digits 1–9. Each run of cells must sum to the clue shown, with no digit repeated in a run.',
    'minesweeper':      'Avoid the mines! Numbers show how many mines are adjacent to that cell. Flag squares you think are mines.',
    'magic-square':     'Place the numbers so every row, column, and diagonal sums to the same target value.',
    'sliding-puzzle':   'Slide tiles into order 1–15 by moving them into the empty space.',
    'tower-of-hanoi':   'Move the entire stack to another peg, one disc at a time. A larger disc can never go on top of a smaller one.',
    'pipe-connect':     'Rotate or connect the pipe segments so every pipe forms a complete loop without dead ends.',
    'color-sort':       'Sort the colored balls into tubes so each tube holds balls of one color only.',
    'word-chain':       'Each word must start with the last letter of the previous word.',
    'word-ladder':      'Change one letter at a time to transform the starting word into the target word.',
    'speed-tap':        'Tap the button the instant it turns green. The faster you react, the better your score.',
    'memory-match':     'Flip cards two at a time to find matching pairs. Remember what you\'ve seen!',
    'game-2048':        'Swipe to slide tiles. Matching tiles merge and double. Reach 2048 to win!',
    'flood-fill':       'Pick a color to flood-fill from the top-left corner. Cover the whole board in as few moves as possible.',
    'dots-boxes':       'Draw lines to complete squares. The player who closes a box claims it. Most boxes wins.',
  };
  const tutorial = TUTORIALS[game.id] ?? game.description ?? 'Tap to start playing!';

  const renderGame = () => {
    if (game.id === 'sudoku') {
      return (
        <SudokuGame
          difficulty={sudokuDifficulty}
          daily={isDailyGame}
          onComplete={(_, t) => isDailyGame ? handleDailyComplete(true, t, dailyDate) : handleComplete(true, t)}
        />
      );
    }
    if (game.id === 'word-guess') {
      if (isDailyGame) {
        return (
          <WordGuessGame
            mode="daily"
            dateOverride={date}
            onComplete={(won, attempts) => handleDailyComplete(won, attempts * 60, dailyDate)}
            onBack={() => router.back()}
          />
        );
      }
      return (
        <WordGuessGame
          mode={gameMode}
          onComplete={(won, attempts) => handleComplete(won, attempts * 60, attempts)}
          onBack={() => router.back()}
        />
      );
    }
    if (game.id === 'word-search') {
      return (
        <WordSearchGame
          onComplete={(won, t) => handleComplete(won, t)} onBack={() => router.back()}
        />
      );
    }
    if (game.id === 'group-it') {
      return (
        <GroupItGame
          onComplete={(won, t) => handleComplete(won, t)}
          onBack={() => router.back()}
        />
      );
    }
    if (game.id === 'hangman') {
      return (
        <HangmanGame
          onComplete={(won, t) => handleComplete(won, t)}
          onBack={() => router.back()}
        />
      );
    }
    if (game.id === 'number-bonds') {
      return (
        <NumberBondsGame
          onComplete={(won, t) => handleComplete(won, t)}
          onBack={() => router.back()}
        />
      );
    }
    if (game.id === 'crossword-mini') {
      return <CrosswordGame onComplete={(won, t) => handleComplete(won, t)} onBack={() => router.back()} />;
    }
    if (game.id === 'pattern-recog') {
      return <PatternRecogGame onComplete={(won, t) => handleComplete(won, t)} onBack={() => router.back()} />;
    }
    if (game.id === 'sequence-fill') {
      return <SequenceFillGame onComplete={(won, t) => handleComplete(won, t)} onBack={() => router.back()} />;
    }
    if (game.id === 'math-sprint') {
      return <MathSprintGame onComplete={(won, t) => handleComplete(won, t)} onBack={() => router.back()} />;
    }
    // MVP 8
    if (game.id === 'anagram') return <AnagramGame onComplete={(won, t) => handleComplete(won, t)} onBack={() => router.back()} />;
    if (game.id === 'compound-words') return <CompoundWordsGame onComplete={(won, t) => handleComplete(won, t)} onBack={() => router.back()} />;
    if (game.id === 'game-2048') return <Game2048Game onComplete={(won, t) => handleComplete(won, t)} onBack={() => router.back()} />;
    if (game.id === 'kakuro') return <KakuroGame onComplete={(won, t) => handleComplete(won, t)} onBack={() => router.back()} />;
    if (game.id === 'color-sort') return <ColorSortGame onComplete={(won, t) => handleComplete(won, t)} onBack={() => router.back()} />;
    if (game.id === 'pipe-connect') return <PipeConnectGame onComplete={(won, t) => handleComplete(won, t)} onBack={() => router.back()} />;
    if (game.id === 'tower-of-hanoi') return <TowerOfHanoiGame onComplete={(won, t) => handleComplete(won, t)} onBack={() => router.back()} />;
    if (game.id === 'sliding-puzzle') return <SlidingPuzzleGame onComplete={(won, t) => handleComplete(won, t)} onBack={() => router.back()} />;
    // MVP 9
    if (game.id === 'hidden-words') return <HiddenWordsGame onComplete={(won, t) => handleComplete(won, t)} onBack={() => router.back()} />;
    if (game.id === 'word-chain') return <WordChainGame onComplete={(won, t) => handleComplete(won, t)} onBack={() => router.back()} />;
    if (game.id === 'word-ladder') return <WordLadderGame onComplete={(won, t) => handleComplete(won, t)} onBack={() => router.back()} />;
    if (game.id === 'minesweeper') return <MinesweeperGame onComplete={(won, t) => handleComplete(won, t)} onBack={() => router.back()} />;
    if (game.id === 'magic-square') return <MagicSquareGame onComplete={(won, t) => handleComplete(won, t)} onBack={() => router.back()} />;
    if (game.id === 'balance-scales') return <BalanceScalesGame onComplete={(won, t) => handleComplete(won, t)} onBack={() => router.back()} />;
    if (game.id === 'flood-fill') return <FloodFillGame onComplete={(won, t) => handleComplete(won, t)} onBack={() => router.back()} />;
    if (game.id === 'maze-runner') return <MazeRunnerGame onComplete={(won, t) => handleComplete(won, t)} onBack={() => router.back()} />;
    if (game.id === 'pixel-art') return <PixelArtGame onComplete={(won, t) => handleComplete(won, t)} onBack={() => router.back()} />;
    if (game.id === 'flag-quiz') return <FlagQuizGame onComplete={(won, t) => handleComplete(won, t)} onBack={() => router.back()} />;
    if (game.id === 'noughts-crosses') return <NoughtsCrossesGame onComplete={(won, t) => handleComplete(won, t)} onBack={() => router.back()} />;
    // MVP 10
    if (game.id === 'boggle') return <BoggleGame onComplete={(won, t) => handleComplete(won, t)} onBack={() => router.back()} />;
    if (game.id === 'rhyme-time') return <RhymeTimeGame onComplete={(won, t) => handleComplete(won, t)} onBack={() => router.back()} />;
    if (game.id === 'backwards-words') return <BackwardsWordsGame onComplete={(won, t) => handleComplete(won, t)} onBack={() => router.back()} />;
    if (game.id === 'cryptogram') return <CryptogramGame onComplete={(won, t) => handleComplete(won, t)} onBack={() => router.back()} />;
    if (game.id === 'kenken') return <KenKenGame onComplete={(won, t) => handleComplete(won, t)} onBack={() => router.back()} />;
    if (game.id === 'math-crossword') return <MathCrosswordGame onComplete={(won, t) => handleComplete(won, t)} onBack={() => router.back()} />;
    if (game.id === 'nonogram') return <NonogramGame onComplete={(won, t) => handleComplete(won, t)} onBack={() => router.back()} />;
    if (game.id === 'hitori') return <HitoriGame onComplete={(won, t) => handleComplete(won, t)} onBack={() => router.back()} />;
    if (game.id === 'chess-puzzles') return <ChessPuzzlesGame onComplete={(won, t) => handleComplete(won, t)} onBack={() => router.back()} />;
    if (game.id === 'science-symbols') return <ScienceSymbolsGame onComplete={(won, t) => handleComplete(won, t)} onBack={() => router.back()} />;
    // MVP 11
    if (game.id === 'word-hive') return <WordHiveGame onComplete={(won, t) => handleComplete(won, t)} onBack={() => router.back()} />;
    if (game.id === 'missing-vowels') return <MissingVowelsGame onComplete={(won, t) => handleComplete(won, t)} onBack={() => router.back()} />;
    if (game.id === 'quote-guess') return <QuoteGuessGame onComplete={(won, t) => handleComplete(won, t)} onBack={() => router.back()} />;
    if (game.id === 'letter-soup') return <LetterSoupGame onComplete={(won, t) => handleComplete(won, t)} onBack={() => router.back()} />;
    if (game.id === 'memory-match') return <MemoryMatchGame onComplete={(won, t) => handleComplete(won, t)} onBack={() => router.back()} />;
    if (game.id === 'symbol-sequence') return <SymbolSequenceGame onComplete={(won, t) => handleComplete(won, t)} onBack={() => router.back()} />;
    if (game.id === 'peg-solitaire') return <PegSolitaireGame onComplete={(won, t) => handleComplete(won, t)} onBack={() => router.back()} />;
    if (game.id === 'skyscrapers') return <SkyscrapersGame onComplete={(won, t) => handleComplete(won, t)} onBack={() => router.back()} />;
    if (game.id === 'takuzu') return <TakuzuGame onComplete={(won, t) => handleComplete(won, t)} onBack={() => router.back()} />;
    if (game.id === 'dots-boxes') return <DotsBoxesGame onComplete={(won, t) => handleComplete(won, t)} onBack={() => router.back()} />;
    if (game.id === 'logic-grid') return <LogicGridGame onComplete={(won, t) => handleComplete(won, t)} onBack={() => router.back()} />;
    // MVP 12
    if (game.id === 'word-bingo') return <WordBingoGame onComplete={(won, t) => handleComplete(won, t)} onBack={() => router.back()} />;
    if (game.id === 'vocab-builder') return <VocabBuilderGame onComplete={(won, t) => handleComplete(won, t)} onBack={() => router.back()} />;
    if (game.id === 'abbreviations') return <AbbreviationsGame onComplete={(won, t) => handleComplete(won, t)} onBack={() => router.back()} />;
    if (game.id === 'dominoes') return <DominoesGame onComplete={(won, t) => handleComplete(won, t)} onBack={() => router.back()} />;
    if (game.id === 'shikaku') return <ShikakuGame onComplete={(won, t) => handleComplete(won, t)} onBack={() => router.back()} />;
    if (game.id === 'typeshift') return <TypeshiftGame onComplete={(won, t) => handleComplete(won, t)} onBack={() => router.back()} />;
    // MVP 13
    if (game.id === 'word-morph') return <WordMorphGame onComplete={(won, t) => handleComplete(won, t)} onBack={() => router.back()} />;
    if (game.id === 'emoji-story') return <EmojiStoryGame onComplete={(won, t) => handleComplete(won, t)} onBack={() => router.back()} />;
    if (game.id === 'reversi') return <ReversiGame onComplete={(won, t) => handleComplete(won, t)} onBack={() => router.back()} />;
    if (game.id === 'last-letter') return <LastLetterGame onComplete={(won, t) => handleComplete(won, t)} onBack={() => router.back()} />;
    if (game.id === 'speed-tap') return <SpeedTapGame onComplete={(won, t) => handleComplete(won, t)} onBack={() => router.back()} />;
    if (game.id === 'number-maze') return <NumberMazeGame onComplete={(won, t) => handleComplete(won, t)} onBack={() => router.back()} />;
    if (game.id === 'mirror-puzzle') return <MirrorPuzzleGame onComplete={(won, t) => handleComplete(won, t)} onBack={() => router.back()} />;
    // MVP 14
    if (game.id === 'mahjong') return <MahjongGame onComplete={(won, t) => handleComplete(won, t)} onBack={() => router.back()} />;
    if (game.id === 'checkers') return <CheckersGame onComplete={(won, t) => handleComplete(won, t)} onBack={() => router.back()} />;
    if (game.id === 'masyu') return <MasyuGame onComplete={(won, t) => handleComplete(won, t)} onBack={() => router.back()} />;
    if (game.id === 'tapa') return <TapaGame onComplete={(won, t) => handleComplete(won, t)} onBack={() => router.back()} />;
    if (game.id === 'fillomino') return <FillominoGame onComplete={(won, t) => handleComplete(won, t)} onBack={() => router.back()} />;
    if (game.id === 'acrostic') return <AcrosticGame onComplete={(won, t) => handleComplete(won, t)} onBack={() => router.back()} />;
    if (game.id === 'syllable-split') return <SyllableSplitGame onComplete={(won, t) => handleComplete(won, t)} onBack={() => router.back()} />;
    if (game.id === 'word-parts') return <WordPartsGame onComplete={(won, t) => handleComplete(won, t)} onBack={() => router.back()} />;
    if (game.id === 'phonetic-spelling') return <PhoneticSpellingGame onComplete={(won, t) => handleComplete(won, t)} onBack={() => router.back()} />;
    if (game.id === 'emoji-sudoku') return <EmojiSudokuGame onComplete={(won, t) => handleComplete(won, t)} onBack={() => router.back()} />;
    // MVP 15
    if (game.id === 'letter-drop') return <LetterDropGame onComplete={(won, t) => handleComplete(won, t)} onBack={() => router.back()} />;
    if (game.id === 'word-maze') return <WordMazeGame onComplete={(won, t) => handleComplete(won, t)} onBack={() => router.back()} />;
    if (game.id === 'wordsmiths-duel') return <WordsmithsDuelGame onComplete={(won, t) => handleComplete(won, t)} onBack={() => router.back()} />;
    if (game.id === 'gravity-blocks') return <GravityBlocksGame onComplete={(won, t) => handleComplete(won, t)} onBack={() => router.back()} />;
    if (game.id === 'daily-challenge') return <DailyChallengeGame onComplete={(won, t) => handleComplete(won, t)} onBack={() => router.back()} />;
    return (
      <View style={s.placeholder}>
        <Text style={s.placeholderEmoji}>{game.emoji}</Text>
        <Text style={s.placeholderText}>{game.name} coming soon</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity
          onPress={() => {
            if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          style={s.iconBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={22} color={colors.ink} />
        </TouchableOpacity>

        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>{game.name}</Text>
          <Text style={s.headerSub}>{subtitle}</Text>
        </View>

        {showTimer && (
          <View style={s.timerPill}>
            <Ionicons name="time-outline" size={13} color={colors.inkSoft} />
            <Text style={s.timerText}>{formatTime(elapsed)}</Text>
          </View>
        )}

        {/* How to Play button — always free */}
        <TouchableOpacity
          style={s.iconBtn}
          activeOpacity={0.7}
          onPress={() => {
            if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowHowToPlay(true);
          }}
        >
          <Text style={s.howToPlayIcon}>?</Text>
        </TouchableOpacity>

        {/* Progressive hint button with count badge */}
        <TouchableOpacity
          style={[s.hintCountBtn, hintsRemaining === 0 && s.hintCountBtnDepleted]}
          activeOpacity={0.7}
          onPress={() => {
            if (hintsRemaining === 0) return;
            if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowHintModal(true);
          }}
        >
          <Text style={s.hintBulb}>💡</Text>
          <Text style={[s.hintCountText, hintsRemaining === 0 && { color: colors.inkMuted }]}>
            {hintsRemaining}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={s.gameArea}>
        {renderGame()}
        {/* Sudoku-specific completion overlay (no internal modal) */}
        {sudokuDone && (
          <View style={s.sudokuDoneOverlay}>
            <View style={[s.sudokuDoneCard, { backgroundColor: colors.surface }]}>
              <Text style={[s.sudokuDoneEmoji]}>🏆</Text>
              <Text style={[s.sudokuDoneTitle, { color: colors.ink }]}>Puzzle Solved!</Text>
              <Text style={[s.sudokuDoneSub, { color: colors.inkMuted }]}>
                {formatTime(elapsed)} · Great work
              </Text>
              <TouchableOpacity
                style={[s.sudokuDoneBtn, { backgroundColor: colors.ink }]}
                onPress={() => { setSudokuDone(false); setRunning(true); setElapsed(0); }}
                activeOpacity={0.82}
              >
                <Text style={[s.sudokuDoneBtnText, { color: colors.bg }]}>New Game</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.sudokuDoneBtn, { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.rule, marginTop: 8 }]}
                onPress={() => router.back()}
                activeOpacity={0.82}
              >
                <Text style={[s.sudokuDoneBtnText, { color: colors.inkSoft }]}>Go Back</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Win confetti */}
      <Confetti active={showConfetti} />

      {/* Star rating burst */}
      {showStars && (
        <View style={s.starOverlay} pointerEvents="none">
          <Text style={s.starRow}>{'⭐'.repeat(starCount)}</Text>
          <Text style={s.starLabel}>
            {starCount === 3 ? 'Excellent!' : starCount === 2 ? 'Well done!' : 'Complete!'}
          </Text>
          {sessionHintsUsed > 0 && (
            <Text style={[s.starLabel, { backgroundColor: colors.logic.bg, color: colors.logic.ink, marginTop: 6 }]}>
              ⚡ {sessionHintsUsed} hint{sessionHintsUsed > 1 ? 's' : ''} used
            </Text>
          )}
        </View>
      )}

      {/* Streak milestone toast */}
      {streakMsg !== '' && (
        <View style={s.streakToast} pointerEvents="none">
          <Text style={s.streakToastText}>{streakMsg}</Text>
        </View>
      )}

      {/* First-time tutorial modal */}
      <Modal visible={showTutorial} transparent animationType="fade" onRequestClose={() => setShowTutorial(false)}>
        <View style={s.tutorialOverlay}>
          <View style={[s.tutorialCard, { backgroundColor: colors.surface }]}>
            <Text style={[s.tutorialGameName, { color: colors.inkMuted }]}>{game.name}</Text>
            <Text style={[s.tutorialTitle, { color: colors.ink }]}>How to Play</Text>
            <Text style={[s.tutorialBody, { color: colors.inkSoft }]}>{tutorial}</Text>
            <TouchableOpacity
              style={[s.tutorialBtn, { backgroundColor: colors.ink }]}
              onPress={() => setShowTutorial(false)}
              activeOpacity={0.82}
            >
              <Text style={[s.tutorialBtnText, { color: colors.bg }]}>Let's Play!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* HOW TO PLAY modal — free, unlimited */}
      <Modal visible={showHowToPlay} transparent animationType="slide" onRequestClose={() => setShowHowToPlay(false)}>
        <TouchableOpacity style={s.htpOverlay} activeOpacity={1} onPress={() => setShowHowToPlay(false)}>
          <TouchableOpacity activeOpacity={1} onPress={() => {}}>
            <View style={[s.htpSheet, { backgroundColor: colors.surface }]}>
              <View style={s.htpHandle} />
              <View style={s.htpTitleRow}>
                <Text style={s.htpEmoji}>{game.emoji}</Text>
                <View>
                  <Text style={[s.htpGameName, { color: colors.inkMuted }]}>HOW TO PLAY</Text>
                  <Text style={[s.htpGameTitle, { color: colors.ink }]}>{game.name}</Text>
                </View>
              </View>
              <ScrollView showsVerticalScrollIndicator={false} style={s.htpScroll}>
                <Text style={[s.htpBody, { color: colors.inkSoft }]}>{tutorial}</Text>
                {game.hint ? (
                  <View style={[s.htpTipBox, { backgroundColor: colors.logic.bg }]}>
                    <Ionicons name="star" size={14} color={colors.logic.ink} />
                    <Text style={[s.htpTip, { color: colors.logic.ink }]}>{game.hint}</Text>
                  </View>
                ) : null}
              </ScrollView>
              <TouchableOpacity
                style={[s.htpBtn, { backgroundColor: colors.ink }]}
                onPress={() => setShowHowToPlay(false)}
                activeOpacity={0.82}
              >
                <Text style={[s.htpBtnText, { color: colors.bg }]}>Got it, let's play!</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* PROGRESSIVE HINT modal — limited, with penalty */}
      <Modal visible={showHintModal} transparent animationType="fade" onRequestClose={() => setShowHintModal(false)}>
        <TouchableOpacity style={s.hintOverlay} activeOpacity={1} onPress={() => setShowHintModal(false)}>
          <TouchableOpacity activeOpacity={1} onPress={() => {}}>
            <View style={[s.hintCard, { backgroundColor: colors.surface }]}>
              <View style={s.hintHeader}>
                <View style={[s.hintIconWell, { backgroundColor: colors.logic.bg }]}>
                  <Text style={{ fontSize: 20 }}>💡</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.hintTitle, { color: colors.ink }]}>
                    Hint {hintIndex + 1} of 3
                  </Text>
                  <Text style={[s.hintPenaltyNote, { color: colors.inkMuted }]}>
                    ⚡ Using a hint marks this as an assisted solve
                  </Text>
                </View>
              </View>
              <Text style={[s.hintText, { color: colors.inkSoft }]}>
                {getHints(game.id)[hintIndex]}
              </Text>
              <View style={s.hintBtnRow}>
                <TouchableOpacity
                  style={[s.hintBtn, { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.rule }]}
                  onPress={() => setShowHintModal(false)}
                  activeOpacity={0.82}
                >
                  <Text style={[s.hintBtnText, { color: colors.inkSoft }]}>Not now</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.hintBtn, { backgroundColor: colors.ink, flex: 1.5 }]}
                  onPress={() => {
                    setHintIndex(i => Math.min(i + 1, 2));
                    setHintsRemaining(r => Math.max(r - 1, 0));
                    setSessionHintsUsed(h => h + 1);
                    setShowHintModal(false);
                  }}
                  activeOpacity={0.82}
                >
                  <Text style={[s.hintBtnText, { color: colors.bg }]}>Show hint</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const makeStyles = (colors: ReturnType<typeof useTheme>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    gap: 8,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: fonts.black,
    color: colors.ink,
    letterSpacing: -0.2,
  },
  headerSub: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: colors.inkMuted,
    marginTop: 1,
  },
  timerPill: {
    height: 40,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  timerText: {
    fontSize: 13,
    fontFamily: fonts.extraBold,
    color: colors.ink,
    fontVariant: ['tabular-nums'],
  },
  gameArea: {
    flex: 1,
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderEmoji: {
    fontSize: 64,
    marginBottom: 24,
  },
  placeholderText: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.inkSoft,
  },
  error: {
    fontSize: 15,
    fontFamily: fonts.regular,
    color: colors.danger,
    padding: 20,
  },
  sudokuDoneOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  sudokuDoneCard: {
    width: '100%',
    borderRadius: 28,
    padding: 28,
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  sudokuDoneEmoji: { fontSize: 48, marginBottom: 4 },
  sudokuDoneTitle: { fontFamily: fonts.black, fontSize: 24, letterSpacing: -0.5 },
  sudokuDoneSub: { fontFamily: fonts.semiBold, fontSize: 14, marginBottom: 8 },
  sudokuDoneBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
  },
  sudokuDoneBtnText: { fontFamily: fonts.extraBold, fontSize: 15 },
  howToPlayIcon: {
    fontFamily: fonts.black,
    fontSize: 17,
    color: colors.inkSoft,
    width: 40,
    height: 40,
    lineHeight: 40,
    textAlign: 'center',
    backgroundColor: colors.surface,
    borderRadius: 999,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    overflow: 'hidden',
  },
  hintCountBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 10,
    height: 40,
    borderRadius: 999,
    backgroundColor: colors.logic.bg,
  },
  hintCountBtnDepleted: {
    backgroundColor: colors.surface,
  },
  hintBulb: { fontSize: 14 },
  hintCountText: {
    fontFamily: fonts.extraBold,
    fontSize: 13,
    color: colors.logic.ink,
  },
  htpOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  htpSheet: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 12,
    paddingHorizontal: 24,
    paddingBottom: 40,
    maxHeight: '85%',
  },
  htpHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: colors.rule,
    alignSelf: 'center',
    marginBottom: 20,
  },
  htpTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  htpEmoji: { fontSize: 40 },
  htpGameName: {
    fontFamily: fonts.bold,
    fontSize: 11,
    letterSpacing: 0.8,
  },
  htpGameTitle: {
    fontFamily: fonts.black,
    fontSize: 22,
    letterSpacing: -0.4,
  },
  htpScroll: { maxHeight: 280, marginBottom: 16 },
  htpBody: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 12,
  },
  htpTipBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 14,
    borderRadius: 14,
    marginTop: 8,
  },
  htpTip: {
    flex: 1,
    fontFamily: fonts.semiBold,
    fontSize: 14,
    lineHeight: 20,
  },
  htpBtn: {
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: 'center',
  },
  htpBtnText: { fontFamily: fonts.extraBold, fontSize: 16 },
  hintOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  hintCard: {
    width: '100%',
    borderRadius: 28,
    padding: 24,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 10,
  },
  hintHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  hintIconWell: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  hintTitle: { fontFamily: fonts.black, fontSize: 18, letterSpacing: -0.3 },
  hintPenaltyNote: { fontFamily: fonts.semiBold, fontSize: 11, marginTop: 2 },
  hintText: { fontFamily: fonts.semiBold, fontSize: 15, lineHeight: 22 },
  hintBtnRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  hintBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
  },
  hintBtnText: { fontFamily: fonts.extraBold, fontSize: 15 },
  streakToast: {
    position: 'absolute',
    bottom: 32,
    left: 20,
    right: 20,
    backgroundColor: colors.ink,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 20,
    alignItems: 'center',
    zIndex: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  streakToastText: {
    fontFamily: fonts.extraBold,
    fontSize: 15,
    color: colors.bg,
    textAlign: 'center',
  },
  starOverlay: {
    position: 'absolute',
    top: 70,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 210,
    pointerEvents: 'none' as any,
  },
  starRow: {
    fontSize: 32,
    marginBottom: 4,
  },
  starLabel: {
    fontFamily: fonts.black,
    fontSize: 18,
    color: colors.ink,
    backgroundColor: colors.surface,
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderRadius: 999,
    overflow: 'hidden',
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  tutorialOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  tutorialCard: {
    width: '100%',
    borderRadius: 28,
    padding: 28,
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  tutorialGameName: {
    fontFamily: fonts.bold,
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  tutorialTitle: {
    fontFamily: fonts.black,
    fontSize: 24,
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  tutorialBody: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    lineHeight: 23,
    textAlign: 'center',
    marginBottom: 8,
  },
  tutorialBtn: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: 'center',
    marginTop: 4,
  },
  tutorialBtnText: {
    fontFamily: fonts.extraBold,
    fontSize: 16,
  },
});
