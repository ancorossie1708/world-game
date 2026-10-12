type FeedbackOverlayProps = {
  active: boolean;
  sequence: number;
  reduceMotion: boolean;
};

export function FeedbackOverlay({ active, sequence, reduceMotion }: FeedbackOverlayProps) {
  if (!active) return null;
  return <div
    key={sequence}
    className={`success-feedback${reduceMotion ? ' success-feedback-reduced-motion' : ''}`}
    role="status"
    aria-label="נכון"
  >
    <div className="success-feedback-mark" aria-hidden="true">
      <svg viewBox="0 0 160 160" fill="none">
        <path d="m28 82 32 32 72-76" stroke="currentColor" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="success-feedback-label">נכון</span>
    </div>
  </div>;
}
