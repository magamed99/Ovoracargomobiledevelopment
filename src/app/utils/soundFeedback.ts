/**
 * Sound feedback utility using Web Audio API.
 * Lightweight — no audio files, generates tones programmatically.
 * Respects user preference via localStorage flag.
 */

const STORAGE_KEY = 'ovora_sound_enabled';
const HAPTIC_KEY = 'ovora_haptic_enabled';

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
}

function isEnabled(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== 'false';
  } catch {
    return true;
  }
}

function isHapticEnabled(): boolean {
  try {
    return localStorage.getItem(HAPTIC_KEY) !== 'false';
  } catch {
    return true;
  }
}

export function setSoundEnabled(v: boolean) {
  try { localStorage.setItem(STORAGE_KEY, String(v)); } catch {}
}

export function getSoundEnabled(): boolean {
  return isEnabled();
}

export function setHapticEnabled(v: boolean) {
  try { localStorage.setItem(HAPTIC_KEY, String(v)); } catch {}
}

export function getHapticEnabled(): boolean {
  return isHapticEnabled();
}

/** Haptic vibration — uses navigator.vibrate where supported */
function haptic(pattern: number | number[]) {
  if (!isHapticEnabled()) return;
  try { navigator?.vibrate?.(pattern); } catch {}
}

function playTone(freq: number, duration: number, type: OscillatorType = 'sine', volume = 0.12) {
  if (!isEnabled()) return;
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch {}
}

/** Accept offer — rising double beep + haptic */
export function playAcceptSound() {
  playTone(520, 0.1, 'sine', 0.1);
  setTimeout(() => playTone(780, 0.15, 'sine', 0.1), 100);
  haptic([15, 30, 15]);
}

/** Decline offer — low single beep + haptic */
export function playDeclineSound() {
  playTone(280, 0.2, 'triangle', 0.08);
  haptic(20);
}

/** Delete / destructive action — descending double beep + haptic */
export function playDeleteSound() {
  playTone(440, 0.1, 'sine', 0.08);
  setTimeout(() => playTone(300, 0.18, 'sine', 0.08), 100);
  haptic([30, 50, 30]);
}

/** Success — cheerful triple chirp + haptic */
export function playSuccessSound() {
  playTone(523, 0.08, 'sine', 0.1);
  setTimeout(() => playTone(659, 0.08, 'sine', 0.1), 80);
  setTimeout(() => playTone(784, 0.12, 'sine', 0.1), 160);
  haptic([10, 20, 10, 20, 10]);
}

/** Generic tap — subtle click + light haptic */
export function playTapSound() {
  playTone(600, 0.04, 'square', 0.04);
  haptic(8);
}

/** Swipe dismiss — whoosh-like + medium haptic */
export function playSwipeSound() {
  playTone(400, 0.08, 'sawtooth', 0.04);
  setTimeout(() => playTone(250, 0.12, 'sawtooth', 0.03), 60);
  haptic([20, 40, 20]);
}