import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import type { AudioPlayer } from 'expo-audio';
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

const cache: Partial<Record<SoundName, AudioPlayer>> = {};

function getPlayer(name: SoundName): AudioPlayer {
  if (cache[name]) return cache[name]!;
  const player = createAudioPlayer(soundFiles[name]);
  cache[name] = player;
  return player;
}

export async function playSound(name: SoundName): Promise<void> {
  const enabled = useSettingsStore.getState().soundEnabled;
  if (!enabled) return;
  try {
    const player = getPlayer(name);
    await player.seekTo(0);
    player.play();
  } catch {
    // ignore audio errors silently
  }
}

export async function preloadSounds(): Promise<void> {
  await setAudioModeAsync({ playsInSilentMode: true });
  (Object.keys(soundFiles) as SoundName[]).forEach(name => getPlayer(name));
}
