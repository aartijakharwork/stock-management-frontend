// Lightweight haptic + sound feedback helpers. No external assets — sounds are
// synthesized via the Web Audio API on demand. Both are best-effort and silent
// failures: they're meant to enhance the experience, not block flow.

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return null;
    try { audioCtx = new Ctx(); } catch { return null; }
  }
  if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
  return audioCtx;
}

function tone(freq: number, durMs: number, type: OscillatorType = 'sine', startDelayMs = 0, gain = 0.08) {
  const ctx = getCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.value = gain;
  osc.connect(g);
  g.connect(ctx.destination);
  const start = ctx.currentTime + startDelayMs / 1000;
  const end = start + durMs / 1000;
  g.gain.setValueAtTime(gain, start);
  g.gain.exponentialRampToValueAtTime(0.0001, end);
  osc.start(start);
  osc.stop(end + 0.02);
}

const PREF_KEY = 'shopmanager.sound.enabled';

export function isSoundEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  const v = localStorage.getItem(PREF_KEY);
  return v === null ? true : v === 'true';
}

export function setSoundEnabled(enabled: boolean) {
  localStorage.setItem(PREF_KEY, String(enabled));
}

// Confirmation chime: two-note ascending arpeggio (~250ms total)
export function playSuccess() {
  if (!isSoundEnabled()) return;
  tone(880, 90, 'triangle', 0, 0.07);
  tone(1320, 140, 'triangle', 80, 0.06);
}

export function playError() {
  if (!isSoundEnabled()) return;
  tone(220, 180, 'square', 0, 0.05);
}

export function playClick() {
  if (!isSoundEnabled()) return;
  tone(1200, 30, 'square', 0, 0.04);
}

// Haptic feedback via Vibration API. Patterns are short to feel tactile, not
// disruptive. Mobile-only; desktop browsers ignore it gracefully.
export function hapticTap() {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try { navigator.vibrate(8); } catch { /* noop */ }
  }
}

export function hapticSuccess() {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try { navigator.vibrate([10, 40, 18]); } catch { /* noop */ }
  }
}

export function hapticError() {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try { navigator.vibrate([30, 60, 30]); } catch { /* noop */ }
  }
}
