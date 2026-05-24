// Three progressive hints per game. Hint 1 = vague, Hint 3 = very specific.
export const GAME_HINTS: Record<string, [string, string, string]> = {
  'word-guess': [
    'Start with a word that uses common letters — try words with E, A, R, O, T, or S.',
    'Pay attention to yellow letters — they\'re in the word but in a different position.',
    'Green letters are locked in. Build your next guess around them and the yellow letters.',
  ],
  'sudoku': [
    'Look for the row, column, or 3×3 box with the most filled numbers — start there.',
    'If a digit appears in 2 out of 3 boxes in a row, the 3rd box must contain it somewhere in that row.',
    'In each box, find a number that can only go in one cell given the other numbers in that row/column.',
  ],
  'group-it': [
    'Look for words that share an unexpected connection, not just an obvious one.',
    'If 3 words clearly belong together, the 4th is either in the same group or one away.',
    'Try to identify the trickiest group first — often it\'s a phrase where every word can follow or precede one hidden word.',
  ],
  'crossword-mini': [
    'Start with the shortest clues — 3-letter answers are usually easier to guess.',
    'Fill in the answers you\'re sure about first; their crossing letters reveal other answers.',
    'Read the clue literally — the answer is often more direct than it seems.',
  ],
  'hangman': [
    'Start with the most common letters in English: E, T, A, O, I, N, S, H, R.',
    'Look at the word pattern — the number of letters and any you\'ve already found narrow things down.',
    'Avoid guessing uncommon letters like Q, Z, X, J unless you have strong evidence.',
  ],
  'math-sprint': [
    'For multiplication, try to memorize your times tables up to 12 — it\'s the biggest time-saver.',
    'For division, think of it as "what times the divisor equals the dividend?"',
    'If you\'re unsure, estimate first — an answer close to your estimate helps confirm.',
  ],
  'number-bonds': [
    'Start by identifying pairs where one number is very large — they\'ll only pair with small numbers.',
    'Work from the edges of the board inward, clearing numbers that have fewer possible partners.',
    'Remember the target sum — any two numbers on the board that add up to it are a valid pair.',
  ],
  'anagram': [
    'Look for common word endings: -ING, -ED, -ER, -LY, -TION.',
    'Try rearranging consonants first, then find where the vowels fit.',
    'Common prefixes like UN-, RE-, OUT-, or PRE- can help you find the start of the word.',
  ],
  'sequence-fill': [
    'Check if the numbers go up or down by a fixed amount — that\'s an arithmetic sequence.',
    'If the gaps between numbers aren\'t equal, try multiplying: each term might be a fixed multiple of the last.',
    'Look for familiar patterns: perfect squares (1,4,9,16), Fibonacci (1,1,2,3,5), or triangular numbers (1,3,6,10).',
  ],
  'pattern-recog': [
    'Look at shape, color, and number separately — one of them might be the key pattern.',
    'Check if the pattern cycles — does it repeat every 2, 3, or 4 steps?',
    'Look at what changes between each item in the sequence — the change itself is the pattern.',
  ],
  'word-search': [
    'Start with the longest word on the list — longer words are easier to spot.',
    'Scan each row and column for the first letter of your target word, then look diagonally.',
    'Look for double letters — QU, TH, SH, LL — they stand out in the grid.',
  ],
  'minesweeper': [
    'A cell showing 1 surrounded by only one unrevealed neighbor means that neighbor is definitely a mine.',
    'When the mine count matches the number of unrevealed cells next to a revealed number, all those cells are mines.',
    'The corners and edges have fewer adjacent cells, making them easier to analyze — start there.',
  ],
  'memory-match': [
    'Scan all the revealed cards quickly before they flip back — build a mental map of positions.',
    'Prioritize flipping cards you haven\'t seen yet rather than guessing at pairs you\'re unsure of.',
    'When you flip a card you\'ve seen before and remember its pair, go straight to the pair.',
  ],
  'sliding-puzzle': [
    'Solve the top row first, then the second row, and finally the bottom two rows together.',
    'Move the empty square into position first, then slide the target tile to follow it.',
    'For the last 2×2 block, rotate tiles in a circle: right→down→left→up.',
  ],
  'color-sort': [
    'Focus on completing one color at a time — find where all its balls are and pour them into one tube.',
    'Keep at least one tube empty at all times as a buffer for rearranging.',
    'Work backward from the most "stuck" colors — the ones buried under others.',
  ],
  'word-chain': [
    'Think of common two-letter words first — they\'re easiest to chain from.',
    'If you\'re stuck, use a "bridge" word that ends in a common starting letter like S, T, or R.',
    'Consider plurals and past tenses — they give you a lot of ending options.',
  ],
  'word-ladder': [
    'Change the last letter first — it\'s usually the easiest to swap.',
    'Look for common 3-letter words that differ by one letter; they make great stepping stones.',
    'If you\'re stuck, work backward from the target word toward the start word.',
  ],
  'kakuro': [
    'A 2-cell run of 3 must be 1+2. A 2-cell run of 17 must be 8+9. These forced combinations are your starting points.',
    'When you know a run\'s digits, check which cells they can go in based on column constraints.',
    'Look for cells that appear in both a short across run and a short down run — they\'re highly constrained.',
  ],
  'magic-square': [
    'The center cell of a 3×3 magic square always holds the middle value of your number range.',
    'Once the center is placed, opposite corners must sum to the same amount as opposite edge midpoints.',
    'Try placing your largest numbers in the corners, then fill in what the rows need.',
  ],
  'pipe-connect': [
    'Start with corner cells — they have only two possible orientations, narrowing things down.',
    'Follow a pipe from a known endpoint and trace where it must go.',
    'Dead ends are a clue — if a pipe enters a cell with no valid exit, you\'ve made a wrong turn.',
  ],
  'tower-of-hanoi': [
    'To move N discs, move the top N-1 discs to the spare peg, move the largest, then stack N-1 on top.',
    'You can never place a larger disc on a smaller one — plan at least 2 moves ahead.',
    'The minimum moves needed is 2ⁿ-1, where n is the number of discs. Count your moves to stay efficient.',
  ],
  'flood-fill': [
    'Pick colors that are adjacent to large areas of the same color — each pick should spread as far as possible.',
    'Look for the color that will unlock the most of the board in the next step or two.',
    'Work from the outer edges inward — surrounded regions are often more efficient to fill last.',
  ],
  'word-hive': [
    'Every valid word must include the center letter — start your mental search there.',
    'Common 4-letter patterns with any vowel center: go through consonant combos (ST, TR, NT, etc.).',
    'The pangram uses all 7 letters exactly once — if you can spot a 7-letter word, it\'s worth bonus points.',
  ],
  'game-2048': [
    'Keep your highest tile in one corner — build all your merges around it.',
    'Never move away from your high-tile corner — it should always be in the same corner.',
    'Build a "snake" pattern: high numbers along one edge descending, then back along the next row.',
  ],
  'maze-runner': [
    'At every junction, hug the right wall — following one wall consistently will always find the exit.',
    'If you find a dead end, backtrack to the last junction and try the next unexplored direction.',
    'Look at the maze shape from a high level — the exit is often on the opposite side from the entrance.',
  ],
  'balance-scales': [
    'Start with the heaviest weight on one side and find what balances it on the other.',
    'Use the difference between known weights to identify unknown ones.',
    'If two combinations give the same total, the unknown weight can be deduced by comparison.',
  ],
  'flag-quiz': [
    'Focus on the color scheme first — many flags share stripes or fields of the same colors.',
    'Look for distinctive symbols: stars, crescents, eagles, or unique shapes that narrow down the region.',
    'Think by region: African flags often use green/yellow/red; Nordic flags have crosses; island nations use blue.',
  ],
  'speed-tap': [
    'Relax your hand and keep your finger hovering just above the target — don\'t press in advance.',
    'Focus on the color change, not the countdown — your reaction should be automatic.',
    'A light touch is faster than a heavy press — just enough contact to register.',
  ],
  'chess-puzzles': [
    'Look for checks, captures, and threats in that order — forcing moves narrow down the options.',
    'Examine every piece the opponent has — a tactical motif often targets the least-defended one.',
    'If there\'s a queen sacrifice, look very carefully — those solutions are usually forcing checkmates.',
  ],
  'nonogram': [
    'A clue equal to the row/column length fills the whole thing — shade it all immediately.',
    'When a clue is more than half the row length, the middle cells are guaranteed to be filled.',
    'Work with the longest clue first in each row and column — it constrains the most cells.',
  ],
  'kenken': [
    'For small cages (2 cells), list all valid combinations — often there are only 2 or 3 options.',
    'Apply Sudoku logic — each row and column must contain each digit exactly once.',
    'For division cages, remember the larger number must divide evenly into the smaller.',
  ],
  'hitori': [
    'If a number appears 3+ times in a row, the middle occurrence must be blacked out.',
    'Two blacked-out cells can never be adjacent horizontally or vertically.',
    'All white cells must remain connected — use this to rule out blackening cells that would create islands.',
  ],
  'takuzu': [
    'No more than two consecutive 0s or 1s in a row — use this to fill forced cells.',
    'Each row and column must have equal numbers of 0s and 1s — count what\'s needed.',
    'No two rows or two columns can be identical — use this to rule out completion options.',
  ],
  'dots-boxes': [
    'Avoid taking the 3rd side of any box — it gives your opponent the 4th side (and the point).',
    'Chain theory: long chains of boxes are won by the player who opens them. Shorter chains favor the opener.',
    'Sacrifice short chains (2-box) to give your opponent the opening move on the long chains.',
  ],
};

export function getHints(gameId: string): [string, string, string] {
  return GAME_HINTS[gameId] ?? [
    'Look for the most constrained cells or positions to start.',
    'Work from what you know with certainty toward what you\'re unsure about.',
    'Step back and look for a pattern or rule you might have missed.',
  ];
}
