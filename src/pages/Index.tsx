import { useEffect, useRef, useState } from "react";
import BottomNav, { Tab } from "@/components/wakey/BottomNav";
import AlarmScreen from "@/components/wakey/AlarmScreen";
import RankScreen from "@/components/wakey/RankScreen";
import ProgressScreen from "@/components/wakey/ProgressScreen";
import MeScreen from "@/components/wakey/MeScreen";
import AlarmFiring from "@/components/wakey/AlarmFiring";
import AlarmSuccess from "@/components/wakey/AlarmSuccess";
import {
  loadAlarm,
  loadProgress,
  loadUser,
  saveProgress,
  saveUser,
  ProgressData,
  UserProfile,
} from "@/lib/wakey-storage";

const Index = () => {
  const [tab, setTab] = useState<Tab>("alarm");
  const [firing, setFiring] = useState(false);
  const [success, setSuccess] = useState<{ time: string } | null>(null);

  const [progress, setProgress] = useState<ProgressData>(() => loadProgress());
  const [user, setUser] = useState<UserProfile>(() => loadUser());

  const lastFireKeyRef = useRef<string | null>(null);

  // SEO basics
  useEffect(() => {
    document.title = "Wakey — No-snooze NFC alarm";
    const setMeta = (name: string, content: string) => {
      let m = document.querySelector(`meta[name="${name}"]`);
      if (!m) {
        m = document.createElement("meta");
        m.setAttribute("name", name);
        document.head.appendChild(m);
      }
      m.setAttribute("content", content);
    };
    setMeta(
      "description",
      "Wakey is a no-snooze alarm that only stops when you tap an NFC pod. Build mornings you actually win."
    );
    let canon = document.querySelector('link[rel="canonical"]');
    if (!canon) {
      canon = document.createElement("link");
      canon.setAttribute("rel", "canonical");
      document.head.appendChild(canon);
    }
    canon.setAttribute("href", window.location.origin + "/");
  }, []);

  useEffect(() => saveProgress(progress), [progress]);
  useEffect(() => saveUser(user), [user]);

  // Apply dark mode preference
  useEffect(() => {
    document.documentElement.classList.toggle("dark", user.darkMode);
  }, [user.darkMode]);

  // Alarm check loop
  useEffect(() => {
    const check = () => {
      const a = loadAlarm();
      if (!a.enabled) return;
      const now = new Date();
      const jsDay = now.getDay(); // 0=Sun..6=Sat
      const ourDay = (jsDay + 6) % 7; // 0=Mon..6=Sun
      if (!a.days.includes(ourDay)) return;
      if (now.getHours() !== a.hour || now.getMinutes() !== a.minute) return;
      const key = `${now.toDateString()}-${a.hour}:${a.minute}`;
      if (lastFireKeyRef.current === key) return;
      lastFireKeyRef.current = key;
      setFiring(true);
    };
    check();
    const id = window.setInterval(check, 30000);
    return () => clearInterval(id);
  }, []);

  const handleSuccess = () => {
    const now = new Date();
    const h = now.getHours();
    const period = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 === 0 ? 12 : h % 12;
    const label = `${h12}:${now.getMinutes().toString().padStart(2, "0")} ${period}`;
    setProgress((p) => ({
      ...p,
      totalMornings: p.totalMornings + 1,
      streak: p.streak + 1,
      lastWakeISO: now.toISOString(),
    }));
    setFiring(false);
    setSuccess({ time: label });
  };

  const handleEmergency = () => {
    setProgress((p) => ({
      ...p,
      emergencyExits: Math.max(0, p.emergencyExits - 1),
    }));
  };

  // Demo trigger button (only visible on alarm tab) — helps users test without waiting
  const triggerDemo = () => setFiring(true);

  return (
    <div className="bg-background min-h-screen">
      <main className="app-shell bg-background">
        {tab === "alarm" && (
          <>
            <AlarmScreen />
            <button
              onClick={triggerDemo}
              className="press fixed bottom-28 right-5 z-30 bg-ink text-card rounded-pill px-4 py-2 shadow-card"
              style={{ fontSize: 12, fontWeight: 500 }}
              aria-label="Trigger demo alarm"
            >
              ▶ Demo alarm
            </button>
          </>
        )}
        {tab === "rank" && <RankScreen />}
        {tab === "progress" && <ProgressScreen progress={progress} user={user} />}
        {tab === "me" && (
          <MeScreen user={user} onUserChange={setUser} progress={progress} />
        )}

        <BottomNav active={tab} onChange={setTab} />
      </main>

      {firing && (
        <AlarmFiring
          onSuccess={handleSuccess}
          onEmergencyExit={handleEmergency}
          emergencyExitsLeft={progress.emergencyExits}
        />
      )}

      {success && (
        <AlarmSuccess
          streak={progress.streak}
          wakeTimeLabel={success.time}
          onContinue={() => {
            setSuccess(null);
            setTab("alarm");
          }}
        />
      )}
    </div>
  );
};

export default Index;
