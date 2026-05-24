export interface HanoiState {
  pegs: number[][];  // each peg is a stack of disc sizes (largest at bottom)
  discCount: number;
  moves: number;
}
