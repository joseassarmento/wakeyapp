import { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import Mascot from "./Mascot";
import { AlarmSettings, loadAlarm, saveAlarm } from "@/lib/wakey-storage";
import { primeAudio } from "@/lib/wakey-audio";
import { toast } from "sonner";

const DAY_LABELS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

const formatTime = (h: number, m: number) => {
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return {
    time: `${hour12}:${m.toString().padStart(2, "0")}`,
    period,
  };
};

const daysLabel = (days: number[]) => {
  if (days.length === 0) return "Never";
  if (days.length === 7) return "Every day";
  const wd = [0, 1, 2, 3, 4];
  const we = [5, 6];
  const sortedDays = [...days].sort();
  if (JSON.stringify(sortedDays) === JSON.stringify(wd)) return "Monday — Friday";
  if (JSON.stringify(sortedDays) === JSON.stringify(we)) return "Weekends";
  return sortedDays.map((d) => DAY_LABELS[d]).join(" · ");
};

export const AlarmScreen = () => {
  const [alarm, setAlarm] = useState<AlarmSettings>(() => loadAlarm());

  useEffect(() => saveAlarm(alarm), [alarm]);

  const { time, period } = formatTime(alarm.hour, alarm.minute);

  const toggleDay = (d: number) => {
    setAlarm((a) => {
      const has = a.days.includes(d);
      const next = has ? a.days.filter((x) => x !== d) : [...a.days, d];
      return { ...a, days: next };
    });
  };

  const handleSet = () => {
    primeAudio();
    setAlarm((a) => ({ ...a, enabled: true }));
    toast("Alarm set", {
      description: `${time} ${period} · ${daysLabel(alarm.days)}`,
    });
  };

  const editTime = () => {
    const input = prompt("Set time (HH:MM, 24h)", `${alarm.hour.toString().padStart(2, "0")}:${alarm.minute.toString().padStart(2, "0")}`);
    if (!input) return;
    const m = input.match(/^(\d{1,2}):(\d{2})$/);
    if (!m) return;
    const h = Math.min(23, Math.max(0, parseInt(m[1], 10)));
    const mn = Math.min(59, Math.max(0, parseInt(m[2], 10)));
    setAlarm((a) => ({ ...a, hour: h, minute: mn }));
  };

  return (
    <div className="pb-32 animate-fade-in">
      {/* Mascot section */}
      <div className="pt-6 pb-2 flex justify-center">
        <div className="animate-float">
          <Mascot variant="happy" size={170} />
        </div>
      </div>

      <div className="px-5 space-y-4">
        {/* Time card */}
        <button
          onClick={editTime}
          className="press w-full bg-card rounded-[28px] shadow-card p-7 text-left"
        >
          <div className="flex items-baseline gap-2">
            <span
              className="text-ink leading-none"
              style={{ fontSize: 72, fontWeight: 600, letterSpacing: "-3px" }}
            >
              {time}
            </span>
            <span className="text-soft" style={{ fontSize: 22, fontWeight: 400 }}>
              {period}
            </span>
          </div>
          <div className="text-soft mt-2" style={{ fontSize: 13 }}>
            {daysLabel(alarm.days)}
          </div>
        </button>

        {/* Day chips */}
        <div className="flex justify-between gap-1.5">
          {DAY_LABELS.map((label, i) => {
            const active = alarm.days.includes(i);
            return (
              <button
                key={label}
                onClick={() => toggleDay(i)}
                className={`press flex-1 h-11 rounded-pill flex items-center justify-center transition-colors ${
                  active
                    ? "bg-ink text-card"
                    : "bg-card text-ink/55 border-[1.5px] border-ink/10"
                }`}
                style={{ fontSize: 13, fontWeight: 500 }}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Ringtone & frequency rows */}
        <div className="bg-card rounded-[24px] shadow-card overflow-hidden">
          <SettingsRow
            label="Ringtone"
            value={alarm.ringtone}
            onClick={() =>
              setAlarm((a) => ({
                ...a,
                ringtone: a.ringtone === "Sunrise" ? "Chimes" : "Sunrise",
              }))
            }
          />
          <div className="h-px bg-ink/5 mx-5" />
          <SettingsRow
            label="Frequency"
            value={alarm.frequency}
            onClick={() =>
              setAlarm((a) => ({
                ...a,
                frequency: a.frequency === "Weekdays" ? "Daily" : "Weekdays",
              }))
            }
          />
        </div>

        {/* CTA */}
        <button
          onClick={handleSet}
          className="press w-full h-14 rounded-pill bg-yellow text-ink"
          style={{ fontSize: 16, fontWeight: 600 }}
        >
          Set alarm
        </button>

        <p className="text-center text-soft" style={{ fontSize: 12 }}>
          Tap the time to edit · Tap "Set alarm" once to enable sound
        </p>
      </div>
    </div>
  );
};

const SettingsRow = ({
  label,
  value,
  onClick,
}: {
  label: string;
  value: string;
  onClick?: () => void;
}) => (
  <button
    onClick={onClick}
    className="press w-full flex items-center justify-between px-5 py-4 text-left"
  >
    <span className="text-ink" style={{ fontSize: 15, fontWeight: 500 }}>
      {label}
    </span>
    <span className="flex items-center gap-1 text-soft" style={{ fontSize: 15 }}>
      {value}
      <ChevronRight size={18} />
    </span>
  </button>
);

export default AlarmScreen;
