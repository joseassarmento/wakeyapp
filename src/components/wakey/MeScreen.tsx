import { useRef, useState } from "react";
import { Pencil, ChevronRight, Camera } from "lucide-react";
import { UserProfile, ProgressData } from "@/lib/wakey-storage";

interface MeScreenProps {
  user: UserProfile;
  onUserChange: (u: UserProfile) => void;
  progress: ProgressData;
}

export const MeScreen = ({ user, onUserChange, progress }: MeScreenProps) => {
  const [editing, setEditing] = useState(false);
  const [tempName, setTempName] = useState(user.name);
  const fileRef = useRef<HTMLInputElement | null>(null);

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
      <div className="flex flex-col items-center gap-2 mb-6">
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
        <div className="flex items-center gap-2 mt-1">
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
            <>
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
            </>
          )}
        </div>
      </div>

      <div className="space-y-2">
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

const Row = ({ label, right }: { label: string; right: React.ReactNode }) => (
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
