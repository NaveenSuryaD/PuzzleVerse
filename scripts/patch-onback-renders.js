/**
 * Adds onBack={() => router.back()} to all game renders in [gameId].tsx
 * Pattern: `onComplete={(won, t) => handleComplete(won, t)} />`
 *   → add `onBack={() => router.back()}` before the />
 * Also handles dailyComplete variant.
 */
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../app/game/[gameId].tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Pattern 1: onComplete={(won, t) => handleComplete(won, t)} />
content = content.replace(
  /onComplete=\{(\(won, t\) => handleComplete\(won, t\))\} \/>/g,
  'onComplete={$1} onBack={() => router.back()} />'
);

// Pattern 2: onComplete={(won, t) => handleDailyComplete(won, t, dailyDate)} />
content = content.replace(
  /onComplete=\{(\(won, t\) => handleDailyComplete\(won, t, dailyDate\))\} \/>/g,
  'onComplete={$1} onBack={() => router.back()} />'
);

// Pattern 3: onComplete={(won, t) => handleComplete(true, t, ...)} (sudoku variant)
content = content.replace(
  /onComplete=\{(\(_, t\) => isDailyGame \? handleDailyComplete\(true, t, dailyDate\) : handleComplete\(true, t\))\}/g,
  'onComplete={$1}'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Done patching renderGame with onBack');
