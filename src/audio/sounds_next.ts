import { useSettingsStore } from '../store/useSettingsStore';

type SoundName = 'key' | 'correct' | 'present' | 'absent' | 'win' | 'lose';

const soundFiles: Record<SoundName, unknown> = {
  key:     require('../../assets/sounds/key.wav'),
  correct: require('../../assets/sounds/correct.wav'),
  present: require('../../assets/sounds/present.wav'),
  absent:  require('../../assets/sounds/absent.wav'),
  win:     require('../../assets/sounds/win.wav'),
  lose:    require('../../assets/sounds/lose.wav'),
};

// expo-av is lazy-loaded at call time so a missing native module never crashes the app.
// (Typical cause: custom dev client built before expo-av was added; fix by rebuilding.)
type AvModule = typeof import('expo-av');
let av: AvModule | null | undefined;

function loadAv(): AvModule | null {
  if (av !== undefined) return av;
  try {
    av = require('expo-av') as AvModule;
  } catch {
    av = null;
  }
  return av;
}

type SoundObj = { setPositionAsync(pos: number): Promise<void>; playAsync(): Promise<void> };
const cache: Partial<Record<SoundName, SoundObj>> = {};

async function getSound(name: SoundName): Promise<SoundObj | null> {
  if (cache[name]) return cache[name]!;
  const mod = loadAv();
  if (!mod) return null;
  try {
    const { sound } = await mod.Audio.Sound.createAsync(
      soundFiles[name] as Parameters<typeof mod.Audio.Sound.createAsync>[0],
    );
    cache[name] = sound as unknown as SoundObj;
    return cache[name]!;
  } catch {
    return null;
  }
}

export async function playSound(name: SoundName): Promise<void> {
  const enabled = useSettingsStore.getState().soundEnabled;
  if (!enabled) return;
  try {
    const sound = await getSound(name);
    if (!sound) return;
    await sound.setPositionAsync(0);
    await sound.playAsync();
  } catch {}
}

export async function preloadSounds(): Promise<void> {
  const mod = loadAv();
  if (!mod) return;
  try {
    await mod.Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
    await Promise.all((Object.keys(soundFiles) as SoundName[]).map(n => getSound(n)));
  } catch {}
}
