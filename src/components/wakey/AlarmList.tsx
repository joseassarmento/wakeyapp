import { Alarm, formatTime12, formatDays } from "@/lib/wakey-storage";
import Mascot from "./Mascot";

interface AlarmListProps {
  alarms: Alarm[];
  onToggle: (id: string, active: boolean) => void;
  onOpen: (id: string) => void;
  onCreate: () => void;
}

export const AlarmList = ({ alarms, onToggle, onOpen, onCreate }: AlarmListProps) => {
  const empty = alarms.length === 0;

  return (
    <div className="pb-40 animate-fade-in">
      {/* Mascot */}
      <div className="pt-6 pb-2 flex justify-center">
        <Mascot variant="happy" size={empty ? 220 : 180} />
      </div>

      {empty ? (
        <p
          className="text-center text-soft px-10 mt-2"
          style={{ fontSize: 15 }}
        >
          No alarms yet. Tap + to add one.
        </p>
      ) : (
        <>
          <h2
            className="text-ink px-5 mb-3 mt-2"
            style={{ fontSize: 18, fontWeight: 500 }}
          >
            My alarms
          </h2>

          <ul className="px-5 space-y-3">
            {alarms.map((a, i) => (
              <li
                key={a.id}
                className="animate-slide-up"
                style={{ animationDelay: `${Math.min(i, 6) * 40}ms` }}
              >
                <AlarmCard
                  alarm={a}
                  onOpen={() => onOpen(a.id)}
                  onToggle={(v) => onToggle(a.id, v)}
                />
              </li>
            ))}
          </ul>
        </>
      )}

      {/* Floating CTA */}
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-[calc(100%-2.5rem)] max-w-[400px] z-30 px-1">
        <button
          onClick={onCreate}
          className="press w-full h-14 rounded-pill bg-yellow text-ink shadow-card flex items-center justify-center gap-2"
          style={{ fontSize: 16, fontWeight: 600 }}
        >
          <PlusIcon />
          New alarm
        </button>
      </div>
    </div>
  );
};

const AlarmCard = ({
  alarm,
  onOpen,
  onToggle,
}: {
  alarm: Alarm;
  onOpen: () => void;
  onToggle: (v: boolean) => void;
}) => {
  const { time, period } = formatTime12(alarm.time);
  const dim = !alarm.active;

  return (
    <div
      className={`bg-card rounded-[20px] shadow-card flex items-center gap-3 px-5 py-4 press transition-smooth ${
        dim ? "opacity-55" : ""
      }`}
    >
      <button onClick={onOpen} className="flex-1 text-left">
        <div className="flex items-baseline gap-1.5">
          <span
            className="text-ink leading-none"
            style={{ fontSize: 28, fontWeight: 600, letterSpacing: "-1px" }}
          >
            {time}
          </span>
          <span className="text-soft" style={{ fontSize: 13 }}>
            {period}
          </span>
        </div>
        <div className="text-soft mt-1" style={{ fontSize: 13 }}>
          {alarm.name || "Alarm"}
        </div>
        <div
          className="text-ink/35 mt-0.5"
          style={{ fontSize: 11, fontWeight: 400 }}
        >
          {formatDays(alarm.days)}
        </div>
      </button>

      <Toggle on={alarm.active} onChange={onToggle} />
    </li>
  );
};

const Toggle = ({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) => (
  <button
    role="switch"
    aria-checked={on}
    onClick={() => onChange(!on)}
    className={`press shrink-0 w-[46px] h-[28px] rounded-full p-0.5 transition-colors ${
      on ? "bg-yellow" : "bg-surface"
    }`}
  >
    <span
      className="block w-6 h-6 rounded-full bg-card shadow-sm transition-transform"
      style={{ transform: on ? "translateX(18px)" : "translateX(0)" }}
    />
  </button>
);

const PlusIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path
      d="M12 5v14M5 12h14"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
    />
  </svg>
);

export default AlarmList;
