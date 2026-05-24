export interface LadderPuzzle {
  start: string;
  end: string;
  solution: string[];
}

export const WORD_LADDER_PUZZLES: LadderPuzzle[] = [
  { start: 'COLD', end: 'WARM', solution: ['COLD', 'CORD', 'WORD', 'WARD', 'WARM'] },
  { start: 'LEAD', end: 'GOLD', solution: ['LEAD', 'LOAD', 'GOAD', 'GOLD'] },
  { start: 'DARK', end: 'LIGHT', solution: ['DARK', 'LARK', 'LACK', 'LACE', 'LICE', 'LIKE', 'LITE', 'LIGHT'] },
  { start: 'LOVE', end: 'HATE', solution: ['LOVE', 'LIVE', 'LINE', 'LANE', 'LATE', 'HATE'] },
  { start: 'FOUR', end: 'FIVE', solution: ['FOUR', 'POUR', 'PIR', 'FIRE', 'FINE', 'FIVE'] },
  { start: 'GAME', end: 'PLAY', solution: ['GAME', 'GATE', 'GALE', 'PALE', 'PLAY'] },
  { start: 'FISH', end: 'BIRD', solution: ['FISH', 'FIST', 'GIST', 'GIRD', 'BIRD'] },
  { start: 'HILL', end: 'VALE', solution: ['HILL', 'FILL', 'FILE', 'VALE'] },
  { start: 'MOON', end: 'STAR', solution: ['MOON', 'MOAN', 'LOAN', 'LEAN', 'BEAN', 'BEAR', 'SEAR', 'STAR'] },
  { start: 'RIDE', end: 'BIKE', solution: ['RIDE', 'HIDE', 'HIRE', 'FIRE', 'FINE', 'MINE', 'MIKE', 'BIKE'] },
];

// Small 4-letter word dictionary for validation
export const FOUR_LETTER_WORDS = new Set([
  'cold','cord','word','ward','warm','lead','load','goad','gold',
  'dark','lark','lack','lace','lice','like','lite','love','live',
  'line','lane','late','hate','four','pour','fire','fine','five',
  'game','gate','gale','pale','play','fish','fist','gist','gird','bird',
  'hill','fill','file','vale','moon','moan','loan','lean','bean','bear',
  'sear','star','ride','hide','hire','mine','mike','bike','bake','cake',
  'make','take','fake','lake','rake','sake','wake','male','pale','sale',
  'tale','dale','gale','bale','call','ball','fall','hall','tall','wall',
  'bold','fold','gold','hold','mold','sold','told','bolt','colt','molt',
  'jolt','folk','yolk','worn','corn','born','torn','horn','port','sort',
  'fort','mort','core','bore','fore','gore','more','sore','wore','lore',
]);
