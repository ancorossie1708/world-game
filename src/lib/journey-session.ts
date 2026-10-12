import { markCountryVisited, type SavedState } from './storage.ts';
import type { TriviaRound } from './trivia';

/** Country identification starts the trivia phase before any gallery or music. */
export function afterCountryIdentification(state: SavedState, hasTrivia: boolean): SavedState {
  if (!state.session.activeCountryId) return state;
  const next = hasTrivia ? state : markCountryVisited(state, state.session.activeCountryId);
  return { ...next, session: {
    ...next.session,
    stage: hasTrivia ? 'trivia' : 'visit',
    photoIndex: 0,
    triviaProgress: hasTrivia ? { questionIndex: 0, correctAnswerId: null, complete: false } : undefined,
  } };
}

/** Record a visit only once when the six-question round becomes complete. */
export function saveJourneyTrivia(state: SavedState, progress: TriviaRound): SavedState {
  if (state.session.stage !== 'trivia' || !state.session.activeCountryId) return state;
  const next = progress.complete && !state.session.triviaProgress?.complete
    ? markCountryVisited(state, state.session.activeCountryId)
    : state;
  return { ...next, session: { ...next.session, triviaProgress: { ...progress } } };
}

export function startJourneyPhotos(state: SavedState): SavedState {
  if (state.session.stage !== 'trivia' || !state.session.triviaProgress?.complete) return state;
  return { ...state, session: { ...state.session, stage: 'visit', photoIndex: 0 } };
}
