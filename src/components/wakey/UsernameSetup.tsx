import { useEffect, useMemo, useState } from "react";
import { Check, X, Loader2 } from "lucide-react";
import Mascot from "./Mascot";
import {
  TAKEN_USERNAMES,
  USERNAME_REGEX,
  UsernameStatus,
} from "@/lib/wakey-storage";

interface Props {
  onComplete: (name: string, username: string) => void;
}

export const UsernameSetup = ({ onComplete }: Props) => {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [status, setStatus] = useState<UsernameStatus>("idle");
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setEntered(true));
  }, []);

  // Live username validation with debounced "checking" state
  useEffect(() => {
    const u = username.trim().toLowerCase();
    if (!u) {
      setStatus("idle");
      return;
    }
    if (!USERNAME_REGEX.test(u)) {
      setStatus("invalid");
      return;
    }
    setStatus("checking");
    const timer = window.setTimeout(() => {
      if (TAKEN_USERNAMES.includes(u)) {
        setStatus("taken");
      } else {
        setStatus("available");
      }
    }, 450);
    return () => clearTimeout(timer);
  }, [username]);

  const canSubmit = useMemo(
    () => name.trim().length > 0 && status === "available",
    [name, status],
  );

  const handleUsernameChange = (raw: string) => {
    // Strip spaces and uppercase, allow letters/digits/underscore only as user types
    const sanitized = raw.toLowerCase().replace(/[^a-z0-9_]/g, "");
    setUsername(sanitized);
  };

  const submit = () => {
    if (!canSubmit) return;
    onComplete(name.trim(), username.trim().toLowerCase());
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-card flex flex-col"
      role="dialog"
      aria-modal="true"
    >
      {/* Top half: mascot */}
      <div
        className={`flex-1 flex items-end justify-center pb-6 transition-opacity duration-500 ${
          entered ? "opacity-100" : "opacity-0"
        }`}
      >
        <Mascot variant="happy" size={180} />
      </div>

      {/* Bottom card sliding up */}
      <div
        className="bg-card rounded-t-[32px] shadow-card px-6 pt-7 pb-8 transition-transform duration-[420ms] ease-out"
        style={{
          transform: entered ? "translateY(0)" : "translateY(100%)",
          maxWidth: 430,
          width: "100%",
          alignSelf: "center",
        }}
      >
        <h1
          className="text-ink mb-5"
          style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-0.5px" }}
        >
          What should we call you?
        </h1>

        <div className="flex flex-col gap-3">
          {/* Name field */}
          <div className="bg-surface rounded-[16px] px-4 py-3">
            <label
              className="block text-ink/45 mb-1"
              style={{
                fontSize: 10,
                fontWeight: 500,
                letterSpacing: "0.5px",
                textTransform: "uppercase",
              }}
            >
              Your name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 60))}
              placeholder="e.g. Pablo Abesada"
              className="w-full bg-transparent outline-none text-ink placeholder:text-ink/35"
              style={{ fontSize: 16, fontWeight: 400 }}
            />
          </div>

          {/* Username field */}
          <div className="bg-surface rounded-[16px] px-4 py-3">
            <label
              className="block text-ink/45 mb-1"
              style={{
                fontSize: 10,
                fontWeight: 500,
                letterSpacing: "0.5px",
                textTransform: "uppercase",
              }}
            >
              Username
            </label>
            <div className="flex items-center gap-2">
              <span className="text-ink/40" style={{ fontSize: 16 }}>
                @
              </span>
              <input
                value={username}
                onChange={(e) =>
                  handleUsernameChange(e.target.value.slice(0, 24))
                }
                placeholder="e.g. pablo_wakes"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                className="flex-1 bg-transparent outline-none text-ink placeholder:text-ink/35"
                style={{ fontSize: 16, fontWeight: 400 }}
              />
              <StatusIndicator status={status} />
            </div>
          </div>
        </div>

        <p
          className="text-soft mt-4"
          style={{ fontSize: 13, fontWeight: 400, lineHeight: 1.6 }}
        >
          Your username is how friends find you. You can change your name
          anytime but your username is permanent.
        </p>

        {status === "taken" && (
          <p
            className="text-orange mt-2"
            style={{ fontSize: 12, fontWeight: 500 }}
          >
            That username is already taken.
          </p>
        )}
        {status === "invalid" && (
          <p
            className="text-orange mt-2"
            style={{ fontSize: 12, fontWeight: 500 }}
          >
            Use only lowercase letters, numbers, and underscores.
          </p>
        )}

        <button
          onClick={submit}
          disabled={!canSubmit}
          className="press w-full mt-6 h-12 rounded-pill bg-yellow text-ink transition-opacity"
          style={{
            fontSize: 15,
            fontWeight: 600,
            opacity: canSubmit ? 1 : 0.6,
          }}
        >
          Let's go
        </button>
      </div>
    </div>
  );
};

const StatusIndicator = ({ status }: { status: UsernameStatus }) => {
  if (status === "checking") {
    return <Loader2 size={18} className="text-ink/40 animate-spin" />;
  }
  if (status === "available") {
    return (
      <span className="w-5 h-5 rounded-full bg-[hsl(140_60%_45%)] flex items-center justify-center">
        <Check size={12} className="text-card" strokeWidth={3} />
      </span>
    );
  }
  if (status === "taken" || status === "invalid") {
    return (
      <span className="w-5 h-5 rounded-full bg-orange flex items-center justify-center">
        <X size={12} className="text-card" strokeWidth={3} />
      </span>
    );
  }
  return <span className="w-5 h-5" />;
};

export default UsernameSetup;
