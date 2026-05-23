// This file shadows sounds.ts to use lazy require() for expo-av.
// expo-av is a native module — if it fails to load (e.g. dev client built
// before expo-av was added) we degrade silently instead of crashing the app.

const { useSettingsStore } = require('../store/useSettingsStore');

const soundFiles = {
  key:     require('../../assets/sounds/key.wav'),
  correct: require('../../assets/sounds/correct.wav'),
  present: require('../../assets/sounds/present.wav'),
  absent:  require('../../assets/sounds/absent.wav'),
  win:     require('../../assets/sounds/win.wav'),
  lose:    require('../../assets/sounds/lose.wav'),
};

let av;

function loadAv() {
  if (av !== undefined) return av;
  try {
    av = require('expo-av');
  } catch {
    av = null;
  }
  return av;
}

const cache = {};

async function getSound(name) {
  if (cache[name]) return cache[name];
  const mod = loadAv();
  if (!mod) return null;
  try {
    const { sound } = await mod.Audio.Sound.createAsync(soundFiles[name]);
    cache[name] = sound;
    return sound;
  } catch {
    return null;
  }
}

async function playSound(name) {
  const enabled = useSettingsStore.getState().soundEnabled;
  if (!enabled) return;
  try {
    const sound = await getSound(name);
    if (!sound) return;
    await sound.setPositionAsync(0);
    await sound.playAsync();
  } catch {}
}

async function preloadSounds() {
  const mod = loadAv();
  if (!mod) return;
  try {
    await mod.Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
    await Promise.all(Object.keys(soundFiles).map(n => getSound(n)));
  } catch {}
}

module.exports = { playSound, preloadSounds };
