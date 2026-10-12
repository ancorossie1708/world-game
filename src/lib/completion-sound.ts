const VICTORY_SOUND = './content/audio/victory.mp3';
let active: HTMLAudioElement | null = null;
let requestId = 0;

function release(player: HTMLAudioElement) {
  if (active === player) active = null;
  player.onended = null;
  player.onerror = null;
  try {
    player.pause();
    player.currentTime = 0;
    player.removeAttribute('src');
    player.load();
  } catch { /* Media failures must never interrupt the game. */ }
}

/** Cancel pending playback on navigation or backgrounding. */
export function stopCompletionSound(): void {
  requestId += 1;
  if (active) release(active);
}

/** Play the supplied local MP3 in full, directly within the winning touch. */
export function playCompletionSound(): void {
  const id = ++requestId;
  if (active) release(active);
  let player: HTMLAudioElement | undefined;
  try {
    player = new Audio(VICTORY_SOUND);
    player.preload = 'auto';
    player.volume = 0.3;
    active = player;
    const current = player;
    current.onended = () => release(current);
    current.onerror = () => release(current);
    // Separate players keep an old promise from stopping the next win.
    void Promise.resolve(current.play()).then(() => {
      if (id !== requestId || active !== current) release(current);
    }).catch(() => release(current));
  } catch {
    if (player) release(player);
  }
}
