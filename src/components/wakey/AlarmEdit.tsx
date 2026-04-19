import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import {
  Alarm,
  DAY_LABELS_SHORT,
  RINGTONES,
  formatTime12,
} from "@/lib/wakey-storage";
import { primeAudio } from "@/lib/wakey-audio";
import TimePickerSheet from "./TimePickerSheet";

interface AlarmEditProps {
  initial: Alarm;
  isNew: boolean;
  onClose: () => void;
  onSave: (a: Alarm) => void;
  onDelete?: (id: string) => void;
}

const PRESETS: { label: string; days: number[] }[] = [
  { label: "Weekdays", days: [0, 1, 2, 3, 4] },
  { label: "Weekends", days: [5, 6] },
  { label: "Every day", days: [0, 1, 2, 3, 4, 5, 6] },
  { label: "Never", days: [] },
];

export const AlarmEdit = ({
  initial,
  isNew,
  onClose,
  onSave,
  onDelete,
}: AlarmEditProps) => {
  const [draft, setDraft] = useState<Alarm>(initial);
  const [ringtoneOpen, setRingtoneOpen] = useState(false);
  const timeInputRef = useRef<HTMLInputElement | null>(null);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    // Slide-in from right
    requestAnimationFrame(() => setEntered(true));
  }, []);

  const handleClose = () => {
    setEntered(false);
    setTimeout(onClose, 280);
  };

  const handleSave = () => {
    onSave(draft);
    handleClose();
  };

  const { time, period } = formatTime12(draft.time);

  const toggleDay = (d: number) =>
    setDraft((s) => ({
      ...s,
      days: s.days.includes(d) ? s.days.filter((x) => x !== d) : [...s.days, d],
    }));

  const applyPreset = (days: number[]) =>
    setDraft((s) => ({ ...s, days: [...days] }));

  const openTimePicker = () => {
    primeAudio();
    const el = timeInputRef.current;
    if (!el) return;
    el.focus();
    try {
      el.showPicker?.();
    } catch {
      // showPicker can throw in cross-origin iframes — fall back to click
    }
    el.click();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-background overflow-y-auto transition-transform duration-[280ms] ease-in-out"
      style={{
        transform: entered ? "translateX(0)" : "translateX(100%)",
      }}
      role="dialog"
      aria-modal="true"
    >
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur px-4 h-14 flex items-center">
        <button
          onClick={handleClose}
          className="press w-10 h-10 -ml-2 flex items-center justify-center text-ink"
          aria-label="Back"
        >
          <ChevronLeft size={26} />
        </button>
        <h1
          className="flex-1 text-center text-ink"
          style={{ fontSize: 18, fontWeight: 600 }}
        >
          {isNew ? "New alarm" : "Edit alarm"}
        </h1>
        <button
          onClick={handleSave}
          className="press px-2 py-1 text-yellow"
          style={{ fontSize: 16, fontWeight: 500, color: "hsl(var(--yellow))" }}
        >
          Save
        </button>
      </header>

      <div className="px-5 pb-16 space-y-5 max-w-[430px] mx-auto">
        {/* Time picker card */}
        <button
          onClick={openTimePicker}
          className="press w-full bg-yellow rounded-[28px] p-7 text-left relative overflow-hidden"
        >
          <div className="label-caps text-ink/60 mb-2">Time</div>
          <div className="flex items-baseline gap-2">
            <span
              className="text-ink leading-none"
              style={{ fontSize: 72, fontWeight: 600, letterSpacing: "-3px" }}
            >
              {time}
            </span>
            <span className="text-ink/60" style={{ fontSize: 22, fontWeight: 400 }}>
              {period}
            </span>
          </div>
          <input
            ref={timeInputRef}
            type="time"
            value={draft.time}
            onChange={(e) => setDraft((s) => ({ ...s, time: e.target.value }))}
            onClick={(e) => e.stopPropagation()}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            aria-label="Pick alarm time"
          />
        </button>

        {/* Name */}
        <div className="bg-card rounded-[16px] shadow-card px-5 py-4">
          <div className="label-caps text-ink/45 mb-1">Name</div>
          <input
            value={draft.name}
            onChange={(e) => setDraft((s) => ({ ...s, name: e.target.value }))}
            placeholder="e.g. Morning class, Gym, Work"
            className="w-full bg-transparent outline-none text-ink placeholder:text-ink/35"
            style={{ fontSize: 16, fontWeight: 400 }}
          />
        </div>

        {/* Repeat */}
        <div>
          <div className="label-caps text-ink/45 mb-2 px-1">Repeat</div>
          <div className="flex justify-between gap-1.5 mb-3">
            {DAY_LABELS_SHORT.map((label, i) => {
              const active = draft.days.includes(i);
              return (
                <button
                  key={label}
                  onClick={() => toggleDay(i)}
                  className={`press flex-1 h-11 rounded-pill flex items-center justify-center transition-colors ${
                    active ? "bg-ink text-card" : "bg-surface text-ink/55"
                  }`}
                  style={{ fontSize: 13, fontWeight: 500 }}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1 px-1">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => applyPreset(p.days)}
                className="press text-ink/50 hover:text-ink"
                style={{ fontSize: 12, fontWeight: 400 }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Ringtone */}
        <button
          onClick={() => setRingtoneOpen(true)}
          className="press w-full bg-card rounded-[16px] shadow-card flex items-center justify-between px-5 py-4 text-left"
        >
          <span className="text-ink" style={{ fontSize: 16, fontWeight: 500 }}>
            Ringtone
          </span>
          <span className="flex items-center gap-1 text-soft" style={{ fontSize: 15 }}>
            {draft.ringtone}
            <ChevronRight size={18} />
          </span>
        </button>

        {/* Vibration */}
        <div className="bg-card rounded-[16px] shadow-card flex items-center justify-between px-5 py-4">
          <span className="text-ink" style={{ fontSize: 16, fontWeight: 500 }}>
            Vibration
          </span>
          <Toggle
            on={draft.vibration}
            onChange={(v) => setDraft((s) => ({ ...s, vibration: v }))}
          />
        </div>

        {/* Delete */}
        {!isNew && onDelete && (
          <div className="pt-6 flex justify-center">
            <button
              onClick={() => {
                onDelete(draft.id);
                handleClose();
              }}
              className="press text-orange"
              style={{ fontSize: 15, fontWeight: 500 }}
            >
              Delete alarm
            </button>
          </div>
        )}
      </div>

      {/* Ringtone bottom sheet */}
      {ringtoneOpen && (
        <RingtoneSheet
          current={draft.ringtone}
          onSelect={(r) => setDraft((s) => ({ ...s, ringtone: r }))}
          onClose={() => setRingtoneOpen(false)}
        />
      )}
    </div>
  );
};

const Toggle = ({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) => (
  <button
    role="switch"
    aria-checked={on}
    onClick={() => onChange(!on)}
    className={`press w-[46px] h-[28px] rounded-full p-0.5 transition-colors ${
      on ? "bg-yellow" : "bg-surface"
    }`}
  >
    <span
      className="block w-6 h-6 rounded-full bg-card shadow-sm transition-transform"
      style={{ transform: on ? "translateX(18px)" : "translateX(0)" }}
    />
  </button>
);

const RingtoneSheet = ({
  current,
  onSelect,
  onClose,
}: {
  current: string;
  onSelect: (r: string) => void;
  onClose: () => void;
}) => {
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    requestAnimationFrame(() => setEntered(true));
  }, []);
  const close = () => {
    setEntered(false);
    setTimeout(onClose, 280);
  };

  const preview = (name: string) => {
    primeAudio();
    // Single short beep — different pitch per ringtone
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const freqMap: Record<string, number> = {
      Sunrise: 740,
      Bell: 880,
      Digital: 1100,
      Chime: 660,
      Radar: 990,
    };
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freqMap[name] ?? 880;
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.02);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.45);
    setTimeout(() => ctx.close(), 600);
  };

  return (
    <div
      className={`fixed inset-0 z-[60] flex items-end justify-center transition-opacity duration-[280ms] ${
        entered ? "opacity-100" : "opacity-0"
      }`}
    >
      <div
        className="absolute inset-0 bg-ink/40"
        onClick={close}
        aria-hidden
      />
      <div
        className="relative w-full max-w-[430px] bg-card rounded-t-[28px] shadow-card pb-8 transition-transform duration-[280ms] ease-in-out"
        style={{ transform: entered ? "translateY(0)" : "translateY(100%)" }}
      >
        <div className="flex justify-center pt-3 pb-1">
          <span className="block w-10 h-1 rounded-full bg-ink/15" />
        </div>
        <h3
          className="text-ink px-5 pt-2 pb-3"
          style={{ fontSize: 18, fontWeight: 600 }}
        >
          Ringtone
        </h3>
        <ul>
          {RINGTONES.map((r) => {
            const selected = r === current;
            return (
              <li key={r}>
                <button
                  onClick={() => {
                    onSelect(r);
                    preview(r);
                  }}
                  className="press w-full flex items-center justify-between px-5 py-3.5"
                >
                  <span
                    className="text-ink"
                    style={{ fontSize: 16, fontWeight: 500 }}
                  >
                    {r}
                  </span>
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center border-[1.5px] ${
                      selected
                        ? "bg-yellow border-yellow"
                        : "border-ink/15"
                    }`}
                  >
                    {selected && <Check size={14} className="text-ink" strokeWidth={3} />}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        <button
          onClick={close}
          className="press mx-5 mt-4 w-[calc(100%-2.5rem)] h-12 rounded-pill bg-ink text-card"
          style={{ fontSize: 15, fontWeight: 600 }}
        >
          Done
        </button>
      </div>
    </div>
  );
};

export default AlarmEdit;
