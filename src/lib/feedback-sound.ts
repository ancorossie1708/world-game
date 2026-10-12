export type FeedbackKind = 'correct' | 'incorrect';

type Voice = { oscillator: OscillatorNode; gain: GainNode };

let context: AudioContext | null = null;
let requestId = 0;
const voices = new Set<Voice>();

function audioContext(): AudioContext | null {
  if (context && context.state !== 'closed') return context;
  const browser = globalThis as typeof globalThis & { webkitAudioContext?: typeof AudioContext };
  const Constructor = browser.AudioContext || browser.webkitAudioContext;
  if (!Constructor) return null;
  try {
    context = new Constructor();
    return context;
  } catch {
    return null;
  }
}

function release(voice: Voice) {
  voices.delete(voice);
  try { voice.oscillator.disconnect(); } catch { /* Audio feedback must not interrupt play. */ }
  try { voice.gain.disconnect(); } catch { /* A stopped context may already be disconnected. */ }
}

function silenceVoices() {
  const now = context?.currentTime ?? 0;
  for (const voice of voices) {
    try {
      voice.gain.gain.cancelScheduledValues(now);
      voice.gain.gain.setValueAtTime(0.002, now);
      voice.gain.gain.linearRampToValueAtTime(0, now + 0.025);
      voice.oscillator.stop(now + 0.03);
    } catch {
      release(voice);
    }
  }
}

/** Stops active notes and cancels a sound waiting for the browser's audio unlock. */
export function stopFeedbackSounds(): void {
  requestId += 1;
  silenceVoices();
}

function playNotes(kind: FeedbackKind, audio: AudioContext, id: number, volume: number) {
  if (id !== requestId || audio.state !== 'running') return;
  silenceVoices();
  // A quiet rising major chord rewards a correct touch; two soft falling notes invite another try.
  const notes = kind === 'correct' ? [523.25, 659.25, 783.99] : [523.25, 440];
  const spacing = kind === 'correct' ? 0.095 : 0.14;
  const start = audio.currentTime + 0.005;
  for (const [index, frequency] of notes.entries()) {
    let voice: Voice | undefined;
    try {
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      voice = { oscillator, gain };
      voices.add(voice);
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(frequency, start);
      oscillator.connect(gain);
      gain.connect(audio.destination);
      const begins = start + index * spacing;
      gain.gain.setValueAtTime(0, begins);
      gain.gain.linearRampToValueAtTime((kind === 'correct' ? 0.095 : 0.075) * volume, begins + 0.015);
      gain.gain.exponentialRampToValueAtTime(Math.min(0.001, 0.001 * volume), begins + 0.225);
      gain.gain.linearRampToValueAtTime(0, begins + 0.25);
      oscillator.onended = () => release(voice!);
      oscillator.start(begins);
      oscillator.stop(begins + 0.265);
    } catch {
      if (voice) release(voice);
    }
  }
}

/** Call from a touch/click handler. All sound is generated locally, including offline. */
export function playFeedback(kind: FeedbackKind, volume = 1): void {
  const id = ++requestId;
  const level = Number.isFinite(volume) ? Math.max(0, Math.min(1, volume)) : 1;
  if (level === 0) { silenceVoices(); return; }
  try {
    const audio = audioContext();
    if (!audio) return;
    if (audio.state === 'running') {
      playNotes(kind, audio, id, level);
      return;
    }
    // The resume call occurs synchronously within the user's gesture on Android and browsers.
    void audio.resume().then(() => playNotes(kind, audio, id, level)).catch(() => {});
  } catch {
    // Devices that reject or do not support audio can continue playing normally.
  }
}
