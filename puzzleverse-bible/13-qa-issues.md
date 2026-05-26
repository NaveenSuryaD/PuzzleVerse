# PuzzleVerse QA Issues Log
Generated: 2026-05-24
Games tested: 78 (static code audit — simulator unavailable in this session)
Total issues found: 5 (all fixed)

---

## CRITICAL (crash or completely broken)
| # | Game | Issue | File | Notes |
|---|------|-------|------|-------|
| 1 | ALL | `useSaveGame` hook caused timer to never properly stop — intervals leaked on unmount | All 78 `*Game.tsx` files | **FIXED** — replaced with `useGameTimer` |
| 2 | ALL | App launched into last-visited game screen (Color Sort) instead of home | `app/_layout.tsx` | **FIXED** — added `unstable_settings = { initialRouteName: '(tabs)' }` |

---

## HIGH (wrong behavior, bad experience)
| # | Game | Issue | File | Notes |
|---|------|-------|------|-------|
| 3 | ALL | Timer kept running while How To Play / Hint modal was open | Shell + 78 game files | **FIXED** — added `paused` prop; shell passes `shellModalOpen`; each game has pause/resume `useEffect` |
| 4 | ALL | No resume modal — navigating away lost all game progress | All 78 `*Game.tsx` files | **FIXED** — added `usePersistentGameState` + `ResumeGameModal` to all games |
| 5 | Daily tab | Week strip checkmarks only tracked daily-mode completions, not casual play | `app/(tabs)/daily.tsx` | **FIXED** — uses `playedDates[]` array from progress store |

---

## MEDIUM (visual issue, minor logic bug)
| # | Game | Issue | File | Notes |
|---|------|-------|------|-------|
| — | — | None found via static audit | — | — |

---

## LOW (polish, cosmetic)
| # | Game | Issue | File | Notes |
|---|------|-------|------|-------|
| 6 | Privacy page | "June 2025" date in footer | `docs/privacy.html` | **FIXED** — updated to June 2026 |

---

## Fix Plan (completed)
1. ~~Timer architecture — replace `useSaveGame` with `useGameTimer` + `usePersistentGameState` in all 78 games~~ ✅
2. ~~Navigation state restoration — `unstable_settings` in `_layout.tsx`~~ ✅
3. ~~Timer pause on shell modals — `paused` prop bridge across all 78 games~~ ✅
4. ~~Resume modal — `ResumeGameModal` added to all 76 stateful games~~ ✅
5. ~~Daily tab checkmarks — use `playedDates[]`~~ ✅
6. ~~2025 reference in privacy page~~ ✅

---

## Static Audit Results
- `console.log` calls: **0**
- 2025 date references: **0**
- `savedStateJSON` props remaining: **0**
- `useSaveGame` calls remaining: **0**
- Games with `paused` prop: **78 / 78**
- TypeScript errors: **0**
