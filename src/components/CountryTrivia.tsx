import { useEffect, useMemo, useRef, useState } from 'react';
import type { TriviaQuestion } from '../data/trivia';
import { answerTrivia, makeTriviaAnswers, nextTriviaQuestion, restoreTriviaRound, type TriviaRound } from '../lib/trivia';
import { Icon } from './Artwork';
import './country-trivia.css';

type CountryTriviaProps = {
  questions: readonly TriviaQuestion[];
  reduceMotion: boolean;
  feedback?: { kind: 'correct' | 'incorrect'; id: string; sequence: number } | null;
  onFeedback: (kind: 'correct' | 'incorrect', answerId: string) => void;
  onAdvance?: () => void;
  initialQuestionIndex?: number;
  initialCorrectAnswerId?: string | null;
  initialComplete?: boolean;
  onProgress?: (progress: TriviaRound) => void;
  onComplete?: () => void;
  closeLabel?: string;
  onClose: () => void;
};

export function CountryTrivia({
  questions, reduceMotion, feedback, onFeedback, onAdvance, onClose,
  initialQuestionIndex = 0, initialCorrectAnswerId = null, initialComplete = false,
  onProgress, onComplete, closeLabel = 'חזרה לתמונות',
}: CountryTriviaProps) {
  const [round, setRound] = useState(() => restoreTriviaRound(questions, {
    questionIndex: initialQuestionIndex,
    correctAnswerId: initialCorrectAnswerId,
    complete: initialComplete,
  }));
  const roundRef = useRef(round);
  const heading = useRef<HTMLHeadingElement>(null);
  const question = questions[round.questionIndex];
  const answers = useMemo(() => question ? makeTriviaAnswers(question) : [], [question]);
  const complete = round.complete || !question;

  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, [round.questionIndex, complete]);

  function chooseAnswer(answerId: string) {
    if (!question) return;
    const result = answerTrivia(roundRef.current, question, answerId, questions.length);
    if (!result.feedback) return;
    roundRef.current = result.round;
    setRound(result.round);
    if (result.feedback === 'correct') onProgress?.(result.round);
    onFeedback(result.feedback, answerId);
    if (result.round.complete) onComplete?.();
  }

  function advance() {
    const next = nextTriviaQuestion(roundRef.current, questions.length);
    if (next === roundRef.current) return;
    roundRef.current = next;
    setRound(next);
    onProgress?.(next);
    onAdvance?.();
  }

  if (complete) return <section className="country-trivia trivia-complete" aria-labelledby="trivia-complete-heading">
    <span className="trivia-complete-mark" aria-hidden="true"><Icon name="check" size={92}/></span>
    <h2 id="trivia-complete-heading" ref={heading} tabIndex={-1}>כל הכבוד!</h2>
    <button className="primary-button trivia-return" onClick={onClose}>{closeLabel}<Icon name="arrow" size={27}/></button>
  </section>;

  return <section className={`country-trivia${reduceMotion ? ' trivia-reduced-motion' : ''}`} aria-labelledby="trivia-question-heading">
    <div className="trivia-progress" aria-label={`שאלה ${round.questionIndex + 1} מתוך ${questions.length}`}>
      <Icon name="sparkle" size={23}/><span>שאלה</span><b dir="ltr">{round.questionIndex + 1}/{questions.length}</b>
    </div>
    <h2 id="trivia-question-heading" className="trivia-question" ref={heading} tabIndex={-1}>{question.question}</h2>
    <div className="trivia-answer-grid">
      {answers.map((answer, index) => {
        const correct = round.correctAnswerId === answer.id;
        const wrong = feedback?.kind === 'incorrect' && feedback.id === answer.id && !reduceMotion;
        return <button
          key={answer.id}
          className={`trivia-answer trivia-answer-${index}${correct ? ' trivia-answer-correct' : ''}${wrong ? ' wrong-answer' : ''}`}
          style={wrong ? { animationName: feedback.sequence % 2 ? 'wrong-answer-a' : 'wrong-answer-b' } : undefined}
          disabled={round.correctAnswerId !== null}
          onClick={() => chooseAnswer(answer.id)}
          aria-label={`${answer.text}${correct ? ', נכון' : ''}`}
        >
          <strong>{answer.text}</strong>
          {correct && <span className="trivia-answer-check" aria-hidden="true"><Icon name="check" size={25}/></span>}
        </button>;
      })}
    </div>
    <div className="trivia-next-slot">
      {round.correctAnswerId !== null && <button className="primary-button trivia-next" onClick={advance}>
        השאלה הבאה<Icon name="arrow" size={28}/>
      </button>}
    </div>
  </section>;
}
