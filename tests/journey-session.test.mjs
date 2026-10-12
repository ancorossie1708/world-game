import test from 'node:test';
import assert from 'node:assert/strict';
import { afterCountryIdentification, saveJourneyTrivia, startJourneyPhotos } from '../src/lib/journey-session.ts';
import { createDefaultSavedState, normalizeSavedState } from '../src/lib/storage.ts';
import { answerTrivia, createTriviaRound, nextTriviaQuestion } from '../src/lib/trivia.ts';
import { countryTrivia } from '../src/data/trivia.ts';

function identified() {
  const state = createDefaultSavedState();
  state.session = { activeCountryId: 'japan', continentId: 'asia', stage: 'quiz', paintedRegionIds: ['white-field', 'red-disc'] };
  return afterCountryIdentification(state, true);
}

test('identifying the country leads to trivia before any visit is recorded', () => {
  const state = identified();
  assert.equal(state.session.stage, 'trivia');
  assert.equal(state.album.length, 0);
  assert.deepEqual(state.session.triviaProgress, createTriviaRound(6));
  assert.equal(startJourneyPhotos(state), state);
});

test('all six correct answers are required before the gallery phase and one recorded visit', () => {
  let state = identified();
  let round = createTriviaRound(6);
  const questions = countryTrivia.japan;
  for (let index = 0; index < questions.length; index++) {
    const question = questions[index];
    round = answerTrivia(round, question, `${question.id}-${question.correctAnswerIndex}`, questions.length).round;
    state = saveJourneyTrivia(state, round);
    assert.equal(state.album.length, index === 5 ? 1 : 0);
    assert.equal(state.session.stage, 'trivia');
    if (index < 5) {
      assert.equal(startJourneyPhotos(state), state);
      round = nextTriviaQuestion(round, questions.length);
      state = saveJourneyTrivia(state, round);
    }
  }
  const repeated = saveJourneyTrivia(state, round);
  assert.equal(repeated.album[0].visits, 1);
  const photos = startJourneyPhotos(repeated);
  assert.equal(photos.session.stage, 'visit');
  assert.equal(photos.session.photoIndex, 0);
  assert.equal(photos.album[0].visits, 1);
});

test('an unfinished or finished trivia phase survives saving without skipping questions or adding visits', () => {
  const state = identified();
  const progress = { questionIndex: 2, correctAnswerId: 'japan-sushi-2', complete: false };
  const saved = normalizeSavedState(saveJourneyTrivia(state, progress));
  assert.equal(saved.session.stage, 'trivia');
  assert.deepEqual(saved.session.triviaProgress, progress);
  assert.equal(startJourneyPhotos(saved), saved);
  assert.equal(saved.album.length, 0);
  const done = { questionIndex: 5, correctAnswerId: 'japan-kimono-1', complete: true };
  const restored = normalizeSavedState(saveJourneyTrivia(saved, done));
  assert.deepEqual(restored.session.triviaProgress, done);
  assert.equal(saveJourneyTrivia(restored, done).album[0].visits, 1);
  assert.equal(startJourneyPhotos(restored).session.stage, 'visit');
});

test('legacy content without trivia can still open a visit after country identification', () => {
  const state = identified();
  const legacy = afterCountryIdentification(state, false);
  assert.equal(legacy.session.stage, 'visit');
  assert.equal(legacy.album[0].countryId, 'japan');
  assert.equal(legacy.session.triviaProgress, undefined);
});
