import { useEffect, useRef, useState } from "react";
import { Pencil, ChevronRight, Camera, Lock, Moon, Mail, Check } from "lucide-react";
import { UserProfile, ProgressData } from "@/lib/wakey-storage";

interface MeScreenProps {
  user: UserProfile;
  onUserChange: (u: UserProfile) => void;
  progress: ProgressData;
}

export const MeScreen = ({ user, onUserChange, progress }: MeScreenProps) => {
  const [editing, setEditing] = useState(false);
  const [tempName, setTempName] = useState(user.name);
  const [tempEmail, setTempEmail] = useState(user.email ?? "");
  const [emailSaved, setEmailSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  // Keep local email synced if user changes externally
  useEffect(() => {
    setTempEmail(user.email ?? "");
  }, [user.email]);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(tempEmail.trim());
  const emailDirty = tempEmail.trim() !== (user.email ?? "").trim();

  const saveEmail = () => {
    if (!emailDirty) return;
    if (tempEmail.trim() === "" || emailValid) {
      onUserChange({ ...user, email: tempEmail.trim() });
      setEmailSaved(true);
      window.setTimeout(() => setEmailSaved(false), 1500);
    }
  };

  // Sync the dark class on <html> with the user's preference
  useEffect(() => {
    document.documentElement.classList.toggle("dark", !!user.darkMode);
  }, [user.darkMode]);

  const initial = user.name.charAt(0).toUpperCase() || "W";

  const saveName = () => {
    onUserChange({ ...user, name: tempName.trim() || "Wakey" });
    setEditing(false);
  };

  const handleAvatarPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      // Downscale to avoid bloating localStorage
      const img = new Image();
      img.onload = () => {
        const max = 256;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          onUserChange({ ...user, avatar: result });
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        onUserChange({ ...user, avatar: dataUrl });
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
    // reset so picking the same file again still triggers change
    e.target.value = "";
  };

  return (
    <div className="pb-32 px-5 pt-8 animate-fade-in">
      {/* Avatar */}
      <div className="flex flex-col items-center gap-2 mb-6 animate-scale-in">
        <button
          onClick={() => fileRef.current?.click()}
          className="press relative w-20 h-20 rounded-full overflow-hidden bg-yellow flex items-center justify-center text-ink"
          style={{ fontSize: 32, fontWeight: 600 }}
          aria-label="Change profile picture"
        >
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={`${user.name}'s profile`}
              className="w-full h-full object-cover"
            />
          ) : (
            initial
          )}
          <span className="absolute left-1/2 -translate-x-1/2 bottom-1 w-6 h-6 rounded-full bg-ink text-card flex items-center justify-center shadow-card">
            <Camera size={12} />
          </span>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={handleAvatarPick}
          className="hidden"
        />
        <div className="flex flex-col items-center gap-1 mt-1 w-full">
          {editing ? (
            <input
              autoFocus
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              onBlur={saveName}
              onKeyDown={(e) => e.key === "Enter" && saveName()}
              className="bg-transparent border-b-[1.5px] border-ink/20 focus:border-yellow outline-none text-center text-ink"
              style={{ fontSize: 22, fontWeight: 600 }}
            />
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-ink" style={{ fontSize: 22, fontWeight: 600 }}>
                {user.name}
              </span>
              <button
                onClick={() => {
                  setTempName(user.name);
                  setEditing(true);
                }}
                className="press text-ink/50"
                aria-label="Edit name"
              >
                <Pencil size={16} />
              </button>
            </div>
          )}
          {user.username && (
            <span
              className="text-soft"
              style={{ fontSize: 15, fontWeight: 400 }}
            >
              @{user.username}
            </span>
          )}
        </div>
      </div>

      {/* Username locked row */}
      {user.username && (
        <div className="bg-card rounded-[16px] shadow-card px-5 py-4 mb-2 flex items-center justify-between animate-slide-up stagger-1">
          <div className="flex flex-col">
            <span
              className="text-ink/45"
              style={{
                fontSize: 10,
                fontWeight: 500,
                letterSpacing: "0.5px",
                textTransform: "uppercase",
              }}
            >
              Username
            </span>
            <span
              className="text-ink mt-0.5"
              style={{ fontSize: 16, fontWeight: 500 }}
            >
              @{user.username}
            </span>
            <span
              className="text-ink/40 mt-1"
              style={{ fontSize: 12, fontWeight: 400 }}
            >
              Username cannot be changed
            </span>
          </div>
          <Lock size={16} className="text-ink/35" />
        </div>
      )}

      {/* Email field */}
      <div className="bg-card rounded-[16px] shadow-card px-5 py-4 mb-2 animate-slide-up stagger-1">
        <div className="flex items-center justify-between mb-1">
          <span
            className="text-ink/45"
            style={{
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: "0.5px",
              textTransform: "uppercase",
            }}
          >
            Email
          </span>
          {emailSaved && (
            <span
              className="flex items-center gap-1 text-[hsl(140_60%_45%)]"
              style={{ fontSize: 11, fontWeight: 500 }}
            >
              <Check size={12} strokeWidth={3} /> Saved
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Mail size={16} className="text-ink/40 shrink-0" />
          <input
            type="email"
            inputMode="email"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            value={tempEmail}
            onChange={(e) => setTempEmail(e.target.value)}
            onBlur={saveEmail}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                (e.target as HTMLInputElement).blur();
              }
            }}
            placeholder="you@example.com"
            className="flex-1 bg-transparent outline-none text-ink placeholder:text-ink/35"
            style={{ fontSize: 16, fontWeight: 500 }}
          />
        </div>
        {tempEmail.trim() !== "" && !emailValid && (
          <span
            className="text-orange mt-1 block"
            style={{ fontSize: 12, fontWeight: 500 }}
          >
            Enter a valid email address
          </span>
        )}
        {tempEmail.trim() === "" && (
          <span
            className="text-ink/40 mt-1 block"
            style={{ fontSize: 12, fontWeight: 400 }}
          >
            Used for account recovery and notifications
          </span>
        )}
      </div>

      <div className="space-y-2 animate-slide-up stagger-2">
        <Row
          label="Notifications"
          right={
            <Toggle
              on={user.notifications}
              onChange={(v) => onUserChange({ ...user, notifications: v })}
            />
          }
        />

        <Row
          label={
            <span className="flex items-center gap-2">
              <Moon size={15} className="text-ink/55" />
              Dark mode
            </span>
          }
          right={
            <Toggle
              on={user.darkMode}
              onChange={(v) => onUserChange({ ...user, darkMode: v })}
            />
          }
        />

        <Row
          label="Pod pairing"
          right={
            <button
              onClick={() => onUserChange({ ...user, podPaired: !user.podPaired })}
              className="press flex items-center gap-1 text-soft"
              style={{ fontSize: 14 }}
            >
              {user.podPaired ? "Paired" : "Not paired"}
              <ChevronRight size={16} />
            </button>
          }
        />
        <Row
          label="Emergency exits"
          right={
            <span
              className="bg-orange/15 text-orange px-2.5 py-1 rounded-pill"
              style={{ fontSize: 12, fontWeight: 500 }}
            >
              {progress.emergencyExits} remaining
            </span>
          }
        />
      </div>

      <p className="text-center text-soft mt-8" style={{ fontSize: 12 }}>
        Wakey · No snooze. Just mornings.
      </p>
    </div>
  );
};

const Row = ({ label, right }: { label: React.ReactNode; right: React.ReactNode }) => (
  <div className="bg-card rounded-[16px] shadow-card flex items-center justify-between px-5 py-4">
    <span className="text-ink" style={{ fontSize: 15, fontWeight: 500 }}>
      {label}
    </span>
    {right}
  </div>
);

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

export default MeScreen;
