// 5x5 pipe puzzles - each cell has base connections and an initial rotation offset
// Connection types: 'L'=elbow(2 sides), 'I'=straight(2 sides), 'T'=tee(3 sides), '+' = cross(4), 'E'=end(1)
// Solved rotations are 0 (already correct). Initial rotations are randomized.

export interface RawCell {
  type: 'L' | 'I' | 'T' | '+' | 'E';
  solvedRotation: number; // 0-3
}

// Each puzzle is a 5x5 grid of raw cells with their solution rotation
export const PIPE_PUZZLES: RawCell[][][] = [
  // Puzzle 1
  [
    [{ type: 'E', solvedRotation: 2 }, { type: 'I', solvedRotation: 1 }, { type: 'L', solvedRotation: 0 }, { type: 'I', solvedRotation: 0 }, { type: 'L', solvedRotation: 1 }],
    [{ type: 'I', solvedRotation: 0 }, { type: 'T', solvedRotation: 1 }, { type: 'L', solvedRotation: 3 }, { type: 'I', solvedRotation: 0 }, { type: 'I', solvedRotation: 0 }],
    [{ type: 'L', solvedRotation: 0 }, { type: 'L', solvedRotation: 1 }, { type: 'T', solvedRotation: 2 }, { type: 'L', solvedRotation: 2 }, { type: 'L', solvedRotation: 3 }],
    [{ type: 'I', solvedRotation: 0 }, { type: 'I', solvedRotation: 0 }, { type: 'I', solvedRotation: 0 }, { type: 'T', solvedRotation: 3 }, { type: 'I', solvedRotation: 0 }],
    [{ type: 'L', solvedRotation: 1 }, { type: 'I', solvedRotation: 1 }, { type: 'I', solvedRotation: 1 }, { type: 'L', solvedRotation: 2 }, { type: 'E', solvedRotation: 0 }],
  ],
];

// Directions for each type at rotation 0
export const BASE_CONNECTIONS: Record<string, ('N'|'E'|'S'|'W')[]> = {
  'E': ['N'],
  'I': ['N', 'S'],
  'L': ['N', 'E'],
  'T': ['N', 'E', 'S'],
  '+': ['N', 'E', 'S', 'W'],
};

const ALL_DIRS: ('N'|'E'|'S'|'W')[] = ['N', 'E', 'S', 'W'];

export function getConnections(type: string, rotation: number): ('N'|'E'|'S'|'W')[] {
  const base = BASE_CONNECTIONS[type] ?? [];
  return base.map(d => {
    const idx = ALL_DIRS.indexOf(d);
    return ALL_DIRS[(idx + rotation) % 4];
  });
}
