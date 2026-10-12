import test from 'node:test';
import assert from 'node:assert/strict';
import { createDefaultSavedState, markCountryVisited, clearAlbum, restoreAlbum } from '../src/lib/storage.ts';

test('album reset is reversible and preserves settings and the current round',()=>{
  const state=markCountryVisited(createDefaultSavedState(),'israel',new Date('2026-10-11T10:00:00Z'));
  state.settings.musicVolume=.2;
  state.session.activeCountryId='italy';
  state.session.stage='paint';
  const reset=clearAlbum(state);
  assert.equal(reset.album.length,0);
  assert.equal(state.album.length,1);
  assert.deepEqual(reset.settings,state.settings);
  assert.deepEqual(reset.session,state.session);
  assert.deepEqual(restoreAlbum(reset,state.album),state);
});
