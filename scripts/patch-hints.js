/**
 * Adds hint: '...' field to every game in games.ts after the mvpPhase field.
 */
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/constants/games.ts');
let content = fs.readFileSync(filePath, 'utf8');

const hints = {
  'sudoku': 'Look for rows, columns, or boxes with the most digits filled. A cell with only one possibility must be that digit.',
  'word-guess': 'Start with a word rich in common letters like CRANE or SLATE. Green = right place, yellow = wrong place.',
  'word-search': 'Words go in 8 directions including diagonals. Scan each row slowly for the first letter of a word you are hunting.',
  'group-it': 'The trickiest group often uses an unexpected meaning. Common-looking words are usually the trap — think laterally.',
  'hangman': 'Try frequent consonants first: R, S, T, L, N. Then common vowels A, E, I. Avoid rare letters like Q, Z, X.',
  'number-bonds': 'Start from the corners — corner tiles have fewer pairing options. Work inward as the board clears.',
  'crossword-mini': 'Tackle the shortest answers first — they narrow down the crossing letters for harder clues.',
  'pattern-recog': 'Each attribute (color, shape, size, count) may cycle independently. Track them one at a time.',
  'sequence-fill': 'Find the gap between consecutive numbers. Constant gap = arithmetic. Constant multiplier = geometric.',
  'math-sprint': 'Trust your instinct for small numbers. For larger ones, break them: 12×13 = 12×10 + 12×3 = 156.',
  'anagram': 'Rearrange consonants around the vowels. Try common word endings like -ING, -ED, or -ER first.',
  'compound-words': 'Think of two shorter words that can merge. The first word usually modifies or belongs with the second.',
  'game-2048': 'Keep your highest tile in one corner. Build a chain from that corner outward and never move away from it.',
  'kakuro': 'Cells in a run must be unique digits 1–9. List all combos that sum to the clue and eliminate impossible digits.',
  'color-sort': 'Only move the top ball of a tube. Avoid mixing different colors — free up a tube to use as a buffer.',
  'pipe-connect': 'Start from the endpoints and work inward. Pipes that only fit one direction are your fixed anchors.',
  'tower-of-hanoi': 'Move smaller disks out of the way first. For N disks you need exactly 2ⁿ−1 moves minimum.',
  'sliding-puzzle': 'Solve rows top to bottom. Use a circular motion to place the last two tiles in each row without disturbing earlier ones.',
  'hidden-words': 'Read across the boundaries between words — hidden words often span two adjacent words in the phrase.',
  'word-chain': 'Keep your options open. Pick transitions that connect to many possible next words, not just one obvious path.',
  'word-ladder': 'Change one letter at a time. Look for bridge words that share letters with both the start and end words.',
  'minesweeper': 'A number touching only one covered cell means that cell is definitely a mine — flag it safely.',
  'magic-square': 'The magic sum for a 3×3 square is 15. The center must be 5. Use this as your starting anchor.',
  'balance-scales': 'Build a chain of comparisons. If A > B and B > C then A > C — reason transitively to find the order.',
  'flood-fill': 'Plan 2–3 moves ahead. Choose a color that opens up the largest connected region for your next move.',
  'maze-runner': 'Mark dead ends as you backtrack. Always try the rightmost unvisited path first for a consistent strategy.',
  'pixel-art': 'Fill the dominant background color first. Work from the largest regions forward to the smallest details.',
  'flag-quiz': 'Focus on distinctive symbols, stripes, and color arrangements. Flags with unique emblems are easiest to lock in.',
  'noughts-crosses': 'Always take the center square if free. Try to create two threats simultaneously — your opponent can only block one.',
  'boggle': 'Start with short 3-letter words to find your footing, then look for -ING, -ER, and UN- prefixes for longer words.',
  'rhyme-time': 'Say the target word aloud — your ear often finds the rhyme before your eye does scanning the options.',
  'backwards-words': 'Spell each word letter by letter in reverse out loud — hearing it backwards often reveals the word faster.',
  'cryptogram': 'Start with single-letter words (A or I), then common short words like THE, AND, or IS to anchor the cipher.',
  'kenken': 'Small cages have very few digit combinations. List all possibilities for each cage before you start placing.',
  'math-crossword': 'Work from cells shared by across and down entries — the intersection digit must satisfy both equations.',
  'nonogram': 'Focus on rows or columns where the clues nearly fill the space — a clue of 5 in a 5-wide row must be solid.',
  'hitori': 'A circled cell cannot be adjacent to another circled cell. Start by circling obvious duplicate numbers.',
  'chess-puzzles': 'Look for checks, captures, and forks first. Most tactical puzzles end with forced checkmate or material gain.',
  'science-symbols': 'Group by shape and origin. Element symbols usually take the first letter or two of their Latin name.',
  'word-hive': 'The center letter must appear in every word. Try adding it to common endings like -ATE, -ING, or -ED.',
  'missing-vowels': 'Read the consonant string aloud quickly — your brain naturally fills in the missing vowels as you speak.',
  'quote-guess': 'Famous quotes often open with I, The, It, or You. Short common words give you the biggest initial footholds.',
  'letter-soup': 'Read diagonally and backwards too. Common 3-letter words like THE, AND, FOR hide in surprising directions.',
  'memory-match': 'Group cards mentally by screen position. Flip cards from new regions to learn their faces before matching.',
  'symbol-sequence': 'Track each symbol property independently — some rotate, some flip. Focus on one attribute at a time.',
  'peg-solitaire': 'Plan jumps that leave pegs in positions to enable more jumps. The center peg is usually the last one standing.',
  'skyscrapers': 'A clue of 1 means the tallest building is visible first — place the tallest skyscraper at that edge of the row.',
  'takuzu': 'Each row and column needs equal 0s and 1s with no three consecutive identical digits. Start with forced cells.',
  'dots-boxes': 'Avoid completing the third side of any box until you must — then chain as many boxes together as possible.',
  'logic-grid': 'Start with the most direct clues (X is or is not Y). Use a grid to track every elimination systematically.',
  'word-bingo': 'Scan for common word endings (-TION, -ING, -ER) that could complete multiple cells in one go.',
  'vocab-builder': 'Eliminate answers you are certain are wrong first. Latin and Greek roots (-logy, -phile, -tion) narrow choices fast.',
  'abbreviations': 'Say each letter of the abbreviation aloud — the expanded form often sounds just like the initials spoken.',
  'dominoes': 'Place high doubles first — they are hardest to fit later. Build chains from both ends of the layout simultaneously.',
  'shikaku': 'Each number tells you the area of its rectangle. List every possible rectangle size that multiplies to that number.',
  'typeshift': 'Find the longest valid word first — it typically locks the most columns into fixed positions.',
  'word-morph': 'Change one letter at a time and check if a valid word appears. Move toward your target one sound at a time.',
  'emoji-story': 'Read the emoji sequence like a sentence. Common story arcs — character, journey, obstacle, resolution — help a lot.',
  'reversi': 'Edges and corners are permanent flips — prioritize taking corners. Avoid giving your opponent corner access.',
  'last-letter': 'Keep common letter endings in mind: -E, -T, -N, -S are very common. Steer away from rare endings like -X or -Q.',
  'speed-tap': 'Relax your hand and let your reflexes lead — tensing up slows your reaction. Tap the center of each target.',
  'number-maze': 'The target sum tells you which paths stay valid. Eliminate branches that would exceed the total too early.',
  'mirror-puzzle': 'Fold the grid mentally along the mirror axis. Every cell must be identical to its mirror counterpart.',
  'mahjong': 'Match tiles that are free on the left or right side and not covered on top. Match high-value tiles early.',
  'checkers': 'Keep pieces on the back row as long as possible — they prevent your opponent from kinging. Trade pieces wisely.',
  'masyu': 'Black circles turn 90° and go straight on both sides of the pearl. White circles go straight through the pearl.',
  'tapa': 'Tapa segments cannot touch each other diagonally or orthogonally. Work from cells where segments are forced.',
  'fillomino': 'Each numbered cell anchors a region of that exact size. Same-numbered regions can never touch each other.',
  'acrostic': 'Fill in answers you are most confident about first. The first letters of each answer spell the hidden quote.',
  'syllable-split': 'Place your hand under your chin and count the drops as you say the word — each drop is one syllable.',
  'word-parts': 'Many English words are built from Latin or Greek roots. Port = carry, Graph = write, Phon = sound.',
  'phonetic-spelling': 'Transcribe each sound you hear, not each letter you see. Phone has an F sound — /foʊn/ not P-H-O-N-E.',
  'emoji-sudoku': 'Treat each emoji as a number — every row, column, and box must contain each symbol exactly once.',
  'letter-drop': 'Watch the descent speed and plan your placement 2–3 tiles ahead of the current falling piece.',
  'word-maze': 'Navigate using only valid words. Longer words cover more ground — plan ahead to avoid dead ends.',
  'wordsmiths-duel': 'Balance speed and accuracy. A moment to think is faster than recovering from a wrong answer penalty.',
  'gravity-blocks': 'Create horizontal lines to clear them. Keep your stack flat and avoid building tall isolated columns.',
  'daily-challenge': 'Read all parts of the challenge before starting — some steps connect, and knowing the end helps you plan.',
};

// For each game entry, after `mvpPhase: N,` add `hint: '...',`
for (const [id, hint] of Object.entries(hints)) {
  // Find the block for this game id and add hint after mvpPhase
  // We'll do a targeted replacement near the id field
  const escapedHint = hint.replace(/'/g, "\\'");

  // Pattern: find `id: 'game-id',` ... `mvpPhase: N,\n  },`
  // and add hint field before the closing `},`
  const regex = new RegExp(
    `(id: '${id.replace(/-/g, '\\-')}',(?:(?!mvpPhase).)*mvpPhase: \\d+,)(\n  },)`,
    's'
  );

  if (content.match(regex)) {
    content = content.replace(regex, `$1\n    hint: '${escapedHint}',$2`);
  } else {
    console.warn(`Could not find game: ${id}`);
  }
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Done adding hints to all games');
