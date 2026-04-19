import { useEffect, useState } from "react";
import Mascot from "./Mascot";
import { startAlarmSound, stopAlarmSound } from "@/lib/wakey-audio";

interface AlarmFiringProps {
  onSuccess: () => void;
  onEmergencyExit?: () => void;
  emergencyExitsLeft: number;
  alarmName?: string;
}

type ScanState = "idle" | "scanning" | "unsupported";

export const AlarmFiring = ({
  onSuccess,
  onEmergencyExit,
  emergencyExitsLeft,
  alarmName,
}: AlarmFiringProps) => {
  const [state, setState] = useState<ScanState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    startAlarmSound();
    // Block scroll & back navigation while firing
    document.body.style.overflow = "hidden";
    const onPop = () => window.history.pushState(null, "", window.location.href);
    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", onPop);
    return () => {
      stopAlarmSound();
      document.body.style.overflow = "";
      window.removeEventListener("popstate", onPop);
    };
  }, []);

  const finish = () => {
    setExiting(true);
    stopAlarmSound();
    setTimeout(onSuccess, 380);
  };

  const handleWakey = async () => {
    setError(null);
    if (!("NDEFReader" in window)) {
      setState("unsupported");
      return;
    }
    setState("scanning");
    try {
      // @ts-expect-error - NDEFReader typing
      const reader = new NDEFReader();
      await reader.scan();
      reader.onreading = () => finish();
      reader.onreadingerror = () => setError("Couldn't read tag. Try again.");
    } catch (e: any) {
      setError(e?.message || "NFC failed.");
      setState("unsupported");
    }
  };

  return (
    <div
      className={`fixed inset-0 bg-yellow z-50 flex flex-col items-center justify-between px-6 py-12 ${
        exiting ? "animate-fade-out" : "animate-fade-in"
      }`}
      role="dialog"
      aria-modal="true"
    >
      {/* Top spacer */}
      <div />

      {/* Mascot + text */}
      <div className="flex flex-col items-center gap-4">
        <Mascot variant="sleepy" size={300} />
        <h1
          className="text-ink text-center"
          style={{ fontSize: 32, fontWeight: 600 }}
        >
          Wake up!
        </h1>
        {alarmName && (
          <p className="text-ink/60 text-center" style={{ fontSize: 16 }}>
            {alarmName}
          </p>
        )}
      </div>

      {/* Bottom area */}
      <div className="w-full max-w-[400px] flex flex-col items-center gap-3">
        {state === "idle" && (
          <button
            onClick={handleWakey}
            className="press w-full bg-card text-ink rounded-pill py-5"
            style={{ fontSize: 20, fontWeight: 600 }}
          >
            Wakey
          </button>
        )}

        {state === "scanning" && (
          <>
            <div className="w-full bg-card text-ink rounded-pill py-5 flex items-center justify-center gap-2">
              <span style={{ fontSize: 20, fontWeight: 600 }}>Scanning</span>
              <span className="flex gap-1">
                <Dot delay="0s" />
                <Dot delay="0.2s" />
                <Dot delay="0.4s" />
              </span>
            </div>
            <p className="text-ink/70" style={{ fontSize: 13 }}>
              Hold your phone to the pod...
            </p>
            <button
              onClick={() => setState("idle")}
              className="press text-ink/60 underline"
              style={{ fontSize: 12 }}
            >
              Cancel scan
            </button>
          </>
        )}

        {state === "unsupported" && (
          <div className="w-full bg-card rounded-[24px] p-5 text-center space-y-3 shadow-card">
            <p className="text-ink" style={{ fontSize: 15, fontWeight: 500 }}>
              NFC not supported on this browser.
            </p>
            <p className="text-soft" style={{ fontSize: 13 }}>
              {error || "Tap to dismiss anyway."}
            </p>
            <div className="flex flex-col gap-2 pt-1">
              <button
                onClick={finish}
                className="press w-full bg-ink text-card rounded-pill py-3"
                style={{ fontSize: 15, fontWeight: 600 }}
              >
                Dismiss (demo)
              </button>
              <button
                onClick={() => setState("idle")}
                className="press text-soft"
                style={{ fontSize: 13 }}
              >
                Try NFC again
              </button>
            </div>
          </div>
        )}

        {emergencyExitsLeft > 0 && state === "idle" && (
          <button
            onClick={() => {
              onEmergencyExit?.();
              finish();
            }}
            className="press text-ink/60 mt-1"
            style={{ fontSize: 12 }}
          >
            Emergency exit ({emergencyExitsLeft} left)
          </button>
        )}
      </div>
    </div>
  );
};

const Dot = ({ delay }: { delay: string }) => (
  <span
    className="inline-block w-1.5 h-1.5 rounded-full bg-ink animate-pulse-soft"
    style={{ animationDelay: delay }}
  />
);

export default AlarmFiring;
