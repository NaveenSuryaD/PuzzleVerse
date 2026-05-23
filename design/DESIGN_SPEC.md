# PuzzleVerse — Design Handoff

## Overview

PuzzleVerse is a solo-developer mobile puzzle game app — 100+ short single-player puzzles, daily challenges, stats, and no ads. This handoff covers the full UI: 8 screens, the design system, and every brand/icon asset.

This is a **fresh app from scratch**, no existing codebase to inherit from. The original brief (in `_source/04-screens.md`) suggested a dark indigo direction; the user redirected toward "pure clean and most friendly" so the system here is warm cream + soft pastels + Nunito.

## About the design files

The HTML files in `prototypes/` are **design references created in HTML** — interactive mockups showing the intended look and behavior. **They are not production code to ship.** Your job is to recreate these in the target codebase using whatever framework you (and the user) settle on.

Suggested implementation stacks for a mobile puzzle app:
- **Expo + React Native + Reanimated** (cross-platform, the README in `_source/README.md` originally assumed this)
- **SwiftUI** (iOS-only, native polish)
- **Flutter** (cross-platform, single codebase)

Use the codebase's idiomatic patterns. Don't port React DOM + inline-style JSX as-is — re-implement using your framework's primitives (e.g. `View`/`Text`/`Pressable` for RN, `VStack`/`HStack` for SwiftUI).

## Fidelity

**High-fidelity.** All colors, type sizes, weights, spacings, radii, and shadows are final. Pixel-match the prototypes, then adapt only where platform conventions clearly require it (e.g. iOS native status bar height, Android back-gesture region).

## Light + dark mode

Every screen ships in both modes. Both palettes share the same token shape (`bg`, `surface`, `ink`, `ink-soft`, `ink-muted`, `divider`, `rule`, `success`, `danger`, and a `{bg, ink, soft, accent}` object per game category). Choose mode by system preference by default, with an override in Settings → Theme.

Design notes for dark:
- Background is a warm **espresso**, not pure black. The whole point of the design is warmth — pure black would undo that.
- Each category tile becomes a deep saturated well, with the bright pastel as the **text/glyph color on top**. This inverts the role of `tile bg` and `text on tile` between modes — the token shape stays identical, only values swap.
- Decorative blobs / confetti / splash quartet use a dedicated `category.accent` token that is **the bright pastel in both modes** (= tile bg in light, = ink in dark). Use this whenever a category color appears OUTSIDE a tile.

---

## Design system

### Colors

#### Light mode

| Token | Hex | Use |
|---|---|---|
| `bg` | `#FBF6EE` | Page canvas (warm cream) |
| `surface` | `#FFFFFF` | Cards, sheets, list rows |
| `ink` | `#1E1A14` | Primary text, primary buttons, filled icons |
| `ink-soft` | `#5A5247` | Secondary text, inactive controls |
| `ink-muted` | `#9A9183` | Tertiary text, captions, placeholder |
| `divider` | `#EDE5D6` | Subtle dividers |
| `rule` | `#F3ECDD` | Soft inner rules / inactive pill backgrounds |
| `success` | `#3A8A4A` | Completion states |
| `danger` | `#C0432F` | Errors, "give up" |
| `streak` | `#E26A2C` | Flame icon (same in both modes) |

| Category | `bg` (tile) | `ink` (on-tile text) | `soft` (inner deco) | `accent` (outside tile) |
|---|---|---|---|---|
| Word    | `#FFE0CC` | `#7A3A12` | `#FFD2B5` | `#FFE0CC` |
| Number  | `#D8ECD4` | `#27502F` | `#C3E0BD` | `#D8ECD4` |
| Logic   | `#FFEDB8` | `#6B4B08` | `#FFE49C` | `#FFEDB8` |
| Visual  | `#E3D8FF` | `#382673` | `#D2C2FF` | `#E3D8FF` |
| Classic | `#CFE3F5` | `#1F4263` | `#B9D5EF` | `#CFE3F5` |

#### Dark mode

| Token | Hex | Use |
|---|---|---|
| `bg` | `#16110A` | Page canvas (warm espresso) |
| `surface` | `#221C13` | Cards, sheets, list rows |
| `ink` | `#FBF6EE` | Primary text (now cream) |
| `ink-soft` | `#CFC6B3` | Secondary text |
| `ink-muted` | `#857B6C` | Tertiary text |
| `divider` | `#2D2619` | Subtle dividers |
| `rule` | `#2A2418` | Soft inner rules |
| `success` | `#6FB47F` | Brighter for dark contrast |
| `danger` | `#E37863` | Brighter for dark contrast |

| Category | `bg` (deep well) | `ink` (bright pastel) | `soft` (inner deco) | `accent` (outside tile) |
|---|---|---|---|---|
| Word    | `#3E2417` | `#FFD2B5` | `#52301E` | `#FFD2B5` |
| Number  | `#1F3927` | `#C3E0BD` | `#2A4A33` | `#C3E0BD` |
| Logic   | `#3A2E0E` | `#FFE49C` | `#4D3D14` | `#FFE49C` |
| Visual  | `#251E48` | `#D2C2FF` | `#332961` | `#D2C2FF` |
| Classic | `#142E48` | `#B9D5EF` | `#1D3F60` | `#B9D5EF` |

The two palettes share the exact same token shape — you can wire them via a single theme switch (CSS variables, React context, `@react-navigation/native`'s theme, etc.) without any per-screen branching.

### Typography

Single typeface across the app: **Nunito** (Google Fonts, weights 400/500/600/700/800/900). The font is friendly and round — that warmth is the whole point. Do not substitute Inter/Roboto/system.

| Role | Size | Weight | Tracking |
|---|---|---|---|
| Screen title (Daily Challenges, Stats…) | 30 | 900 | −0.8 |
| H1 (greeting name) | 26 | 900 | −0.5 |
| H2 (section header) | 20 | 900 | −0.4 |
| Tile title | 17 | 800 | 0 |
| Row label / button | 15 | 700/800 | 0 |
| Body | 14 | 600 | 0 |
| Secondary | 13 | 600 | 0 |
| Eyebrow (UPPERCASE) | 12 | 800 | 0.6 |
| Badge | 11 | 800 | 0 |

Numbers in board/stats positions use `font-variant-numeric: tabular-nums` for stable widths.

### Radii, shadows, spacing

- **Radii:** `sm 12 · md 16 · lg 22 · xl 26 · pill 999`
- **Card shadow:** `0 1px 0 rgba(30,26,20,.03), 0 4px 12px rgba(30,26,20,.05)`
- **Lifted card shadow:** `0 1px 0 rgba(30,26,20,.03), 0 6px 14px rgba(30,26,20,.05)`
- **Floating tab bar shadow:** `0 4px 16px rgba(30,26,20,.08)`
- **Spacing scale:** `4 · 8 · 10 · 12 · 14 · 16 · 18 · 22 · 28`
- **Screen padding:** 22px horizontal, 64px top (status-bar safe), 110px bottom (tab-bar safe area)

### Iconography rules

- Line icons: 24×24 viewBox, 2px stroke, rounded caps + joins, `currentColor`
- Filled icons: `fill="currentColor"`, no stroke
- Tab bar uses paired filled (active) / outline (inactive) icons
- Category glyphs sit inside a tinted "well" (square with the category tile color, 18–24px radius) and use the category ink color

---

## Screens

All screens share a 390×844 (iPhone 14/15) frame and the same warm cream background. Each screen below maps to a prototype file in `prototypes/`.

### 1. Splash (`pv-splash.jsx`)

Centered wordmark over the cream canvas with 4 soft decorative shapes (one per category) in the corners. Shows for 1.5s.

- **Logo:** Dark rounded-square icon (`assets/brand/app-icon.svg` at 108×108) above the wordmark
- **Tagline:** "Every puzzle. Unlimited." — 15px / 600 / ink-soft
- **Loader:** 3 dots, middle one solid, others 30% opacity, pulse animation
- **Animation:** Logo fades in (500ms ease-out), tagline 300ms later (400ms ease-out), dots at 800ms; after 1500ms total, navigate to Home

### 2. Home (`pv-home.jsx`)

Greeting header → today's puzzle hero → category pills → continue-playing card → 2-column game grid → floating tab bar.

- **Header:** "Good morning" eyebrow + "Sam" H1; right side has a streak pill (flame + count) and a circular search button
- **Today's puzzle card:** Full-width 28px radius card in `category.word` tile color, with two soft decorative shapes (circle top-right, rotated square bottom-right). Eyebrow + "Crossword Mini" 30/900 title + meta + community avatars + dark CTA pill ("Play")
- **Category pills:** Horizontal scroll, "All / Word / Number / Logic / Visual / Classic". Active = ink bg / cream text. Inactive = surface bg / ink-soft text, with a small color dot
- **Continue card:** White rounded card with category-color glyph well + game name + progress text + 5px-tall progress bar
- **Game grid:** 2-column, 12px gap, ~168px min height per tile. Each tile: 56×56 glyph well at top, title + blurb at bottom, optional streak row (flame + days) and "NEW" badge top-right
- **Tab bar:** Floating at bottom (14px from edge, 18px from bottom), 28px radius, drop shadow. Active tab has a cream-filled pill background; icon goes filled

### 3. Daily (`pv-daily.jsx`)

Date header → countdown timer card → 7-day week strip → today's challenge list.

- **Header:** "Thursday, May 22" eyebrow + "Daily Challenges" 30/900 title
- **Countdown:** White card with clock icon + "New puzzles in" + monospaced timer "04:32:18"
- **Week strip:** White card with 7 columns (Mon–Sun). Days are 32px circles: done = number-bg with green check; today = ink with cream date number; future = rule bg with muted dot
- **Today's set:** Section title + "X of 5 done" caption
- **Challenge cards:** Per-game card with category glyph well, game name, diff pill + duration + streak meta, right-aligned action button (state-dependent):
  - `done` — outlined green pill "Done", whole card 60% opacity, glyph well overlaid with semi-transparent success-green + white check
  - `playing` — ink pill "Resume" with play icon
  - `todo` — cream pill "Start" in ink

### 4. Stats (`pv-stats.jsx`)

4-up stat overview → weekly bar chart → per-game list → achievement scroller.

- **Header:** "Your progress" eyebrow + "Stats" 30/900 title
- **4-stat row:** 4 equal-width cards. Each: small icon in a colored 32px square (one per category), big 22/900 value, eyebrow label. Stats: Streak (flame), Solved (trophy), Accuracy (%), Avg (clock)
- **Activity card:** White rounded card, title + "32 solved" right-aligned. 7 bars, 80px tall, last bar in ink (today), rest in `category.logic` tile color. Day labels below
- **By-game list:** Compact rows — small glyph well, game name + meta ("48 games · best 2:34"), optional streak chip on right, chevron
- **Achievements:** Horizontal scroller of 104px cards. Each: 48px circle (category-tinted if earned, gray if locked) with trophy or "?", title below. Locked cards 55% opacity

### 5. Settings (`pv-settings.jsx`)

Profile card → grouped settings sections (Appearance / Gameplay / About).

- **Header:** "Customize your app" eyebrow + "Settings" 30/900 title
- **Profile card:** Avatar (initial in a `category.logic` circle), name, "Playing since … · Level 7", chevron
- **Section pattern:** Uppercase eyebrow label outside the card, then a single white card with rows separated by 1px `rule` lines
- **Controls:**
  - **Toggle:** 46×28 pill, ink when on, rule when off; 22×22 white knob slides 18px
  - **Segmented control:** Bg-colored pill background, active segment has white surface + soft shadow
  - **Color picker:** 6 small circles in a row, selected has a 2.5px ink ring + 4.5px white separation ring
- **Sections:** Appearance (Theme, Accent), Gameplay (Sound effects, Haptic, Show timer, Animations), About (Rate, Share, Privacy, Version)

### 6. Game — Sudoku (`pv-game.jsx`)

Back button + game title + timer + more menu → stats strip → 9×9 board → 1–9 number pad → tool row.

- **Header:** Three circular 40px white buttons (back, more) flanking a centered title ("Sudoku" / "Medium · #042") and a timer pill ("clock icon + 04:12")
- **Stats strip:** White card with 3 columns: Mistakes (1), Hints (2/3), Progress (46%, in logic ink)
- **Board:** 9×9 grid, 38px cells, white cells with thin divider lines, **2px ink lines** at the 3×3 box boundaries. Selected cell: `category.logic` tile bg. Same row/col/box highlight: `#FCF7E4`. Given numbers: ink 800. User numbers: logic-ink 700
- **Number pad:** 9 columns, each cell 44px tall, white card with soft shadow, 20/800 number
- **Tool row:** 4 equal cards: Undo, Notes (with "on" badge), Hint (with "3" badge), Erase. Each has icon + 11px label

### 7. Puzzle Complete (`pv-complete.jsx`)

Faded completed board behind + confetti dots → bottom sheet with trophy + stats + actions.

- **Background:** The completed 9×9 board, smaller (26px cells), 40% opacity, slight blur. 7 confetti shapes (mix of category colors, rounded squares and circles) scattered around the screen
- **Sheet:** Surface-color, 32px top corners, drop shadow upward. 38×5 drag handle at top
- **Header:** Trophy hovers above the sheet — 64px logic-tinted circle with trophy icon, 8px cream ring around it. "Solved!" 28/900 + "Sudoku Medium · #042" subtitle
- **Stat tiles:** 3 equal pastel cards (word / number / logic tiles): Time (7:24), Accuracy (94%), Streak (13d with flame icon). Each card: 18px radius, 20/900 value in category ink, 11px uppercase label
- **PB banner:** Cream-colored row with success-green check circle, "New personal best", "−0:48 vs last" on right
- **Action row:** Three buttons — square Share (cream bg, share icon), outlined "Play Again" (rule border), filled "Next Puzzle →" (ink/cream, takes the most width)

### 8. Search (`pv-search.jsx`)

Full-screen overlay with a search bar, recent chips, trending pills, and live-filtered results.

- **Header:** Pill-shaped search input (search icon + query text + blinking caret + clear×) with "Cancel" link beside it
- **Recent chips:** White pills with clock icon prefix, 8px gap
- **Trending pills:** Outlined (1.5px rule border) cream-bg pills
- **Results:** Per-row card — glyph well + name (with the matched query substring **highlighted with `category.logic` background**) + blurb + chevron

---

## Interactions & behavior

- **Navigation:** 4 bottom tabs (Home / Daily / Stats / Settings) + modal sheets for Game, Game Complete, and Search
- **Game state:** Auto-save on every tap; show progress (filled cells / 81) in the Home "continue" card
- **Timer:** Counts up from 0:00; pauses on background; can be hidden via Settings → Show timer
- **Hint flow:** Tap hint → decrement counter → reveal one correct cell value with a brief pulse
- **Win flow:** All cells correct → light haptic + confetti burst (CSS or `react-native-confetti-cannon` equivalent) → Complete sheet slides up
- **Streak logic:** Daily — completing any daily challenge before midnight extends the streak. Per-game — winning consecutive days extends per-game streak
- **Empty/error/loading states:** Not designed yet — use the same warm-cream + line-icon + soft-illustration treatment when you add them

---

## State management

Keep it minimal — most state is local to a screen.

- **Per-game state:** board contents, given vs user values, selected cell, mistakes count, hints used, elapsed time, notes mode on/off
- **App-wide state:** user profile (name, level), per-game stats (played, best time, streak), daily progress, settings (theme, sound, haptic, etc.)
- **Persistence:** AsyncStorage / UserDefaults / Hive — whichever fits your stack
- **No backend** in v1; everything local. Daily challenges are seeded deterministically by date so all users get the same puzzle on the same day

---

## Assets

All assets live under `assets/`:

```
assets/
├── brand/
│   ├── app-icon.svg              1024×1024 — light app icon
│   ├── app-icon-dark.svg         1024×1024 — dark app icon (cream silhouette + dark interior)
│   ├── wordmark.svg              720×160   — primary lockup (light)
│   ├── wordmark-dark.svg         720×160   — primary lockup (dark)
│   ├── wordmark-mono.svg         720×160   — single-color variant
│   ├── splash.svg                1242×2688 — light splash
│   ├── splash-dark.svg           1242×2688 — dark splash
│   ├── marketing-banner.svg      1600×900  — light feature graphic
│   ├── marketing-banner-dark.svg 1600×900  — dark feature graphic
│   └── in-app-banner.svg         1200×400  — promo card (today's puzzle pattern)
└── icons/
    ├── search.svg, chevron-left.svg, chevron-right.svg, play.svg,
    ├── check.svg, close.svg, more.svg, hint.svg, flag.svg, undo.svg,
    ├── trophy.svg, share.svg, clock.svg, flame.svg, pencil.svg, erase.svg
    ├── tab-{home,daily,stats,settings}-{filled,outline}.svg
    └── glyph-{word,number,logic,visual,classic,dots}.svg
```

All icons use `currentColor` so they pick up the surrounding text color — they work in both light and dark mode automatically. The `flame` icon has its own brand color (`#E26A2C`) that stays consistent in both modes.

For platform icons (iOS .icns, Android adaptive icons), generate from `app-icon.svg` using your build tooling (Xcode asset catalog, `react-native-make`, `flutter_launcher_icons`, etc.).

---

## Files in this handoff

```
design_handoff_puzzleverse/
├── README.md                         (this file)
├── prototypes/
│   ├── PuzzleVerse Home.html         single-screen, focused view
│   ├── PuzzleVerse All Screens.html  pan/zoom canvas with all 8 screens side-by-side
│   ├── PuzzleVerse Assets.html       icon/brand/token reference page
│   ├── *.jsx                         React component sources for each screen
│   ├── ios-frame.jsx                 iPhone device bezel (presentation only — drop when shipping)
│   ├── design-canvas.jsx             multi-screen layout helper (presentation only — drop when shipping)
│   └── all-screens-app.jsx           composes the canvas
├── assets/                           SVGs ready to drop into the codebase
│   ├── brand/
│   └── icons/
└── _source/                          original brief from the user
    ├── README.md
    └── 04-screens.md
```

Open `prototypes/PuzzleVerse All Screens.html` in a browser to see every screen at once. Open `prototypes/PuzzleVerse Assets.html` for the asset/token reference.

## A note on Nunito

The font *is* the warmth. If you swap it for Inter or system-ui, the whole design will feel cold and generic. Bundle Nunito as a custom font in the app (Expo: `expo-font` + `useFonts`; SwiftUI: drop .ttf files in the bundle and register via `Info.plist → UIAppFonts`).
