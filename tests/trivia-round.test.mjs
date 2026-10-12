import test from 'node:test';
import assert from 'node:assert/strict';
import { answerTrivia, createTriviaRound, makeTriviaAnswers, nextTriviaQuestion, restoreTriviaRound } from '../src/lib/trivia.ts';

const question = { id: 'sample', question: 'מהי עיר הבירה?', answers: ['רומא', 'פריז', 'ברלין', 'טוקיו'], correctAnswerIndex: 1 };

test('shuffling preserves four distinct stable answer IDs and exactly one correct answer', () => {
  const original = [...question.answers];
  for (const random of [() => 0, () => .5, () => .999]) {
    const answers = makeTriviaAnswers(question, random);
    assert.equal(answers.length, 4);
    assert.equal(new Set(answers.map(answer => answer.id)).size, 4);
    assert.deepEqual(answers.map(answer => answer.text).sort(), [...original].sort());
    assert.equal(answers.filter(answer => answer.correct).length, 1);
    assert.deepEqual(answers.find(answer => answer.correct), { id: 'sample-1', text: 'פריז', correct: true });
  }
  assert.deepEqual(question.answers, original);
});

test('the correct answer can appear in each of the four positions', () => {
  const positions = new Set();
  // Enumerate the 24 equally possible Fisher–Yates choice sequences.
  for (let last = 0; last < 4; last++) for (let middle = 0; middle < 3; middle++) for (let first = 0; first < 2; first++) {
    const draws = [(last + .1) / 4, (middle + .1) / 3, (first + .1) / 2];
    const answers = makeTriviaAnswers(question, () => draws.shift());
    positions.add(answers.findIndex(answer => answer.correct));
  }
  assert.deepEqual([...positions].sort(), [0, 1, 2, 3]);
});

test('a wrong answer leaves the same question open for retry without advancing', () => {
  const initial = createTriviaRound(6);
  const wrong = answerTrivia(initial, question, 'sample-0');
  assert.equal(wrong.feedback, 'incorrect');
  assert.equal(wrong.round, initial);
  assert.equal(nextTriviaQuestion(wrong.round, 6), initial);
  const retry = answerTrivia(wrong.round, question, 'sample-1');
  assert.equal(retry.feedback, 'correct');
  assert.equal(retry.round.correctAnswerId, 'sample-1');
});

test('a correct answer locks the question against repeated or different rapid touches', () => {
  const accepted = answerTrivia(createTriviaRound(6), question, 'sample-1');
  for (const answerId of ['sample-1', 'sample-2']) {
    const duplicate = answerTrivia(accepted.round, question, answerId);
    assert.equal(duplicate.round, accepted.round);
    assert.equal(duplicate.feedback, null);
  }
  assert.equal(accepted.round.questionIndex, 0);
});

test('manual advancement resets the answer lock and rejects stale answer IDs', () => {
  const accepted = answerTrivia(createTriviaRound(6), question, 'sample-1');
  const next = nextTriviaQuestion(accepted.round, 6);
  assert.deepEqual(next, { questionIndex: 1, correctAnswerId: null, complete: false });
  const nextQuestion = { ...question, id: 'next' };
  assert.equal(answerTrivia(next, nextQuestion, 'sample-1').feedback, null);
  assert.equal(answerTrivia(next, nextQuestion, 'next-1').feedback, 'correct');
});

test('all six correct answers complete the round immediately on the sixth touch', () => {
  let round = createTriviaRound(6);
  let completions = 0;
  for (let index = 0; index < 6; index++) {
    const current = { ...question, id: `question-${index}` };
    const accepted = answerTrivia(round, current, `${current.id}-1`, 6);
    assert.equal(accepted.feedback, 'correct');
    assert.equal(accepted.round.complete, index === 5);
    if (accepted.round.complete) completions++;
    round = accepted.round;
    if (!round.complete) {
      round = nextTriviaQuestion(round, 6);
      assert.equal(round.complete, false);
    }
  }
  assert.equal(completions, 1);
  assert.equal(round.questionIndex, 5);
  assert.equal(answerTrivia(round, question, 'sample-1').feedback, null);
  assert.equal(nextTriviaQuestion(round, 6), round);
});

test('a rapid repeated final answer cannot produce a second completion reward', () => {
  const finalQuestion = { ...question, id: 'final' };
  const before = { questionIndex: 5, correctAnswerId: null, complete: false };
  const accepted = answerTrivia(before, finalQuestion, 'final-1', 6);
  assert.equal(accepted.round.complete, true);
  assert.equal(accepted.feedback, 'correct');
  for (const answerId of ['final-1', 'final-0']) {
    const duplicate = answerTrivia(accepted.round, finalQuestion, answerId, 6);
    assert.equal(duplicate.round, accepted.round);
    assert.equal(duplicate.feedback, null);
  }
});

const questions = Array.from({ length: 6 }, (_, index) => ({ ...question, id: `saved-${index}` }));

test('restoring an answered question retains its lock and allows only the next question', () => {
  const restored = restoreTriviaRound(questions, { questionIndex: 2, correctAnswerId: 'saved-2-1', complete: false });
  assert.deepEqual(restored, { questionIndex: 2, correctAnswerId: 'saved-2-1', complete: false });
  assert.equal(answerTrivia(restored, questions[2], 'saved-2-1', 6).feedback, null);
  assert.deepEqual(nextTriviaQuestion(restored, 6), { questionIndex: 3, correctAnswerId: null, complete: false });
});

test('restored completion remains complete without emitting another accepted answer or reward', () => {
  for (const complete of [true, false]) {
    const restored = restoreTriviaRound(questions, { questionIndex: 5, correctAnswerId: 'saved-5-1', complete });
    assert.equal(restored.complete, true);
    assert.equal(answerTrivia(restored, questions[5], 'saved-5-1', 6).feedback, null);
    assert.equal(nextTriviaQuestion(restored, 6), restored);
  }
});

test('malformed indexes stay in bounds and cannot carry a stale answer lock', () => {
  for (const [questionIndex, expected] of [[-5, 0], [100, 5], [Infinity, 0], [NaN, 0]]) {
    const restored = restoreTriviaRound(questions, { questionIndex, correctAnswerId: 'saved-5-1', complete: true });
    assert.deepEqual(restored, { questionIndex: expected, correctAnswerId: null, complete: false });
  }
  assert.deepEqual(restoreTriviaRound(questions, { questionIndex: 2.8 }), {
    questionIndex: 2, correctAnswerId: null, complete: false,
  });
  assert.deepEqual(restoreTriviaRound([], { questionIndex: 100 }), createTriviaRound(0));
});

test('restoration rejects a stale question answer and an incorrect answer from the current question', () => {
  for (const correctAnswerId of ['saved-1-1', 'saved-2-0', 'unknown', null]) {
    const restored = restoreTriviaRound(questions, { questionIndex: 2, correctAnswerId, complete: true });
    assert.deepEqual(restored, { questionIndex: 2, correctAnswerId: null, complete: false });
    assert.equal(nextTriviaQuestion(restored, 6), restored);
  }
});
