import { useEffect, useRef, useState } from "react";

interface TimePickerSheetProps {
  /** "HH:MM" 24h */
  value: string;
  onConfirm: (value: string) => void;
  onClose: () => void;
}

const ITEM_H = 44;

const hours12 = Array.from({ length: 12 }, (_, i) => i + 1); // 1..12
const minutes = Array.from({ length: 60 }, (_, i) => i); // 0..59
const periods = ["AM", "PM"];

const to12h = (hhmm: string) => {
  const [hStr, mStr] = hhmm.split(":");
  const h24 = parseInt(hStr, 10) || 0;
  const m = parseInt(mStr, 10) || 0;
  const period = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return { h12, m, period };
};

const to24h = (h12: number, m: number, period: string) => {
  let h = h12 % 12;
  if (period === "PM") h += 12;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

const Wheel = ({
  items,
  index,
  onChange,
  format,
}: {
  items: (string | number)[];
  index: number;
  onChange: (i: number) => void;
  format?: (v: string | number) => string;
}) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const settleRef = useRef<number | null>(null);

  // Sync external index → scroll position
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const target = index * ITEM_H;
    if (Math.abs(el.scrollTop - target) > 1) {
      el.scrollTo({ top: target, behavior: "auto" });
    }
  }, [index]);

  const handleScroll = () => {
    const el = ref.current;
    if (!el) return;
    if (settleRef.current) window.clearTimeout(settleRef.current);
    settleRef.current = window.setTimeout(() => {
      const i = Math.round(el.scrollTop / ITEM_H);
      const clamped = Math.max(0, Math.min(items.length - 1, i));
      if (Math.abs(el.scrollTop - clamped * ITEM_H) > 1) {
        el.scrollTo({ top: clamped * ITEM_H, behavior: "smooth" });
      }
      if (clamped !== index) onChange(clamped);
    }, 120);
  };

  const handleItemClick = (i: number) => {
    const el = ref.current;
    if (el) {
      el.scrollTo({ top: i * ITEM_H, behavior: "smooth" });
    }
    onChange(i);
  };

  return (
    <div
      ref={ref}
      onScroll={handleScroll}
      className="relative flex-1 overflow-y-scroll snap-y snap-mandatory no-scrollbar"
      style={{
        height: ITEM_H * 5,
        scrollPaddingTop: ITEM_H * 2,
        WebkitOverflowScrolling: "touch",
      }}
    >
      <div style={{ height: ITEM_H * 2 }} />
      {items.map((v, i) => (
        <div
          key={i}
          className="snap-center flex items-center justify-center text-ink"
          style={{
            height: ITEM_H,
            fontSize: 26,
            fontWeight: 600,
            opacity: i === index ? 1 : 0.35,
            transition: "opacity 150ms",
          }}
          onClick={() => handleItemClick(i)}
        >
          {format ? format(v) : v}
        </div>
      ))}
      <div style={{ height: ITEM_H * 2 }} />
    </div>
  );
};

export const TimePickerSheet = ({
  value,
  onConfirm,
  onClose,
}: TimePickerSheetProps) => {
  const initial = to12h(value);
  const [hIdx, setHIdx] = useState(hours12.indexOf(initial.h12));
  const [mIdx, setMIdx] = useState(initial.m);
  const [pIdx, setPIdx] = useState(periods.indexOf(initial.period));
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setEntered(true));
  }, []);

  const close = () => {
    setEntered(false);
    setTimeout(onClose, 280);
  };

  const confirm = () => {
    const v = to24h(hours12[hIdx], minutes[mIdx], periods[pIdx]);
    onConfirm(v);
    close();
  };

  return (
    <div
      className={`fixed inset-0 z-[70] flex items-end justify-center transition-opacity duration-[280ms] ${
        entered ? "opacity-100" : "opacity-0"
      }`}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-ink/40"
        onClick={close}
        aria-hidden
      />
      <div
        className="relative w-full max-w-[430px] bg-card rounded-t-[28px] shadow-card pb-6 transition-transform duration-[280ms] ease-in-out"
        style={{ transform: entered ? "translateY(0)" : "translateY(100%)" }}
      >
        <div className="flex justify-center pt-3 pb-1">
          <span className="block w-10 h-1 rounded-full bg-ink/15" />
        </div>
        <h3
          className="text-ink text-center pt-2 pb-3"
          style={{ fontSize: 18, fontWeight: 600 }}
        >
          Pick a time
        </h3>

        <div className="relative mx-5 rounded-[20px] bg-surface overflow-hidden">
          {/* Selection band */}
          <div
            className="pointer-events-none absolute left-0 right-0 bg-yellow/30"
            style={{
              top: ITEM_H * 2,
              height: ITEM_H,
            }}
          />
          <div className="flex">
            <Wheel
              items={hours12}
              index={hIdx}
              onChange={setHIdx}
            />
            <div
              className="flex items-center text-ink"
              style={{ fontSize: 26, fontWeight: 600 }}
            >
              :
            </div>
            <Wheel
              items={minutes}
              index={mIdx}
              onChange={setMIdx}
              format={(v) => String(v).padStart(2, "0")}
            />
            <Wheel items={periods} index={pIdx} onChange={setPIdx} />
          </div>
        </div>

        <div className="flex gap-3 px-5 mt-5">
          <button
            onClick={close}
            className="press flex-1 h-12 rounded-pill bg-surface text-ink"
            style={{ fontSize: 15, fontWeight: 600 }}
          >
            Cancel
          </button>
          <button
            onClick={confirm}
            className="press flex-1 h-12 rounded-pill bg-ink text-card"
            style={{ fontSize: 15, fontWeight: 600 }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default TimePickerSheet;
