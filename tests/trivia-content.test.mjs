import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { countryTrivia } from '../src/data/trivia.ts';

const expectedCountries = ['japan', 'france', 'italy', 'germany', 'ukraine', 'israel', 'egypt', 'morocco', 'usa', 'canada', 'brazil', 'argentina', 'australia', 'new-zealand'];

test('offline catalogue and bundled game carry the same questions and correct answers', async () => {
  const catalog = JSON.parse(await readFile(new URL('../public/content/catalog.json', import.meta.url), 'utf8'));
  for (const country of catalog.countries) assert.deepEqual(country.trivia, countryTrivia[country.id], country.id);
});

test('every playable country has exactly six trivia questions', () => {
  assert.deepEqual(Object.keys(countryTrivia).sort(), expectedCountries.toSorted());
  for (const countryId of expectedCountries) {
    assert.equal(countryTrivia[countryId].length, 6, countryId);
  }
  assert.equal(Object.values(countryTrivia).flat().length, 84);
});

test('every trivia question has four distinct answers and a valid correct answer', () => {
  for (const [countryId, questions] of Object.entries(countryTrivia)) {
    for (const question of questions) {
      assert.match(question.id, new RegExp(`^${countryId}-[a-z0-9-]+$`));
      assert.equal(question.answers.length, 4, question.id);
      assert.equal(new Set(question.answers.map(answer => answer.trim().normalize('NFC'))).size, 4, question.id);
      assert.ok(Number.isInteger(question.correctAnswerIndex), question.id);
      assert.ok(question.correctAnswerIndex >= 0 && question.correctAnswerIndex < 4, question.id);
      assert.ok(question.answers[question.correctAnswerIndex], question.id);
    }
  }
});

test('question IDs and question wording are unique across the countries', () => {
  const questions = Object.values(countryTrivia).flat();
  assert.equal(new Set(questions.map(question => question.id)).size, questions.length);
  assert.equal(new Set(questions.map(question => question.question.normalize('NFC'))).size, questions.length);
});

test('trivia wording stays short, readable, and plain Hebrew text', () => {
  for (const questions of Object.values(countryTrivia)) {
    for (const question of questions) {
      assert.ok(question.question.length <= 96, question.id);
      assert.ok(question.question.endsWith('?'), question.id);
      for (const text of [question.question, ...question.answers]) {
        assert.equal(text, text.trim(), question.id);
        assert.match(text, /[א-ת]/, question.id);
        assert.doesNotMatch(text, /[<>\u0000-\u001f\u007f]/, question.id);
        assert.ok(text.length > 0, question.id);
      }
      assert.ok(question.answers.every(answer => answer.length <= 48), question.id);
    }
  }
});
