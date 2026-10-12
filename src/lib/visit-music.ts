export type VisitMusicState = {
  playing: boolean;
  pending: boolean;
  blocked: boolean;
  unavailable: boolean;
};

type MusicPlayer = {
  play(): Promise<void>;
  pause(): void;
  addEventListener(type: 'error', listener: () => void): void;
  removeEventListener(type: 'error', listener: () => void): void;
};

/** Owns the playback intention for one gallery visit, including delayed play promises. */
export function createVisitMusic(player: MusicPlayer, onState: (state: VisitMusicState) => void) {
  let state: VisitMusicState = { playing: false, pending: false, blocked: false, unavailable: false };
  let requested = false;
  let disposed = false;
  let generation = 0;

  function publish(next: VisitMusicState) {
    state = next;
    if (!disposed) onState({ ...state });
  }

  function fail(error: unknown, request: number) {
    if (disposed || request !== generation || !requested) return;
    const blocked = typeof error === 'object' && error !== null && 'name' in error && error.name === 'NotAllowedError';
    if (!blocked) requested = false;
    publish({ playing: false, pending: false, blocked, unavailable: !blocked });
  }

  function start() {
    if (disposed || requested && (state.playing || state.pending)) return;
    requested = true;
    const request = ++generation;
    publish({ playing: false, pending: true, blocked: false, unavailable: false });
    try {
      void Promise.resolve(player.play()).then(() => {
        if (disposed || request !== generation || !requested) {
          // A late resolution must not revive music after a stop or leaving the gallery.
          // It must also leave a newer, explicitly restarted request alone.
          if (disposed || !requested) player.pause();
          return;
        }
        publish({ playing: true, pending: false, blocked: false, unavailable: false });
      }, error => fail(error, request));
    } catch (error) {
      fail(error, request);
    }
  }

  function stop() {
    if (disposed) return;
    generation += 1;
    requested = false;
    player.pause();
    publish({ ...state, playing: false, pending: false, blocked: false });
  }

  function onError() {
    if (disposed) return;
    generation += 1;
    requested = false;
    player.pause();
    publish({ playing: false, pending: false, blocked: false, unavailable: true });
  }

  player.addEventListener('error', onError);

  return {
    start,
    stop,
    toggle() {
      if (requested && !state.blocked && !state.unavailable) stop();
      else start();
    },
    retryOnInteraction() {
      if (!disposed && requested && state.blocked) start();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      generation += 1;
      requested = false;
      player.pause();
      player.removeEventListener('error', onError);
    },
  };
}

export type VisitMusic = ReturnType<typeof createVisitMusic>;
