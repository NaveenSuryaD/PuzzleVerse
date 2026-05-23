import type { Puzzle } from './types';

export const PUZZLES: Puzzle[] = [
  {
    id: 1,
    groups: [
      { tier: 1, category: 'Planets', words: ['MARS', 'VENUS', 'EARTH', 'SATURN'] },
      { tier: 2, category: 'Dances', words: ['WALTZ', 'TANGO', 'SALSA', 'POLKA'] },
      { tier: 3, category: 'Types of cheese', words: ['BRIE', 'GOUDA', 'EDAM', 'FETA'] },
      { tier: 4, category: '"Grand ___"', words: ['PIANO', 'SLAM', 'JURY', 'TOTAL'] },
    ],
  },
  {
    id: 2,
    groups: [
      { tier: 1, category: 'Fruits', words: ['MANGO', 'PEACH', 'GRAPE', 'MELON'] },
      { tier: 2, category: 'Trees', words: ['OAK', 'PINE', 'MAPLE', 'ELM'] },
      { tier: 3, category: 'Flowers', words: ['ROSE', 'LILY', 'TULIP', 'DAISY'] },
      { tier: 4, category: '"___ cake"', words: ['CHEESE', 'CUP', 'PAN', 'SHORT'] },
    ],
  },
  {
    id: 3,
    groups: [
      { tier: 1, category: 'Colors', words: ['RED', 'BLUE', 'GREEN', 'YELLOW'] },
      { tier: 2, category: 'Shapes', words: ['CIRCLE', 'SQUARE', 'OVAL', 'DIAMOND'] },
      { tier: 3, category: 'Metals', words: ['GOLD', 'SILVER', 'COPPER', 'BRONZE'] },
      { tier: 4, category: '"Fire ___"', words: ['WORK', 'PLACE', 'SIDE', 'FLY'] },
    ],
  },
  {
    id: 4,
    groups: [
      { tier: 1, category: 'Musical instruments', words: ['HARP', 'DRUM', 'FLUTE', 'BANJO'] },
      { tier: 2, category: 'Card games', words: ['POKER', 'BRIDGE', 'RUMMY', 'SNAP'] },
      { tier: 3, category: 'Spices', words: ['CUMIN', 'THYME', 'SAGE', 'BASIL'] },
      { tier: 4, category: '"Rock ___"', words: ['STAR', 'CLIMB', 'SLIDE', 'SALT'] },
    ],
  },
  {
    id: 5,
    groups: [
      { tier: 1, category: 'Big cats', words: ['LION', 'TIGER', 'COUGAR', 'CHEETAH'] },
      { tier: 2, category: 'Types of bread', words: ['RYE', 'PITA', 'NAAN', 'BRIOCHE'] },
      { tier: 3, category: 'Gemstones', words: ['RUBY', 'OPAL', 'JADE', 'AMBER'] },
      { tier: 4, category: '"Black ___"', words: ['BIRD', 'BERRY', 'BOARD', 'SMITH'] },
    ],
  },
  {
    id: 6,
    groups: [
      { tier: 1, category: 'US States', words: ['TEXAS', 'ALASKA', 'OHIO', 'MAINE'] },
      { tier: 2, category: 'European countries', words: ['SPAIN', 'FRANCE', 'ITALY', 'GREECE'] },
      { tier: 3, category: 'Rivers', words: ['NILE', 'AMAZON', 'GANGES', 'THAMES'] },
      { tier: 4, category: '"Long ___"', words: ['BOW', 'SHOT', 'HOUSE', 'JUMP'] },
    ],
  },
  {
    id: 7,
    groups: [
      { tier: 1, category: 'Vegetables', words: ['CARROT', 'ONION', 'BROCCOLI', 'SPINACH'] },
      { tier: 2, category: 'Pasta types', words: ['PENNE', 'ORZO', 'ZITI', 'FUSILLI'] },
      { tier: 3, category: 'Nuts', words: ['PECAN', 'WALNUT', 'ALMOND', 'CASHEW'] },
      { tier: 4, category: '"___ ball"', words: ['BASKET', 'FOOT', 'CANNON', 'SNOW'] },
    ],
  },
  {
    id: 8,
    groups: [
      { tier: 1, category: 'Ocean creatures', words: ['SHARK', 'WHALE', 'DOLPHIN', 'SQUID'] },
      { tier: 2, category: 'Space objects', words: ['COMET', 'NEBULA', 'QUASAR', 'PULSAR'] },
      { tier: 3, category: 'Mountains', words: ['EVEREST', 'DENALI', 'FUJI', 'WHITNEY'] },
      { tier: 4, category: '"Star ___"', words: ['FISH', 'SHIP', 'LIGHT', 'BOARD'] },
    ],
  },
  {
    id: 9,
    groups: [
      { tier: 1, category: 'Sports', words: ['TENNIS', 'CRICKET', 'RUGBY', 'GOLF'] },
      { tier: 2, category: 'Board games', words: ['CHESS', 'CHECKERS', 'RISK', 'CLUE'] },
      { tier: 3, category: 'Classical composers', words: ['BACH', 'MOZART', 'HAYDN', 'LISZT'] },
      { tier: 4, category: '"___ light"', words: ['MOON', 'SPOT', 'FLASH', 'DAY'] },
    ],
  },
  {
    id: 10,
    groups: [
      { tier: 1, category: 'Dog breeds', words: ['POODLE', 'BEAGLE', 'HUSKY', 'BOXER'] },
      { tier: 2, category: 'Cat breeds', words: ['PERSIAN', 'SIAMESE', 'BENGAL', 'TABBY'] },
      { tier: 3, category: 'Small birds', words: ['ROBIN', 'FINCH', 'SPARROW', 'WREN'] },
      { tier: 4, category: '"Hot ___"', words: ['DOG', 'POT', 'LINE', 'SHOT'] },
    ],
  },
  {
    id: 11,
    groups: [
      { tier: 1, category: 'Currencies', words: ['EURO', 'YEN', 'POUND', 'DOLLAR'] },
      { tier: 2, category: 'Languages', words: ['HINDI', 'ARABIC', 'SWAHILI', 'FRENCH'] },
      { tier: 3, category: 'Desserts', words: ['TIRAMISU', 'BROWNIE', 'PARFAIT', 'SORBET'] },
      { tier: 4, category: '"Cold ___"', words: ['FRONT', 'SNAP', 'WAR', 'SHOULDER'] },
    ],
  },
  {
    id: 12,
    groups: [
      { tier: 1, category: 'Oceans', words: ['PACIFIC', 'ATLANTIC', 'ARCTIC', 'INDIAN'] },
      { tier: 2, category: 'Card suits', words: ['HEART', 'CLUB', 'DIAMOND', 'SPADE'] },
      { tier: 3, category: 'Music genres', words: ['JAZZ', 'BLUES', 'REGGAE', 'TECHNO'] },
      { tier: 4, category: '"___ stone"', words: ['LIME', 'SAND', 'COBBLE', 'KEY'] },
    ],
  },
  {
    id: 13,
    groups: [
      { tier: 1, category: 'Shades of red', words: ['CRIMSON', 'SCARLET', 'MAROON', 'RUBY'] },
      { tier: 2, category: '"Hello" worldwide', words: ['HOLA', 'BONJOUR', 'CIAO', 'NAMASTE'] },
      { tier: 3, category: 'Cocktails', words: ['MOJITO', 'DAIQUIRI', 'GIMLET', 'SLING'] },
      { tier: 4, category: '"Blue ___"', words: ['BELL', 'BERRY', 'PRINT', 'BIRD'] },
    ],
  },
  {
    id: 14,
    groups: [
      { tier: 1, category: 'Polygons', words: ['PENTAGON', 'HEXAGON', 'OCTAGON', 'HEPTAGON'] },
      { tier: 2, category: 'Olympics host cities', words: ['TOKYO', 'PARIS', 'ATHENS', 'LONDON'] },
      { tier: 3, category: 'Volcanoes', words: ['ETNA', 'VESUVIUS', 'PINATUBO', 'KRAKATOA'] },
      { tier: 4, category: '"___ fall"', words: ['WATER', 'NIGHT', 'FREE', 'LAND'] },
    ],
  },
  {
    id: 15,
    groups: [
      { tier: 1, category: 'Types of milk', words: ['WHOLE', 'SKIM', 'OAT', 'SOY'] },
      { tier: 2, category: 'Coffee drinks', words: ['LATTE', 'MOCHA', 'ESPRESSO', 'CAPPUCCINO'] },
      { tier: 3, category: 'Types of tea', words: ['CHAMOMILE', 'OOLONG', 'MATCHA', 'ROOIBOS'] },
      { tier: 4, category: '"Morning ___"', words: ['STAR', 'GLORY', 'DEW', 'SICKNESS'] },
    ],
  },
  {
    id: 16,
    groups: [
      { tier: 1, category: 'Harry Potter characters', words: ['HARRY', 'HERMIONE', 'RON', 'DRACO'] },
      { tier: 2, category: 'Marvel Avengers', words: ['THOR', 'HULK', 'VISION', 'FALCON'] },
      { tier: 3, category: 'Disney villains', words: ['URSULA', 'GASTON', 'JAFAR', 'SCAR'] },
      { tier: 4, category: '"___ Man"', words: ['SPIDER', 'IRON', 'BAT', 'SUPER'] },
    ],
  },
  {
    id: 17,
    groups: [
      { tier: 1, category: 'European capitals', words: ['PARIS', 'ROME', 'MADRID', 'BERLIN'] },
      { tier: 2, category: 'Asian capitals', words: ['TOKYO', 'DELHI', 'BEIJING', 'SEOUL'] },
      { tier: 3, category: 'African countries', words: ['KENYA', 'GHANA', 'SENEGAL', 'MALI'] },
      { tier: 4, category: '"___ house"', words: ['TREE', 'LIGHT', 'STORE', 'WARE'] },
    ],
  },
  {
    id: 18,
    groups: [
      { tier: 1, category: 'Solfège notes', words: ['DO', 'RE', 'MI', 'FA'] },
      { tier: 2, category: 'Greek letters', words: ['ALPHA', 'BETA', 'GAMMA', 'DELTA'] },
      { tier: 3, category: 'Punctuation marks', words: ['COMMA', 'COLON', 'HYPHEN', 'APOSTROPHE'] },
      { tier: 4, category: '"Over ___"', words: ['NIGHT', 'LOOK', 'COME', 'ALL'] },
    ],
  },
  {
    id: 19,
    groups: [
      { tier: 1, category: 'Olympics sports', words: ['FENCING', 'ROWING', 'DIVING', 'ARCHERY'] },
      { tier: 2, category: 'Martial arts', words: ['KARATE', 'JUDO', 'TAEKWONDO', 'AIKIDO'] },
      { tier: 3, category: 'Team sports', words: ['VOLLEYBALL', 'BASEBALL', 'BASKETBALL', 'LACROSSE'] },
      { tier: 4, category: '"___ jump"', words: ['HIGH', 'LONG', 'BUNGEE', 'SHOW'] },
    ],
  },
  {
    id: 20,
    groups: [
      { tier: 1, category: 'Precious stones', words: ['EMERALD', 'SAPPHIRE', 'TOPAZ', 'AMETHYST'] },
      { tier: 2, category: 'Constellations', words: ['ORION', 'LYRA', 'SCORPIO', 'CASSIOPEIA'] },
      { tier: 3, category: 'Mythological creatures', words: ['SPHINX', 'CENTAUR', 'PHOENIX', 'MINOTAUR'] },
      { tier: 4, category: '"Wild ___"', words: ['FIRE', 'LIFE', 'CARD', 'FLOWER'] },
    ],
  },
  {
    id: 21,
    groups: [
      { tier: 1, category: 'Root vegetables', words: ['KALE', 'RADISH', 'TURNIP', 'PARSNIP'] },
      { tier: 2, category: 'Herbs', words: ['MINT', 'PARSLEY', 'CILANTRO', 'DILL'] },
      { tier: 3, category: 'Mushroom types', words: ['OYSTER', 'PORTOBELLO', 'SHIITAKE', 'TRUFFLE'] },
      { tier: 4, category: '"Deep ___"', words: ['END', 'FRY', 'THROAT', 'FREEZE'] },
    ],
  },
  {
    id: 22,
    groups: [
      { tier: 1, category: 'Types of energy', words: ['SOLAR', 'NUCLEAR', 'WIND', 'THERMAL'] },
      { tier: 2, category: 'Extreme weather', words: ['TORNADO', 'TYPHOON', 'BLIZZARD', 'MONSOON'] },
      { tier: 3, category: 'Cloud types', words: ['CUMULUS', 'STRATUS', 'CIRRUS', 'NIMBUS'] },
      { tier: 4, category: '"Thunder ___"', words: ['BOLT', 'BIRD', 'STORM', 'STRUCK'] },
    ],
  },
  {
    id: 23,
    groups: [
      { tier: 1, category: 'Italian foods', words: ['PIZZA', 'PASTA', 'RISOTTO', 'GELATO'] },
      { tier: 2, category: 'Japanese foods', words: ['SUSHI', 'RAMEN', 'TEMPURA', 'MISO'] },
      { tier: 3, category: 'Mexican foods', words: ['TACO', 'TAMALE', 'GUACAMOLE', 'ENCHILADA'] },
      { tier: 4, category: '"Sun ___"', words: ['FLOWER', 'BURN', 'RISE', 'SET'] },
    ],
  },
  {
    id: 24,
    groups: [
      { tier: 1, category: 'Parts of a ship', words: ['STERN', 'BOW', 'HULL', 'MAST'] },
      { tier: 2, category: 'Parts of a plane', words: ['COCKPIT', 'FUSELAGE', 'AILERON', 'RUDDER'] },
      { tier: 3, category: 'Parts of a building', words: ['FACADE', 'ATRIUM', 'FOYER', 'PARAPET'] },
      { tier: 4, category: '"___ board"', words: ['CARD', 'SKATE', 'SNOW', 'SURF'] },
    ],
  },
  {
    id: 25,
    groups: [
      { tier: 1, category: 'Shakespeare plays', words: ['HAMLET', 'OTHELLO', 'MACBETH', 'TEMPEST'] },
      { tier: 2, category: 'Tolkien characters', words: ['FRODO', 'GANDALF', 'LEGOLAS', 'SAURON'] },
      { tier: 3, category: 'Greek gods', words: ['ZEUS', 'HERA', 'POSEIDON', 'APOLLO'] },
      { tier: 4, category: '"Gold ___"', words: ['FISH', 'FIELD', 'MINE', 'RUSH'] },
    ],
  },
  {
    id: 26,
    groups: [
      { tier: 1, category: 'Winter sports', words: ['SKIING', 'SKATING', 'CURLING', 'LUGE'] },
      { tier: 2, category: 'Summer activities', words: ['SURFING', 'CAMPING', 'HIKING', 'KAYAKING'] },
      { tier: 3, category: 'Yoga poses (animals)', words: ['COBRA', 'SCORPION', 'EAGLE', 'CROW'] },
      { tier: 4, category: '"Ice ___"', words: ['CUBE', 'BERG', 'AGE', 'CREAM'] },
    ],
  },
  {
    id: 27,
    groups: [
      { tier: 1, category: 'Bones in the body', words: ['FEMUR', 'TIBIA', 'STERNUM', 'CLAVICLE'] },
      { tier: 2, category: 'Organs', words: ['LIVER', 'KIDNEY', 'SPLEEN', 'PANCREAS'] },
      { tier: 3, category: 'Brain parts', words: ['CORTEX', 'CEREBELLUM', 'AMYGDALA', 'THALAMUS'] },
      { tier: 4, category: '"Back ___"', words: ['FIRE', 'PACK', 'STAGE', 'BONE'] },
    ],
  },
  {
    id: 28,
    groups: [
      { tier: 1, category: 'Programming languages', words: ['PYTHON', 'RUBY', 'SWIFT', 'KOTLIN'] },
      { tier: 2, category: 'Social media platforms', words: ['TWITTER', 'INSTAGRAM', 'REDDIT', 'DISCORD'] },
      { tier: 3, category: 'Tech companies', words: ['APPLE', 'GOOGLE', 'AMAZON', 'NETFLIX'] },
      { tier: 4, category: '"Web ___"', words: ['SITE', 'MASTER', 'CAST', 'CAM'] },
    ],
  },
  {
    id: 29,
    groups: [
      { tier: 1, category: 'Countries in Asia', words: ['INDIA', 'CHINA', 'JAPAN', 'KOREA'] },
      { tier: 2, category: 'Countries in South America', words: ['BRAZIL', 'PERU', 'CHILE', 'COLOMBIA'] },
      { tier: 3, category: 'Countries in Africa', words: ['EGYPT', 'NIGERIA', 'ETHIOPIA', 'TANZANIA'] },
      { tier: 4, category: '"Sea ___"', words: ['FOOD', 'SIDE', 'GULL', 'HORSE'] },
    ],
  },
  {
    id: 30,
    groups: [
      { tier: 1, category: 'Cocktails', words: ['MOJITO', 'MARTINI', 'BELLINI', 'NEGRONI'] },
      { tier: 2, category: 'Beer styles', words: ['LAGER', 'STOUT', 'PORTER', 'PILSNER'] },
      { tier: 3, category: 'Wine grapes', words: ['MERLOT', 'SHIRAZ', 'RIESLING', 'MALBEC'] },
      { tier: 4, category: '"Pop ___"', words: ['CORN', 'STAR', 'QUIZ', 'ART'] },
    ],
  },
];

export function getDailyPuzzle(): Puzzle {
  const daysSinceEpoch = Math.floor(Date.now() / 86400000);
  return PUZZLES[daysSinceEpoch % PUZZLES.length];
}

export function getRandomPuzzle(excludeId?: number): Puzzle {
  const pool = excludeId !== undefined ? PUZZLES.filter(p => p.id !== excludeId) : PUZZLES;
  return pool[Math.floor(Math.random() * pool.length)];
}
