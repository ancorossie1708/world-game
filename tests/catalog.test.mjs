import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parseCatalogue } from '../src/catalog.ts';

const packaged = JSON.parse(await readFile(new URL('../public/content/catalog.json', import.meta.url), 'utf8'));
const sample = () => structuredClone(packaged);
const validTrivia = () => Array.from({ length: 6 }, (_, index) => ({
  id: `question-${index + 1}`,
  question: `שאלה ${index + 1}?`,
  answers: ['תשובה א', 'תשובה ב', 'תשובה ג', 'תשובה ד'],
  correctAnswerIndex: index % 4,
}));

test('the packaged catalogue preserves all fourteen countries and their media', () => {
  const result = parseCatalogue(sample());
  assert.equal(result.length, 14);
  assert.deepEqual(result.map((country) => country.id), packaged.countries.map((country) => country.id));
  assert.ok(result.every((country) => country.photos.length === 20 && country.music.src.startsWith('./content/audio/')));
  assert.ok(result.every((country) => country.trivia.length === 6));
});

test('older catalogues without trivia remain compatible', () => {
  const value = sample();
  for (const country of value.countries) delete country.trivia;
  const result = parseCatalogue(value);
  assert.equal(result.length, 14);
  assert.ok(result.every((country) => country.trivia === undefined));
});

test('optional trivia must provide exactly six questions', () => {
  for (const trivia of [null, {}, 'questions', [], validTrivia().slice(0, 5), [...validTrivia(), validTrivia()[0]]]) {
    const value = sample();
    value.countries[0].trivia = trivia;
    assert.equal(parseCatalogue(value), null);
  }
  const value = sample();
  value.countries[0].trivia = validTrivia();
  assert.equal(parseCatalogue(value).length, 14);
});

test('damaged trivia questions and duplicate question identifiers reject the catalogue', () => {
  const changes = [
    (questions) => { questions[0] = null; },
    (questions) => { questions[0].id = '../question'; },
    (questions) => { questions[0].id = 'q'.repeat(81); },
    (questions) => { questions[1].id = questions[0].id; },
    (questions) => { questions[0].question = ''; },
    (questions) => { questions[0].question = '   '; },
    (questions) => { questions[0].question = 'ש'.repeat(201); },
    (questions) => { questions[0].question = 42; },
  ];
  for (const change of changes) {
    const value = sample();
    value.countries[0].trivia = validTrivia();
    change(value.countries[0].trivia);
    assert.doesNotThrow(() => parseCatalogue(value));
    assert.equal(parseCatalogue(value), null);
  }
});

test('trivia requires four distinct, short, trimmed answer labels', () => {
  const invalidAnswers = [
    null, {}, ['א', 'ב', 'ג'], ['א', 'ב', 'ג', 'ד', 'ה'], ['א', 'ב', , 'ד'],
    ['א', 'ב', 'א', 'ד'], ['א', 'ב', '', 'ד'], ['א', 'ב', '   ', 'ד'],
    ['א', 'ב', ' ג ', 'ד'], ['א', 'ב', 'ש'.repeat(81), 'ד'], ['א', 'ב', 3, 'ד'],
  ];
  for (const answers of invalidAnswers) {
    const value = sample();
    value.countries[0].trivia = validTrivia();
    value.countries[0].trivia[0].answers = answers;
    assert.doesNotThrow(() => parseCatalogue(value));
    assert.equal(parseCatalogue(value), null);
  }
});

test('trivia correct answer indices must identify exactly one of the four answers', () => {
  for (const correctAnswerIndex of [undefined, null, -1, 4, 0.5, '1', NaN, Infinity]) {
    const value = sample();
    value.countries[0].trivia = validTrivia();
    value.countries[0].trivia[0].correctAnswerIndex = correctAnswerIndex;
    assert.equal(parseCatalogue(value), null);
  }
  for (const correctAnswerIndex of [0, 1, 2, 3]) {
    const value = sample();
    value.countries[0].trivia = validTrivia();
    value.countries[0].trivia[0].correctAnswerIndex = correctAnswerIndex;
    assert.equal(parseCatalogue(value).length, 14);
  }
});

test('malformed catalogues fail as a whole without throwing or mutating input', () => {
  for (const value of [null, [], {}, { schemaVersion: 2, countries: packaged.countries }, { schemaVersion: 1, countries: [] }]) {
    assert.equal(parseCatalogue(value), null);
  }
  const value = sample();
  value.countries[0].flag.prepaintedPaths = [null];
  assert.doesNotThrow(() => parseCatalogue(value));
  assert.equal(parseCatalogue(value), null);
  assert.equal(value.countries[0].flag.prepaintedPaths[0], null);
});

test('duplicate countries, regions, and photo identifiers are rejected', () => {
  const countries = sample();
  countries.countries.push(structuredClone(countries.countries[0]));
  assert.equal(parseCatalogue(countries), null);
  const regions = sample();
  regions.countries[0].flag.regions.push(structuredClone(regions.countries[0].flag.regions[0]));
  assert.equal(parseCatalogue(regions), null);
  const photos = sample();
  photos.countries[0].photos[1].id = photos.countries[0].photos[0].id;
  assert.equal(parseCatalogue(photos), null);
});

test('catalogue media must use the local folder and matching file type', () => {
  for (const source of ['https://example.com/a.jpg', './content/photos/../a.jpg', './content/photos/a.wav', '/content/photos/a.jpg', './content/photos/a.jpg?download=1']) {
    const value = sample();
    value.countries[0].photos[0].src = source;
    assert.equal(parseCatalogue(value), null, source);
  }
  const value = sample();
  value.countries[0].music.src = './content/audio/a.jpg';
  assert.equal(parseCatalogue(value), null);
});

test('invalid geometry and misleading attribution links cannot replace the catalogue', () => {
  for (const box of ['not a view box', '0 0 -900 600', '0 0 900', '0 0 Infinity 600']) {
    const value = sample();
    value.countries[0].flag.viewBox = box;
    assert.equal(parseCatalogue(value), null, box);
  }
  for (const link of ['https://', 'https://name:secret@example.com/a', 'javascript:alert(1)', 'http://example.com/a']) {
    const value = sample();
    value.countries[0].photos[0].sourceURL = link;
    assert.equal(parseCatalogue(value), null, link);
  }
  const value = sample();
  value.countries[0].flag.regions[0].path = '   ';
  assert.equal(parseCatalogue(value), null);
});
