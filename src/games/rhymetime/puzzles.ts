export interface RhymeRound {
  target: string;
  options: Array<{ word: string; rhymes: boolean }>;
}

export const RHYME_ROUNDS: RhymeRound[] = [
  { target: 'CAT', options: [{ word: 'BAT', rhymes: true }, { word: 'HAT', rhymes: true }, { word: 'DOG', rhymes: false }, { word: 'MAT', rhymes: true }, { word: 'PIG', rhymes: false }, { word: 'RAT', rhymes: true }, { word: 'BIG', rhymes: false }, { word: 'SAT', rhymes: true }] },
  { target: 'MOON', options: [{ word: 'SOON', rhymes: true }, { word: 'STAR', rhymes: false }, { word: 'BOON', rhymes: true }, { word: 'CROON', rhymes: true }, { word: 'HAND', rhymes: false }, { word: 'NOON', rhymes: true }, { word: 'BALL', rhymes: false }, { word: 'SPOON', rhymes: true }] },
  { target: 'RING', options: [{ word: 'SING', rhymes: true }, { word: 'BRING', rhymes: true }, { word: 'CAKE', rhymes: false }, { word: 'KING', rhymes: true }, { word: 'BOOK', rhymes: false }, { word: 'STRING', rhymes: true }, { word: 'FIRE', rhymes: false }, { word: 'WING', rhymes: true }] },
  { target: 'BLUE', options: [{ word: 'TRUE', rhymes: true }, { word: 'RED', rhymes: false }, { word: 'CLUE', rhymes: true }, { word: 'FLEW', rhymes: true }, { word: 'GREEN', rhymes: false }, { word: 'BREW', rhymes: true }, { word: 'PINK', rhymes: false }, { word: 'NEW', rhymes: true }] },
  { target: 'BRIGHT', options: [{ word: 'NIGHT', rhymes: true }, { word: 'DAY', rhymes: false }, { word: 'TIGHT', rhymes: true }, { word: 'LIGHT', rhymes: true }, { word: 'DARK', rhymes: false }, { word: 'RIGHT', rhymes: true }, { word: 'GLOW', rhymes: false }, { word: 'FLIGHT', rhymes: true }] },
  { target: 'TREE', options: [{ word: 'FREE', rhymes: true }, { word: 'ROCK', rhymes: false }, { word: 'SEE', rhymes: true }, { word: 'BEE', rhymes: true }, { word: 'CLOUD', rhymes: false }, { word: 'THREE', rhymes: true }, { word: 'WIND', rhymes: false }, { word: 'FLEE', rhymes: true }] },
  { target: 'CAKE', options: [{ word: 'LAKE', rhymes: true }, { word: 'BAKE', rhymes: true }, { word: 'FISH', rhymes: false }, { word: 'WAKE', rhymes: true }, { word: 'BREAD', rhymes: false }, { word: 'MAKE', rhymes: true }, { word: 'APPLE', rhymes: false }, { word: 'FLAKE', rhymes: true }] },
  { target: 'SNOW', options: [{ word: 'BLOW', rhymes: true }, { word: 'RAIN', rhymes: false }, { word: 'FLOW', rhymes: true }, { word: 'GLOW', rhymes: true }, { word: 'HAIL', rhymes: false }, { word: 'SHOW', rhymes: true }, { word: 'COLD', rhymes: false }, { word: 'GROW', rhymes: true }] },
  { target: 'PLAY', options: [{ word: 'DAY', rhymes: true }, { word: 'RUN', rhymes: false }, { word: 'SAY', rhymes: true }, { word: 'STAY', rhymes: true }, { word: 'JUMP', rhymes: false }, { word: 'WAY', rhymes: true }, { word: 'SWIM', rhymes: false }, { word: 'PRAY', rhymes: true }] },
  { target: 'DEEP', options: [{ word: 'SLEEP', rhymes: true }, { word: 'JUMP', rhymes: false }, { word: 'WEEP', rhymes: true }, { word: 'KEEP', rhymes: true }, { word: 'LONG', rhymes: false }, { word: 'PEEP', rhymes: true }, { word: 'SWIM', rhymes: false }, { word: 'CREEP', rhymes: true }] },
];
