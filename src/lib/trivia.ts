import type { TriviaQuestion } from '../data/trivia';

export type TriviaAnswer = { id: string; text: string; correct: boolean };
export type TriviaRound = { questionIndex: number; correctAnswerId: string | null; complete: boolean };

export function makeTriviaAnswers(question: TriviaQuestion, random = Math.random): TriviaAnswer[] {
  const answers = question.answers.map((text, index) => ({
    id: `${question.id}-${index}`,
    text,
    correct: index === question.correctAnswerIndex,
  }));
  for (let index = answers.length - 1; index > 0; index--) {
    const next = Math.min(index, Math.max(0, Math.floor(random() * (index + 1))));
    [answers[index], answers[next]] = [answers[next], answers[index]];
  }
  return answers;
}

export function createTriviaRound(questionCount: number): TriviaRound {
  return { questionIndex: 0, correctAnswerId: null, complete: questionCount <= 0 };
}

/** Restore only a current, correct answer; old or malformed IDs never lock a question. */
export function restoreTriviaRound(questions: readonly TriviaQuestion[], saved: Partial<TriviaRound> = {}): TriviaRound {
  if (!questions.length) return createTriviaRound(0);
  const savedIndex = typeof saved.questionIndex === 'number' && Number.isFinite(saved.questionIndex)
    ? Math.trunc(saved.questionIndex) : 0;
  const questionIndex = Math.min(questions.length - 1, Math.max(0, savedIndex));
  const question = questions[questionIndex];
  const correctId = `${question.id}-${question.correctAnswerIndex}`;
  const correctAnswerId = savedIndex === questionIndex && saved.correctAnswerId === correctId ? correctId : null;
  // The final accepted answer is already complete, even if an older saved format omitted the flag.
  const complete = questionIndex === questions.length - 1 && correctAnswerId !== null;
  return { questionIndex, correctAnswerId, complete };
}

/** A correct answer locks the current question before another touch can be accepted. */
export function answerTrivia(round: TriviaRound, question: TriviaQuestion, answerId: string, questionCount = Infinity): {
  round: TriviaRound;
  feedback: 'correct' | 'incorrect' | null;
} {
  if (round.complete || round.correctAnswerId !== null) return { round, feedback: null };
  const answerIndex = question.answers.findIndex((_, index) => answerId === `${question.id}-${index}`);
  if (answerIndex < 0) return { round, feedback: null };
  if (answerIndex !== question.correctAnswerIndex) return { round, feedback: 'incorrect' };
  return { round: {
    ...round,
    correctAnswerId: answerId,
    complete: round.questionIndex + 1 >= questionCount,
  }, feedback: 'correct' };
}

export function nextTriviaQuestion(round: TriviaRound, questionCount: number): TriviaRound {
  if (round.complete || round.correctAnswerId === null) return round;
  if (round.questionIndex + 1 >= questionCount) return { ...round, complete: true };
  return { questionIndex: round.questionIndex + 1, correctAnswerId: null, complete: false };
}
