export interface WordTheme {
  name: string;
  emoji: string;
  words: string[];
}

export const WORD_THEMES: WordTheme[] = [
  {
    name: 'Animals',
    emoji: '🦁',
    words: ['CAT', 'DOG', 'BIRD', 'FISH', 'LION', 'BEAR', 'WOLF', 'FROG', 'DEER', 'HAWK', 'MOLE', 'CRANE', 'ZEBRA', 'WHALE', 'OTTER'],
  },
  {
    name: 'Food',
    emoji: '🍕',
    words: ['CAKE', 'RICE', 'SOUP', 'TACO', 'SUSHI', 'PIZZA', 'BREAD', 'PASTA', 'SALAD', 'CURRY', 'MANGO', 'APPLE', 'OLIVE', 'CREAM', 'STEAK'],
  },
  {
    name: 'Sports',
    emoji: '⚽',
    words: ['GOLF', 'POLO', 'SWIM', 'YOGA', 'RUGBY', 'TENNIS', 'BOXING', 'SKIING', 'HOCKEY', 'SOCCER', 'ROWING', 'SPRINT', 'DIVING', 'ARCHERY', 'CYCLING'],
  },
  {
    name: 'Countries',
    emoji: '🌍',
    words: ['PERU', 'CUBA', 'IRAN', 'CHAD', 'MALI', 'INDIA', 'JAPAN', 'CHINA', 'SPAIN', 'ITALY', 'FRANCE', 'EGYPT', 'KENYA', 'GHANA', 'BRAZIL'],
  },
  {
    name: 'Colors',
    emoji: '🎨',
    words: ['RED', 'BLUE', 'GOLD', 'TEAL', 'LIME', 'JADE', 'PINK', 'CYAN', 'GREY', 'IVORY', 'AMBER', 'BEIGE', 'CORAL', 'INDIGO', 'SCARLET'],
  },
  {
    name: 'Nature',
    emoji: '🌿',
    words: ['LAKE', 'CAVE', 'REEF', 'DUNE', 'MOOR', 'DELTA', 'CLIFF', 'RIDGE', 'GROVE', 'MARSH', 'CREEK', 'PLAIN', 'VALLEY', 'FOREST', 'JUNGLE'],
  },
  {
    name: 'Space',
    emoji: '🚀',
    words: ['STAR', 'MOON', 'MARS', 'COMET', 'ORBIT', 'VENUS', 'EARTH', 'SATURN', 'NEBULA', 'PULSAR', 'METEOR', 'ECLIPSE', 'GALAXY', 'COSMOS', 'AURORA'],
  },
  {
    name: 'Body',
    emoji: '💪',
    words: ['ARM', 'EAR', 'HIP', 'JAW', 'RIB', 'KNEE', 'SHIN', 'HEEL', 'WRIST', 'ELBOW', 'ANKLE', 'SPINE', 'THUMB', 'SKULL', 'CHEST'],
  },
  {
    name: 'Music',
    emoji: '🎵',
    words: ['BASS', 'DRUM', 'JAZZ', 'ROCK', 'HARP', 'FLUTE', 'PIANO', 'VIOLA', 'CHOIR', 'TEMPO', 'RHYTHM', 'MELODY', 'CHORD', 'LYRIC', 'GUITAR'],
  },
  {
    name: 'Technology',
    emoji: '💻',
    words: ['APP', 'BIT', 'CPU', 'RAM', 'CODE', 'DATA', 'WIFI', 'CHIP', 'BYTE', 'PIXEL', 'CLOUD', 'VIRUS', 'ROBOT', 'CACHE', 'SERVER'],
  },
];
