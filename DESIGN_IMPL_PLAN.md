# PuzzleVerse Design Implementation Plan

Design files are in `design/` folder (prototypes + assets). This plan is the step-by-step guide for
implementing the full warm cream/espresso visual overhaul from the design handoff.

---

## What's Changing

The old design used electric indigo (`#6C63FF`) and dark purple tones.
The new design uses warm cream/espresso (`#FBF6EE` / `#16110A`) with category-colored pastel tiles.

---

## Token Mapping (old → new)

| Old token | New token |
|---|---|
| `colors.bg.primary` | `colors.bg` |
| `colors.bg.secondary` | `colors.surface` |
| `colors.bg.tertiary` | `colors.rule` |
| `colors.bg.elevated` | `colors.surface2` |
| `colors.text.primary` | `colors.ink` |
| `colors.text.secondary` | `colors.inkSoft` |
| `colors.text.tertiary` | `colors.inkMuted` |
| `colors.text.inverse` | `colors.bg` |
| `colors.brand.primary` | `colors.ink` (or category color) |
| `colors.brand.gold` | `colors.logic.bg` (yellow) |
| `colors.border.subtle` | `colors.rule` |
| `colors.border.normal` | `colors.divider` |
| `colors.border.strong` | `colors.ink` |
| `colors.categories.word` | `colors.word.bg` / `colors.word.ink` |
| `colors.categories.number` | `colors.number.bg` / `colors.number.ink` |
| `colors.categories.logic` | `colors.logic.bg` / `colors.logic.ink` |
| `colors.categories.visual` | `colors.visual.bg` / `colors.visual.ink` |
| `colors.categories.classic` | `colors.classic.bg` / `colors.classic.ink` |
| `colors.error` | `colors.danger` |
| `colors.success` | `colors.success` (same) |

---

## Files to Change (in order)

### 1. `src/theme/colors.ts` — COMPLETE REWRITE

New exports `dark` and `light` using PV_DARK / PV_LIGHT token shapes:

```typescript
export const light = {
  bg:       '#FBF6EE',
  surface:  '#FFFFFF',
  ink:      '#1E1A14',
  inkSoft:  '#5A5247',
  inkMuted: '#9A9183',
  divider:  '#EDE5D6',
  rule:     '#F3ECDD',
  cellHi:   '#FCF7E4',
  surface2: '#F3ECDD',
  word:    { bg: '#FFE0CC', ink: '#7A3A12', soft: '#FFD2B5', accent: '#FFE0CC' },
  number:  { bg: '#D8ECD4', ink: '#27502F', soft: '#C3E0BD', accent: '#D8ECD4' },
  logic:   { bg: '#FFEDB8', ink: '#6B4B08', soft: '#FFE49C', accent: '#FFEDB8' },
  visual:  { bg: '#E3D8FF', ink: '#382673', soft: '#D2C2FF', accent: '#E3D8FF' },
  classic: { bg: '#CFE3F5', ink: '#1F4263', soft: '#B9D5EF', accent: '#CFE3F5' },
  success: '#3A8A4A',
  danger:  '#C0432F',
};

export const dark = {
  bg:       '#16110A',
  surface:  '#221C13',
  ink:      '#FBF6EE',
  inkSoft:  '#CFC6B3',
  inkMuted: '#857B6C',
  divider:  '#2D2619',
  rule:     '#2A2418',
  cellHi:   '#2E2718',
  surface2: '#1D170F',
  word:    { bg: '#3E2417', ink: '#FFD2B5', soft: '#52301E', accent: '#FFD2B5' },
  number:  { bg: '#1F3927', ink: '#C3E0BD', soft: '#2A4A33', accent: '#C3E0BD' },
  logic:   { bg: '#3A2E0E', ink: '#FFE49C', soft: '#4D3D14', accent: '#FFE49C' },
  visual:  { bg: '#251E48', ink: '#D2C2FF', soft: '#332961', accent: '#D2C2FF' },
  classic: { bg: '#142E48', ink: '#B9D5EF', soft: '#1D3F60', accent: '#B9D5EF' },
  success: '#6FB47F',
  danger:  '#E37863',
};

export type ColorScheme = typeof dark;
```

### 2. `src/theme/useTheme.ts` — UPDATE TYPE

Change the `ThemeColors` type export:
```typescript
export type ThemeColors = typeof dark;  // now points to new shape
```
Theme detection in game files: `colors.bg === '#16110A'` → isDark.

### 3. `app/(tabs)/_layout.tsx` — FLOATING TAB BAR

Replace standard tab bar with floating pill:
```typescript
tabBarStyle: {
  position: 'absolute',
  bottom: 18,
  left: 14,
  right: 14,
  borderRadius: 28,
  height: 62,
  paddingBottom: 4,
  paddingTop: 4,
  backgroundColor: colors.surface,
  borderTopWidth: 0,
  elevation: 8,
  shadowColor: colors.ink,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.08,
  shadowRadius: 16,
},
tabBarActiveTintColor: colors.ink,
tabBarInactiveTintColor: colors.inkMuted,
// Active tab item gets bg pill via tabBarItemStyle trick or custom TabBar
```

**Note:** Expo Router doesn't natively support a bg pill on the active tab.
Use `tabBarLabelStyle` + `tabBarItemStyle` to simulate. A custom `tabBarButton` 
per screen can wrap in a pill. See example in pv-shared.jsx `PVAtoms.TabBar`.

Alternatively use the `tabBarBackground` prop with a fully custom component.

All child screens need `paddingBottom: 110` on their scroll content container.

### 4. `app/(tabs)/index.tsx` — HOME SCREEN REWRITE

Match `design/prototypes/pv-home.jsx`. Key sections:

**Header (padding 64px top, 22px sides):**
- Left: `Good morning` (14px/600/inkMuted) + name (26px/900/ink)
- Right: streak pill (40px high, surface bg, flame icon + count) + search button (40px circle)

**Hero card (`colors.word.bg` bg, borderRadius 28):**
- Decorative blobs: two circles using `colors.word.soft`
- Eyebrow: "Today's Puzzle" with 6px dot
- Title: 30px/900/word.ink (game name)
- Play button: `colors.ink` bg pill with play icon

**Category pills (ScrollView horizontal):**
- All: active = `colors.ink` bg, `colors.bg` text; inactive = `colors.surface` bg, `colors.inkSoft` text
- Others: dot showing category color (e.g. `colors.word.bg`)

**Continue card (surface bg, 22px radius):**
- 48px glyph well (category bg)
- Progress bar using category ink color
- Chevron right

**All puzzles grid (2 columns, 12px gap):**
- Each tile: surface bg, 26px radius, 168px min height
- 56px glyph well (category bg, 18px radius)
- NEW badge: ink bg, 10px/800 uppercase
- Streak row with flame icon

### 5. `app/(tabs)/daily.tsx` — DAILY SCREEN REWRITE

Match `design/prototypes/pv-daily.jsx`. Key sections:

**Header:** date eyebrow + "Daily Challenges" title

**Countdown card (surface bg, 16px radius):**
- Clock icon + "New puzzles in" + `04:32:18` (tabular-nums, 18px/900)

**Week strip (surface bg, 22px radius, 14px sides):**
- 7 columns (Mon–Sun)
- done: `colors.number.bg` circle + check icon in `colors.number.ink`
- today: `colors.ink` bg + date number in `colors.bg`
- locked: `colors.rule` bg + center dot

**Today's set header + count**

**Challenge cards (surface bg, 22px radius):**
- 54px glyph well
- done overlay: green bg + check
- state pill/button: done="Done" border success, playing=ink bg "Resume", todo=bg "Start"
- Difficulty badge: category.bg bg, category.ink text, 10px/800 uppercase

### 6. `app/(tabs)/stats.tsx` — STATS SCREEN REWRITE

Match `design/prototypes/pv-stats.jsx`. Key sections:

**4 stat tiles (flex row):**
- Each: surface bg, 20px radius, 32px icon well (category bg), 22px/900 value, 11px/700 label

**Activity chart (surface bg, 22px radius):**
- 7 bars, today's bar = ink bg, others = logic.bg
- Day labels below

**Per-game list:**
- surface bg rows, 38px glyph wells, streak flame

**Achievements horizontal scroller:**
- 104px cards, surface bg, 48px circle (category.bg if earned, rule if locked)
- locked = 55% opacity + grayscale

### 7. `app/(tabs)/settings.tsx` — SETTINGS SCREEN REWRITE

Match `design/prototypes/pv-settings.jsx`. Key sections:

**Profile card:** 54px circle avatar, name + level sub

**Appearance group:**
- Theme: segmented control (3-way pill: Light/Dark/System) using `colors.bg` wrapper, `colors.surface` active pill
- Accent color: row of 6 colored dots, selected = ring with ink + surface double border

**Gameplay group:**
- Custom toggle component (46×28 pill, thumb 22px):
  - on: `colors.ink` track, `colors.surface` thumb
  - off: `colors.rule` track
- Sound effects, Haptic feedback, Show timer (on), Animations/Reduced motion (off)

**About group:** chevron rows

**Custom Toggle component:**
```typescript
function Toggle({ on }: { on: boolean }) {
  return (
    <View style={{ width: 46, height: 28, borderRadius: 99, padding: 3,
      backgroundColor: on ? colors.ink : colors.rule }}>
      <View style={{ width: 22, height: 22, borderRadius: 99,
        backgroundColor: colors.surface,
        transform: [{ translateX: on ? 18 : 0 }] }} />
    </View>
  );
}
```

### 8. `src/components/GameCard.tsx` — UPDATE TOKENS

Apply new token names:
- `colors.bg.secondary` → `colors.surface`
- `colors.border.subtle` → `colors.rule`
- `colors.text.primary` → `colors.ink`
- `colors.text.secondary` → `colors.inkSoft`
- `colors.text.tertiary` → `colors.inkMuted`
- Category color: `colors[game.category].bg` for glyph well, `colors[game.category].ink` for glyph
- NEW badge: `colors.ink` bg, `colors.bg` text
- Streak row: flame icon + text

Design-wise match `HomeGameTile` in `pv-home.jsx`:
- 56px glyph well, 18px radius
- Card height: 168px min
- NEW badge: absolute top-right

### 9. `src/games/sudoku/SudokuGame.tsx` — UPDATE TOKENS

Key changes:
- Background: `colors.bg`
- Surface/cards: `colors.surface`
- Text: `colors.ink`, `colors.inkSoft`, `colors.inkMuted`
- Grid outer border: `colors.ink`
- Cell thin border: `colors.divider`
- Box border: `colors.ink` (2px)
- Cell backgrounds:
  - selected: `colors.logic.bg`
  - error: `colors.danger + '30'`
  - sameNumber: `colors.logic.soft`
  - sameGroup: `colors.cellHi`
  - given: `colors.bg`
  - default: `colors.surface`
- Cell text:
  - given: `colors.ink`
  - user: `colors.logic.ink`
  - error: `colors.danger`
  - selected: `colors.logic.ink`
- Number pad: `colors.surface` bg, `colors.divider` border
- Highlighted number: `colors.logic.bg` bg, `colors.logic.ink` text
- Done number: opacity 0.45
- Action buttons: `colors.surface` bg, pencil active = `colors.logic.bg` bg
- Difficulty pills: active = `colors.ink` bg, `colors.bg` text

### 10. `src/games/wordguess/GuessTile.tsx` — UPDATE TOKENS

```typescript
const isThemeDark = (colors: ThemeColors) => colors.bg === '#16110A';

const getTileBackground = (state, colors) => {
  switch (state) {
    case 'correct': return colors.success;
    case 'present': return colors.logic.bg;    // yellow — logic category
    case 'absent':  return isThemeDark(colors) ? '#3A2E22' : '#C0B8AD';
    default:        return colors.surface;
  }
};

const getTileBorder = (state, hasLetter, colors) => {
  if (state === 'tbd' && hasLetter) return colors.divider;
  if (state === 'empty') return colors.rule;
  return 'transparent';
};

const getTileTextColor = (state, colors) => {
  if (state === 'present') return colors.logic.ink;
  if (state === 'correct') return isThemeDark(colors) ? colors.bg : '#FFFFFF';
  return colors.ink;
};
```

### 11. `src/games/wordguess/WordKeyboard.tsx` — UPDATE TOKENS

Same pattern as GuessTile:
```typescript
const isThemeDark = (colors) => colors.bg === '#16110A';

const getKeyBackground = (state, colors) => {
  switch (state) {
    case 'correct': return colors.success;
    case 'present': return colors.logic.bg;
    case 'absent':  return isThemeDark(colors) ? '#3A2E22' : '#C0B8AD';
    default:        return colors.surface;
  }
};

const getKeyTextColor = (state, colors) => {
  if (state === 'present') return colors.logic.ink;
  if (state === 'correct') return isThemeDark(colors) ? colors.bg : '#FFFFFF';
  return colors.ink;
};
// Special keys (ENTER/⌫): colors.surface2 bg, colors.ink text
```

### 12. `app/_layout.tsx` — STATUS BAR UPDATE

Change `<StatusBar style="light" />` to `<StatusBar style="auto" />` so it adapts to the theme.

### 13. `src/games/wordguess/WordGuessGame.tsx` — TOKEN UPDATES

Update any remaining hardcoded color references to use new tokens.

### 14. `src/games/wordguess/GuessGrid.tsx` — TOKEN UPDATES

Check for any color references.

---

## Implementation Order

1. `src/theme/colors.ts` — foundation, everything depends on this
2. `src/theme/useTheme.ts` — type update
3. `app/(tabs)/_layout.tsx` — floating tab bar
4. `app/(tabs)/index.tsx` — home screen
5. `app/(tabs)/daily.tsx` — daily screen
6. `app/(tabs)/stats.tsx` — stats screen
7. `app/(tabs)/settings.tsx` — settings screen
8. `src/components/GameCard.tsx` — card component
9. `src/games/sudoku/SudokuGame.tsx` — sudoku game
10. `src/games/wordguess/GuessTile.tsx` — word guess tiles
11. `src/games/wordguess/WordKeyboard.tsx` — keyboard
12. `src/games/wordguess/WordGuessGame.tsx` — word guess game
13. `src/games/wordguess/GuessGrid.tsx` — guess grid
14. `app/_layout.tsx` — root layout / status bar

---

## Key Notes

- All screens need `paddingBottom: 110` at scroll content bottom (floating tab bar is 62px high + 18px bottom + 18px breathing room = ~98px)
- Use `useMemo(() => makeStyles(colors), [colors])` in EVERY component
- Dark mode detection: `colors.bg === '#16110A'`
- No `colors.brand.*` exists anymore — use `colors.ink` as the primary action color, or specific category colors
- No `colors.bg.primary` — just `colors.bg`
- The `sudoku` game is in the `number` category (game grid logic), but visually uses `logic` category colors (yellow) — this is intentional per the design
- Actually in games.ts, Sudoku is `category: 'number'`. But the design prototype uses `logic` colors (yellow grid). Use `colors.logic.*` in SudokuGame for consistency with pv-game.jsx prototype.

---

## Design References

All prototype files are at `design/prototypes/`:
- `pv-shared.jsx` — tokens, icons, atoms (TabBar, Card, ScreenShell)
- `pv-home.jsx` — home screen
- `pv-daily.jsx` — daily screen
- `pv-stats.jsx` — stats screen
- `pv-settings.jsx` — settings screen
- `pv-game.jsx` — in-game screen (Sudoku)
- `pv-complete.jsx` — puzzle complete screen
- `pv-splash.jsx` — splash screen
- `pv-search.jsx` — search overlay

All SVG assets are at `design/assets/`:
- `brand/` — app-icon.svg, wordmark.svg, splash.svg
- `icons/` — all tab and action icons as SVG

---

## Gotchas

1. **`app/(tabs)` screens currently use `colors.bg.primary` etc. EVERYWHERE.** After changing colors.ts, the app will have TypeScript errors all over. Fix files in order listed above.

2. **`GameCard.tsx` calls `colors.categories[game.category]`** — this no longer exists. Change to `colors[game.category].bg`.

3. **GuessTile uses `colors.brand.gold`** for present state — replace with `colors.logic.bg`.

4. **SudokuGame uses `colors.brand.primary`** for selected cell, number highlights — replace with `colors.logic.ink`/`colors.logic.bg`.

5. **Settings uses `<Switch>` with `trackColor={{ false: colors.bg.elevated, true: colors.brand.primary }}`** — replace with custom Toggle component matching design.

6. **Tab bar needs `tabBarIcon` custom SVG renderers** matching Ico.home/daily/stats/settings from pv-shared.jsx. The design has custom filled/outline SVG icons, not Ionicons.

7. **The floating tab bar in Expo Router**: set `tabBarStyle.position: 'absolute'` and ensure all screens have `paddingBottom: 110` on their `contentContainerStyle`.
