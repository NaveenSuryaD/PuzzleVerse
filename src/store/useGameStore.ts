import { create } from 'zustand';

interface GameSession {
  gameId: string;
  startTime: number;
  elapsedSeconds: number;
  hintsRemaining: number;
  isComplete: boolean;
  isGivenUp: boolean;
  gameSpecificState: unknown;
}

interface GameState {
  currentSession: GameSession | null;
  startGame: (gameId: string, initialState?: unknown) => void;
  endGame: (won: boolean) => void;
  useHint: () => void;
  tick: () => void;
  updateGameState: (state: unknown) => void;
}

export const useGameStore = create<GameState>()((set, get) => ({
  currentSession: null,
  startGame: (gameId, initialState = null) => set({
    currentSession: {
      gameId,
      startTime: Date.now(),
      elapsedSeconds: 0,
      hintsRemaining: 3,
      isComplete: false,
      isGivenUp: false,
      gameSpecificState: initialState,
    },
  }),
  endGame: (won) => set(state => ({
    currentSession: state.currentSession
      ? { ...state.currentSession, isComplete: true, isGivenUp: !won }
      : null,
  })),
  useHint: () => set(state => ({
    currentSession: state.currentSession
      ? { ...state.currentSession, hintsRemaining: Math.max(0, state.currentSession.hintsRemaining - 1) }
      : null,
  })),
  tick: () => set(state => ({
    currentSession: state.currentSession && !state.currentSession.isComplete
      ? { ...state.currentSession, elapsedSeconds: state.currentSession.elapsedSeconds + 1 }
      : state.currentSession,
  })),
  updateGameState: (gameState) => set(state => ({
    currentSession: state.currentSession
      ? { ...state.currentSession, gameSpecificState: gameState }
      : null,
  })),
}));
