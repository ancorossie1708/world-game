import test from 'node:test';
import assert from 'node:assert/strict';

let importId = 0;
const freshFeedback = () => import(`../src/lib/feedback-sound.ts?feedback-test=${++importId}`);

function installContext(Constructor) {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'AudioContext');
  const legacy = Object.getOwnPropertyDescriptor(globalThis, 'webkitAudioContext');
  Object.defineProperty(globalThis, 'AudioContext', { configurable: true, value: Constructor });
  Object.defineProperty(globalThis, 'webkitAudioContext', { configurable: true, value: undefined });
  return () => {
    if (original) Object.defineProperty(globalThis, 'AudioContext', original);
    else delete globalThis.AudioContext;
    if (legacy) Object.defineProperty(globalThis, 'webkitAudioContext', legacy);
    else delete globalThis.webkitAudioContext;
  };
}

function mockedAudio() {
  const instances = [];
  class Context {
    state = 'suspended';
    currentTime = 12;
    destination = {};
    oscillators = [];
    gains = [];
    pending = [];
    constructor() { instances.push(this); }
    resume() { return new Promise(resolve => this.pending.push(resolve)); }
    unlock() {
      this.state = 'running';
      for (const resolve of this.pending.splice(0)) resolve();
    }
    createOscillator() {
      const oscillator = {
        frequency: { setValueAtTime(value) { oscillator.note = value; } },
        connect() {},
        disconnect() { oscillator.disconnected = true; },
        start(time) { oscillator.startedAt = time; },
        stop(time) { oscillator.stoppedAt = time; },
      };
      this.oscillators.push(oscillator);
      return oscillator;
    }
    createGain() {
      const gain = {
        peaks: [],
        gain: {
          setValueAtTime() {},
          linearRampToValueAtTime(value) { gain.peaks.push(value); },
          exponentialRampToValueAtTime() {},
          cancelScheduledValues() { gain.cancelled = true; },
        },
        connect() {},
        disconnect() { gain.disconnected = true; },
      };
      this.gains.push(gain);
      return gain;
    }
  }
  return { Context, instances };
}

test('feedback remains usable when audio is unavailable or denied', async () => {
  let restore = installContext(undefined);
  try {
    const feedback = await freshFeedback();
    assert.doesNotThrow(() => feedback.playFeedback('correct'));
    assert.doesNotThrow(() => feedback.stopFeedbackSounds());
  } finally { restore(); }

  restore = installContext(class { constructor() { throw new Error('Audio denied'); } });
  try {
    const feedback = await freshFeedback();
    assert.doesNotThrow(() => feedback.playFeedback('incorrect'));
  } finally { restore(); }
});

test('rapid touches during audio unlock play only the latest feedback at a quiet level', async () => {
  const { Context, instances } = mockedAudio();
  const restore = installContext(Context);
  try {
    const { playFeedback } = await freshFeedback();
    playFeedback('correct');
    playFeedback('incorrect');
    assert.equal(instances.length, 1, 'the audio context is shared');
    const audio = instances[0];
    assert.equal(audio.oscillators.length, 0, 'sound waits for the browser unlock');
    audio.unlock();
    await Promise.resolve();
    assert.equal(audio.oscillators.length, 2, 'the superseded chime must not play late');
    assert.ok(audio.oscillators[0].note > audio.oscillators[1].note, 'retry notes fall gently');
    assert.ok(audio.gains.every(gain => Math.max(...gain.peaks) <= 0.1));
  } finally { restore(); }
});

test('stopping feedback cancels pending unlock and fades active notes when leaving play', async () => {
  const { Context, instances } = mockedAudio();
  const restore = installContext(Context);
  try {
    const { playFeedback, stopFeedbackSounds } = await freshFeedback();
    playFeedback('correct');
    stopFeedbackSounds();
    const audio = instances[0];
    audio.unlock();
    await Promise.resolve();
    assert.equal(audio.oscillators.length, 0, 'a paused game must not produce delayed sound');
    playFeedback('correct');
    assert.equal(audio.oscillators.length, 3);
    assert.ok(audio.oscillators.every((oscillator, index, all) => index === 0 || oscillator.note > all[index - 1].note));
    stopFeedbackSounds();
    assert.ok(audio.gains.every(gain => gain.cancelled));
    assert.ok(audio.oscillators.every(oscillator => oscillator.stoppedAt <= audio.currentTime + 0.04));
    for (const oscillator of audio.oscillators) oscillator.onended();
    assert.ok(audio.oscillators.every(oscillator => oscillator.disconnected));
    assert.ok(audio.gains.every(gain => gain.disconnected));
  } finally { restore(); }
});

test('feedback scales both correct and retry notes and mute never creates a note',async()=>{
 const {Context,instances}=mockedAudio();const restore=installContext(Context);
 try{
  const {playFeedback}=await freshFeedback();playFeedback('correct',0);
  assert.equal(instances.length,0);
  playFeedback('correct',0.25);instances[0].unlock();await Promise.resolve();
  assert.equal(instances[0].gains[0].peaks[0],0.095*0.25);
  playFeedback('incorrect',0.1);
  assert.equal(instances[0].gains.at(-1).peaks[0],0.075*0.1);
 }finally{restore();}
});
