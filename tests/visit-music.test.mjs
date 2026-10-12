import test from 'node:test';
import assert from 'node:assert/strict';
import { createVisitMusic } from '../src/lib/visit-music.ts';

function playerFixture() {
  const events = new EventTarget();
  const pending = [];
  const states = [];
  const player = {
    playCalls: 0,
    pauseCalls: 0,
    play() {
      this.playCalls += 1;
      return new Promise((resolve, reject) => pending.push({ resolve, reject }));
    },
    pause() { this.pauseCalls += 1; },
    addEventListener: events.addEventListener.bind(events),
    removeEventListener: events.removeEventListener.bind(events),
  };
  const music = createVisitMusic(player, state => states.push(state));
  return { player, pending, states, music, emitError: () => events.dispatchEvent(new Event('error')) };
}

test('gallery starts automatically, deduplicates pending starts, and stop survives later interaction', async () => {
  const { player, pending, states, music } = playerFixture();
  music.start();
  music.start();
  music.retryOnInteraction();
  assert.equal(player.playCalls, 1);
  assert.equal(states.at(-1).pending, true);
  pending[0].resolve();
  await Promise.resolve();
  assert.equal(states.at(-1).playing, true);
  music.toggle();
  music.retryOnInteraction();
  assert.equal(states.at(-1).playing, false);
  assert.equal(player.playCalls, 1, 'photo touches must not restart music that was stopped');
  music.toggle();
  assert.equal(player.playCalls, 2, 'the music control can explicitly restart it');
  music.dispose();
});

test('autoplay denial waits for a gesture without reporting unavailable music', async () => {
  const { player, pending, states, music } = playerFixture();
  music.start();
  pending[0].reject(Object.assign(new Error('Gesture required'), { name: 'NotAllowedError' }));
  await Promise.resolve();
  assert.deepEqual(states.at(-1), { playing: false, pending: false, blocked: true, unavailable: false });
  assert.equal(player.playCalls, 1);
  music.retryOnInteraction();
  music.retryOnInteraction();
  assert.equal(player.playCalls, 2, 'one interaction unlock attempt is enough while it is pending');
  pending[1].resolve();
  await Promise.resolve();
  assert.equal(states.at(-1).playing, true);
  music.dispose();
});

test('stop and leaving a visit cancel a late play promise without reviving music', async () => {
  for (const action of ['stop', 'dispose']) {
    const { player, pending, states, music, emitError } = playerFixture();
    music.start();
    music[action]();
    const count = states.length;
    const pauses = player.pauseCalls;
    pending[0].resolve();
    await Promise.resolve();
    assert.equal(states.length, count, 'cancelled requests must not publish a playing state');
    assert.ok(player.pauseCalls > pauses, 'late playback is immediately stopped');
    music.retryOnInteraction();
    assert.equal(player.playCalls, 1);
    if (action === 'dispose') {
      emitError();
      assert.equal(states.length, count, 'disposed players remove their error listener');
    }
    music.dispose();
  }
});

test('an older cancelled promise cannot stop a newer explicit restart', async () => {
  const { player, pending, states, music } = playerFixture();
  music.start();
  music.stop();
  music.start();
  pending[1].resolve();
  await Promise.resolve();
  const pauses = player.pauseCalls;
  pending[0].resolve();
  await Promise.resolve();
  assert.equal(player.pauseCalls, pauses);
  assert.equal(states.at(-1).playing, true);
  music.dispose();
});

test('media failures show an unavailable state and do not repeatedly retry on photo touches', async () => {
  const { player, pending, states, music, emitError } = playerFixture();
  music.start();
  pending[0].reject(Object.assign(new Error('Unsupported music'), { name: 'NotSupportedError' }));
  await Promise.resolve();
  assert.equal(states.at(-1).unavailable, true);
  music.retryOnInteraction();
  assert.equal(player.playCalls, 1);
  music.toggle();
  assert.equal(player.playCalls, 2);
  emitError();
  const count = states.length;
  pending[1].resolve();
  await Promise.resolve();
  assert.equal(states.at(-1).unavailable, true);
  assert.equal(states.length, count, 'a media error invalidates a pending success');
  music.dispose();
});
