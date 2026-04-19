import Mascot from "./Mascot";

interface AlarmSuccessProps {
  streak: number;
  wakeTimeLabel: string;
  onContinue: () => void;
}

const SunIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="4.5" fill="#FF8F00" />
    <g stroke="#FF8F00" strokeWidth="2" strokeLinecap="round">
      <line x1="12" y1="2" x2="12" y2="4.5" />
      <line x1="12" y1="19.5" x2="12" y2="22" />
      <line x1="2" y1="12" x2="4.5" y2="12" />
      <line x1="19.5" y1="12" x2="22" y2="12" />
      <line x1="4.6" y1="4.6" x2="6.4" y2="6.4" />
      <line x1="17.6" y1="17.6" x2="19.4" y2="19.4" />
      <line x1="19.4" y1="4.6" x2="17.6" y2="6.4" />
      <line x1="6.4" y1="17.6" x2="4.6" y2="19.4" />
    </g>
  </svg>
);

export const AlarmSuccess = ({ streak, wakeTimeLabel, onContinue }: AlarmSuccessProps) => {
  return (
    <div className="fixed inset-0 bg-card z-40 flex flex-col items-center justify-between px-6 py-16 animate-fade-in">
      <div />

      <div className="flex flex-col items-center gap-6 text-center">
        <div className="animate-bounce-soft">
          <Mascot variant="walking" size={280} />
        </div>
        <h1 className="text-ink" style={{ fontSize: 40, fontWeight: 600, letterSpacing: "-1px" }}>
          Morning saved!
        </h1>
        <div
          className="inline-flex items-center gap-2 bg-yellow-soft text-ink rounded-pill px-4 py-2"
          style={{ fontSize: 16, fontWeight: 500 }}
        >
          <SunIcon size={16} />
          {streak} day streak
        </div>
        <p className="text-soft" style={{ fontSize: 13 }}>
          You woke up at {wakeTimeLabel}
        </p>
      </div>

      <button
        onClick={onContinue}
        className="press w-full max-w-[400px] bg-yellow text-ink rounded-pill py-4"
        style={{ fontSize: 16, fontWeight: 600 }}
      >
        Start my day
      </button>
    </div>
  );
};

export default AlarmSuccess;
