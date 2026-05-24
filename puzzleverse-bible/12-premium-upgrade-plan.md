# PuzzleVerse Premium Upgrade Plan

_Audit date: 2026-05-23_

---

## Critical Bugs (fix immediately)

### 1. `showTimer` setting ignored — `app/game/[gameId].tsx`
- Timer always visible regardless of `useSettingsStore().showTimer`
- Fix: read `showTimer` from store and conditionally render `timerPill`

### 2. Wrong subtitle for most games — `app/game/[gameId].tsx`
- The nested ternary only handles 10 games by name; everything else falls back to "Easy"
- Fix: generate subtitle from `game.category` / `game.difficulty` / daily flag

### 3. GroupIt elapsedRef accumulates across replays — `src/games/groupit/GroupItGame.tsx`
- `elapsedRef.current` is never reset when Play Again is pressed; time shown at end is cumulative
- Fix: add `elapsedRef.current = 0` to `startNewGame()`

### 4. MathSprint Play Again hardcodes 'medium' — `src/games/mathsprint/MathSprintGame.tsx`
- `generateQuestions('medium')` ignores whatever difficulty was being played
- Fix: track difficulty in state and use it on restart

### 5. CrosswordGame timer can stack intervals — `src/games/crossword/CrosswordGame.tsx`
- `startTimer()` doesn't clear existing interval before creating new one
- Fix: clear `timerRef.current` at start of `startTimer()`

### 6. WordSearchGame stale gridRef on puzzle change — `src/games/wordsearch/WordSearchGame.tsx`
- `gridRef` initialized once; puzzle can change but ref isn't updated synchronously
- Fix: update `gridRef` inside the puzzle-change useEffect before it's used

### 7. Duplicate `getGameGlyph` / `GameGlyph` code — `index.tsx` + `stats.tsx`
- Identical 120-line switch statement copied in two files
- Fix: extract to `src/components/GameGlyph.tsx` shared component

---

## Game Feel Improvements (high impact, quick wins)

### 1. Win celebration animation — all games
- Completion moment is just a modal appearing; no fireworks, no delight
- Implement: confetti particle burst using `react-native-reanimated` (pure JS, no native module needed)
- Trigger on `won === true` in completion modals

### 2. Haptics missing from key interactions
- Most games have NO haptic feedback whatsoever
- Add `hapticLight` on every significant tap (placing a letter, moving a tile)
- Add `hapticSuccess` on correct answer / level complete
- Add `hapticError` on wrong answer
- Priority games: sudoku (cell select), anagram (letter place), groupit (item select), memorymatch (card flip), 2048 (swipe+merge), colorsort (pour), mazerunner (move), speedtap (tap)

### 3. Sound effects only in word-guess
- `playSound()` exists but only `WordGuessGame` uses it
- Add `playSound('correct')` / `playSound('win')` / `playSound('lose')` to: groupit, hangman, numberbonds, mathsprint, patternrecog, sequencefill, crossword

### 4. Completion modal inconsistency
- MVP 1-7 games have polished bottom-sheet modals; later games use basic centered Modal
- `MathSprintGame`, `SpeedTapGame`, `PatternRecogGame`, `SequenceFillGame` use the old centered style
- Standardize to bottom-sheet pattern with drag handle + trophy circle

### 5. Missing animations on category filter
- Home screen pill filter redraws entire grid instantly (jarring)
- Add fade+slide on game tiles when category changes

---

## NYT-Level Features (implement in order of impact)

### 1. Streak calendar heatmap in Stats
- Replace the 7-day bar chart with a 30-day calendar grid (like GitHub activity)
- Color cells by activity level: 0 games = empty, 1-2 = soft, 3+ = full color
- Shows `overallStreak` context visually; much more motivating

### 2. Daily puzzle numbering (#Day N)
- Wordle shows "#Wordle 1234" — add "Puzzle #N" to daily game header
- Calculate N from app launch date (epoch: 2026-01-01) + today's offset
- Show in header subtitle and share text

### 3. Share result emoji grid for all daily games
- Word Guess already has this; GroupIt daily should have it too
- Add `generateShareText()` to GroupIt, Crossword, and WordSearch daily modes
- Show share button in completion modal when daily mode

### 4. Personal best badge on home tiles  
- When `bestTimeSeconds !== null`, show a small ⭐ or "PB" indicator on the tile
- Show actual best time as sub-label on tile hover/long-press

### 5. Streak milestone messaging
- After completing a game, if streak hit 3/7/14/30, show a motivational overlay
- "3 days in a row! You're building a habit 🔥"
- "7-day streak! Word Wizard unlocked 🏆"

### 6. Hard mode for word games
- In WordGuessGame unlimited, add Hard Mode toggle in the how-to-play modal
- Hard mode: revealed hints MUST be used in subsequent guesses
- Store preference in settings store

### 7. Time-based star rating (1-3 stars)
- Based on completion time vs. game's `estimatedMinutes`:
  - 3 stars: < 50% of estimated time
  - 2 stars: 50-100%
  - 1 star: > 100%
- Show stars in completion modal and on tile after completion

### 8. Per-game tutorial (first play only)
- Check `gamesPlayed === 0`; show a brief instruction overlay before first game
- Each game's `description` field + 1-2 animated step hints
- Dismiss = "Got it, let's play"

### 9. Auto-save mid-game state
- Sudoku and Crossword are long-form games; losing progress on app close is frustrating
- Serialize board state + timer to AsyncStorage on `useEffect` cleanup
- Restore on next open of same game

---

## Polish Pass

### Typography
- `subtitle` in game header falls back to "Easy" for 65+ games — fix to show actual game subtitle
- Stat tile values truncate on small screens — add `numberOfLines={1}` + `adjustsFontSizeToFit`

### Spacing
- Stats screen `achieveRow` has no right padding, last card is clipped
- Daily screen week strip shows only `word-guess` completions — extend to all daily games

### Color consistency
- `danger` color (`#C0432F` / `#E37863`) not used on error states in most games
- Wrong answers in quiz games show no visual feedback beyond text

### Empty states
- Home screen with no games played: no "featured" or "recommended" section, just empty tiles
- Add a "Start here" section for first-time users highlighting the top 4 games

### Settings
- `reducedMotion` setting read in very few games; most still animate
- `soundEnabled` = false by default; consider defaulting to true with a first-run prompt

---

## Implementation Status

| Item | Status |
|------|--------|
| showTimer bug fix | ✅ |
| subtitle logic fix | ✅ |
| GroupIt elapsedRef | ✅ (fixed via startNewGame) |
| MathSprint difficulty | ✅ |
| CrosswordGame timer stack | ✅ |
| Shared GameGlyph component | ✅ |
| Confetti win animation | ✅ |
| Haptics in key games | ✅ |
| Sound in more games | ✅ (via [gameId].tsx parent + per-game for Hangman/MathSprint) |
| Streak calendar heatmap | ✅ |
| Daily puzzle #numbering | ✅ |
| Share result for daily games | ⬜ (GroupIt/Crossword still pending) |
| Personal best badges | ✅ |
| Streak milestone messaging | ✅ |
| Hard mode word games | ✅ |
| Star rating system | ✅ |
| Per-game tutorial (first play) | ✅ |
| Daily week strip fix | ✅ |
| Auto-save mid-game state | ⬜ (complex — Sudoku/Crossword) |
