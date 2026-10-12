import test from 'node:test';
import assert from 'node:assert/strict';
import { createDefaultSavedState, normalizeSavedState, readSavedState, writeSavedState, markCountryVisited } from '../src/lib/storage.ts';

test('bad or unsupported storage safely falls back to independent defaults', () => {
  const state = normalizeSavedState({ schemaVersion: 99, album: [{ countryId: 'france' }] });
  assert.deepEqual(state, createDefaultSavedState());
  state.settings.selectedCountryIds.push('france');
  assert.deepEqual(createDefaultSavedState().settings.selectedCountryIds, []);
});

test('saved settings and a partly painted round survive a round trip', () => {
  const values = new Map();
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  } });
  const state = createDefaultSavedState();
  state.settings.musicVolume = 0.2;
  state.settings.reduceMotion = true;
  state.session = { activeCountryId: 'france', continentId: 'europe', stage: 'paint', paintedRegionIds: ['left'], photoIndex: 2 };
  assert.equal(writeSavedState(state), true);
  assert.deepEqual(readSavedState(), state);
  const result = readSavedState();
  result.session.paintedRegionIds.push('middle');
  assert.deepEqual(readSavedState().session.paintedRegionIds, ['left']);
});

test('damaged user settings are bounded and invalid album IDs are discarded', () => {
  const state = normalizeSavedState({
    schemaVersion: 1,
    settings: { musicVolume: 99, countryGroup: 'unknown', selectedCountryIds: ['japan', '../escape', 'japan'] },
    session: { activeCountryId: '../escape', paintedRegionIds: ['top', 'top', null], stage: 'visit', photoIndex: -2 },
    album: [
      { countryId: 'japan', visitedAt: '2026-10-10T10:00:00Z', visits: -10 },
      { countryId: 'japan', visitedAt: '2026-10-11T10:00:00Z', visits: 4 },
      { countryId: 'france', visitedAt: 'broken', visits: 1 },
    ],
  });
  assert.equal(state.settings.musicVolume, 1);
  assert.equal(state.settings.countryGroup, 'famous');
  assert.deepEqual(state.settings.selectedCountryIds, ['japan']);
  assert.equal(state.session.activeCountryId, undefined);
  assert.equal(state.session.photoIndex, 0);
  assert.deepEqual(state.session.paintedRegionIds, ['top']);
  assert.equal(state.album.length, 1);
  assert.equal(state.album[0].visits, 4);
});

test('trivia progress is restored with bounded indices and safe answer identifiers', () => {
  const state = normalizeSavedState({schemaVersion:1,session:{activeCountryId:'japan',stage:'trivia',triviaProgress:{questionIndex:99,correctAnswerId:'../invalid',complete:'yes'}}});
  assert.equal(state.session.stage,'trivia');
  assert.deepEqual(state.session.triviaProgress,{questionIndex:5,correctAnswerId:null,complete:false});
});

test('sound levels migrate separately and retain mute across save and restore', () => {
  const older = normalizeSavedState({schemaVersion:1,settings:{musicVolume:0.4}});
  assert.equal(older.settings.musicVolume,0.4);
  assert.equal(older.settings.victoryVolume,0.2);
  assert.equal(older.settings.effectsVolume,0.7);
  const next = normalizeSavedState({...older,settings:{...older.settings,victoryVolume:0,effectsVolume:0.1}});
  assert.equal(next.settings.musicVolume,0.4);
  assert.equal(next.settings.victoryVolume,0);
  assert.equal(next.settings.effectsVolume,0.1);
  assert.equal(normalizeSavedState({...next,settings:{victoryVolume:99,effectsVolume:-2}}).settings.victoryVolume,1);
  assert.equal(normalizeSavedState({...next,settings:{victoryVolume:NaN,effectsVolume:-2}}).settings.effectsVolume,0);
});

test('old hint settings are ignored while the album and current round survive migration', () => {
  const old = markCountryVisited(createDefaultSavedState(), 'israel', new Date('2026-10-11T10:00:00Z'));
  old.settings = { ...old.settings, autoHintSeconds: 15, guidedColor: true, musicVolume: 0.2 };
  old.session = { activeCountryId: 'france', continentId: 'europe', stage: 'paint', paintedRegionIds: ['left'] };
  const migrated = normalizeSavedState(old);
  assert.deepEqual(migrated.album, old.album);
  assert.deepEqual(migrated.session, old.session);
  assert.equal(migrated.settings.musicVolume, 0.2);
  assert.equal('autoHintSeconds' in migrated.settings, false);
  assert.equal('guidedColor' in migrated.settings, false);
});

test('repeated visits keep one album card and preserve the prior state', () => {
  const first = markCountryVisited(createDefaultSavedState(), 'japan', new Date('2026-10-10T10:00:00Z'));
  const second = markCountryVisited(first, 'japan', new Date('2026-10-11T10:00:00Z'));
  assert.equal(first.album[0].visits, 1);
  assert.equal(second.album.length, 1);
  assert.equal(second.album[0].visits, 2);
  assert.equal(second.session.lastCountryId, 'japan');
});

test('storage write failure keeps play state usable in memory', () => {
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: () => { throw new Error('Disabled'); },
    setItem: () => { throw new Error('Quota'); },
  } });
  const state = createDefaultSavedState();
  state.session.activeCountryId = 'italy';
  assert.equal(writeSavedState(state), false);
  assert.equal(readSavedState().session.activeCountryId, 'italy');
});
