/**
 * Patches all MVP 8-15 game files to add onBack prop + Go Back button.
 * Only processes files that use the standard `style={s.modalBtn}` pattern.
 */
const fs = require('fs');
const path = require('path');

const gamesDir = path.join(__dirname, '../src/games');
const dirs = fs.readdirSync(gamesDir);

const GO_BACK_JSX = `            {onBack && (
              <TouchableOpacity
                style={[s.modalBtn, { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.rule, marginTop: 8 }]}
                onPress={onBack}
              >
                <Text style={[s.modalBtnText, { color: colors.inkSoft }]}>Go Back</Text>
              </TouchableOpacity>
            )}
            `;

let patched = 0;
let skipped = 0;

for (const dir of dirs) {
  const dirPath = path.join(gamesDir, dir);
  if (!fs.statSync(dirPath).isDirectory()) continue;

  const files = fs.readdirSync(dirPath).filter(f => f.endsWith('Game.tsx'));

  for (const file of files) {
    const filePath = path.join(dirPath, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // Skip if already patched
    if (content.includes('onBack')) {
      console.log(`SKIP (already patched): ${file}`);
      skipped++;
      continue;
    }

    // Only patch files with the standard modalBtn pattern
    if (!content.includes('style={s.modalBtn}')) {
      console.log(`SKIP (no standard modalBtn): ${file}`);
      skipped++;
      continue;
    }

    let modified = content;

    // 1. Add onBack to Props interface
    modified = modified.replace(
      '  onComplete: (won: boolean, timeSeconds: number) => void;\n}',
      '  onComplete: (won: boolean, timeSeconds: number) => void;\n  onBack?: () => void;\n}'
    );

    // 2. Update function signature destructuring
    modified = modified.replace(
      /\{ onComplete \}: Props\)/,
      '{ onComplete, onBack }: Props)'
    );

    // 3. Add Go Back button before the Play Again TouchableOpacity
    modified = modified.replace(
      '            <TouchableOpacity style={s.modalBtn} onPress={',
      GO_BACK_JSX + '<TouchableOpacity style={s.modalBtn} onPress={'
    );

    if (modified !== content) {
      fs.writeFileSync(filePath, modified, 'utf8');
      console.log(`PATCHED: ${file}`);
      patched++;
    } else {
      console.log(`NO CHANGE (pattern mismatch): ${file}`);
      skipped++;
    }
  }
}

console.log(`\nDone. Patched: ${patched}, Skipped: ${skipped}`);
