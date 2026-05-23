import { Audio } from 'expo-av';
import { useSettingsStore } from '../store/useSettingsStore';

const soundFiles = {
  key:     require('../../assets/sounds/key.wav'),
  correct: require('../../assets/sounds/correct.wav'),
  present: require('../../assets/sounds/present.wav'),
  absent:  require('../../assets/sounds/absent.wav'),
  win:     require('../../assets/sounds/win.wav'),
  lose:    require('../../assets/sounds/lose.wav'),
} as const;

type SoundName = keyof typeof soundFiles;

const cache: Partial<Record<SoundName, Audio.Sound>> = {};

async function getSound(name: SoundName): Promise<Audio.Sound> {
  if (cache[name]) return cache[name]!;
  const { sound } = await Audio.Sound.createAsync(soundFiles[name]);
  cache[name] = sound;
  return sound;
}

export async function playSound(name: SoundName): Promise<void> {
  const enabled = useSettingsStore.getState().soundEnabled;
  if (!enabled) return;
  try {
    const sound = await getSound(name);
    await sound.setPositionAsync(0);
    await sound.playAsync();
  } catch {
    // ignore audio errors silently
  }
}

export async function preloadSounds(): Promise<void> {
  await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
  await Promise.all(
    (Object.keys(soundFiles) as SoundName[]).map(name => getSound(name))
  );
}
