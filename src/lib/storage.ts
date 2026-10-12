export type CountryGroup = 'famous' | 'less-known' | 'all' | 'personal';

export interface AlbumRecord {
  countryId: string;
  visitedAt: string;
  visits: number;
}

export interface GameSettings {
  countryGroup: CountryGroup;
  selectedCountryIds: string[];
  musicVolume: number;
  effectsVolume: number;
  victoryVolume: number;
  reduceMotion: boolean;
}

export interface SavedSession {
  continentId?: string;
  lastCountryId?: string;
  activeCountryId?: string;
  paintedRegionIds?: string[];
  stage?: 'paint' | 'quiz' | 'trivia' | 'visit';
  photoIndex?: number;
  triviaProgress?: { questionIndex: number; correctAnswerId: string | null; complete: boolean };
}

export interface SavedState {
  schemaVersion: 1;
  album: AlbumRecord[];
  settings: GameSettings;
  session: SavedSession;
}

const STORAGE_KEY = 'world-game.saved-state.v1';
let memoryState: SavedState | undefined;

export function createDefaultSavedState(): SavedState {
  return {
    schemaVersion: 1,
    album: [],
    settings: {
      countryGroup: 'famous',
      selectedCountryIds: [],
      musicVolume: 0.35,
      effectsVolume: 0.7,
      victoryVolume: 0.2,
      reduceMotion: false,
    },
    session: { paintedRegionIds: [] },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function identifier(value: unknown): string | undefined {
  return typeof value === 'string' && /^[a-zA-Z0-9_-]{1,80}$/.test(value)
    ? value
    : undefined;
}

function identifiers(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map(identifier).filter((id): id is string => Boolean(id)))].slice(0, 500);
}

function boundedNumber(value: unknown, fallback: number, minimum: number, maximum: number): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.min(maximum, Math.max(minimum, value))
    : fallback;
}

/** Recover usable local data without letting damaged settings break startup. */
export function normalizeSavedState(value: unknown): SavedState {
  const result = createDefaultSavedState();
  if (!isRecord(value) || value.schemaVersion !== 1) return result;

  if (isRecord(value.settings)) {
    const source = value.settings;
    const group = source.countryGroup;
    if (group === 'famous' || group === 'less-known' || group === 'all' || group === 'personal') {
      result.settings.countryGroup = group;
    }
    result.settings.selectedCountryIds = identifiers(source.selectedCountryIds);
    result.settings.musicVolume = boundedNumber(source.musicVolume, 0.35, 0, 1);
    result.settings.effectsVolume = boundedNumber(source.effectsVolume, 0.7, 0, 1);
    result.settings.victoryVolume = boundedNumber(source.victoryVolume, 0.2, 0, 1);
    result.settings.reduceMotion = source.reduceMotion === true;
  }

  if (isRecord(value.session)) {
    const source = value.session;
    result.session = { paintedRegionIds: identifiers(source.paintedRegionIds) };
    for (const key of ['continentId', 'lastCountryId', 'activeCountryId'] as const) {
      const id = identifier(source[key]);
      if (id) result.session[key] = id;
    }
    if (source.stage === 'paint' || source.stage === 'quiz' || source.stage === 'trivia' || source.stage === 'visit') result.session.stage = source.stage;
    if (typeof source.photoIndex === 'number' && Number.isFinite(source.photoIndex)) {
      result.session.photoIndex = Math.round(boundedNumber(source.photoIndex, 0, 0, 100));
    }
    if (isRecord(source.triviaProgress)) {
      result.session.triviaProgress = {
        questionIndex: Math.round(boundedNumber(source.triviaProgress.questionIndex, 0, 0, 5)),
        correctAnswerId: identifier(source.triviaProgress.correctAnswerId) ?? null,
        complete: source.triviaProgress.complete === true,
      };
    }
  }

  if (Array.isArray(value.album)) {
    const records = new Map<string, AlbumRecord>();
    for (const item of value.album.slice(0, 500)) {
      if (!isRecord(item)) continue;
      const countryId = identifier(item.countryId);
      if (!countryId || typeof item.visitedAt !== 'string') continue;
      const timestamp = Date.parse(item.visitedAt);
      if (!Number.isFinite(timestamp)) continue;
      const record = {
        countryId,
        visitedAt: new Date(timestamp).toISOString(),
        visits: Math.round(boundedNumber(item.visits, 1, 1, 100000)),
      };
      const existing = records.get(countryId);
      if (!existing || record.visitedAt > existing.visitedAt) records.set(countryId, record);
    }
    result.album = [...records.values()];
  }
  return result;
}

export function readSavedState(): SavedState {
  try {
    const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
    if (raw && raw.length < 1_000_000) {
      const state = normalizeSavedState(JSON.parse(raw));
      memoryState = state;
      return structuredClone(state);
    }
  } catch {
    // Private browsing, unavailable storage, or a damaged record still allow play.
  }
  return structuredClone(memoryState ?? createDefaultSavedState());
}

/** Returns false if persistence is unavailable; the current session still works. */
export function writeSavedState(value: SavedState): boolean {
  const state = normalizeSavedState(value);
  memoryState = state;
  try {
    if (!globalThis.localStorage) return false;
    globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function markCountryVisited(state: SavedState, countryId: string, now = new Date()): SavedState {
  if (!identifier(countryId) || !Number.isFinite(now.getTime())) return structuredClone(state);
  const next = normalizeSavedState(state);
  const existing = next.album.find((record) => record.countryId === countryId);
  if (existing) {
    existing.visitedAt = now.toISOString();
    existing.visits += 1;
  } else {
    next.album.push({ countryId, visitedAt: now.toISOString(), visits: 1 });
  }
  next.session.lastCountryId = countryId;
  return next;
}

/** Reset only the album, preserving settings and an unfinished game. */
export function clearAlbum(state: SavedState): SavedState {
  const next = normalizeSavedState(state);
  next.album = [];
  return next;
}

export function restoreAlbum(state: SavedState, records: AlbumRecord[]): SavedState {
  return normalizeSavedState({ ...state, album: [...state.album, ...records] });
}
