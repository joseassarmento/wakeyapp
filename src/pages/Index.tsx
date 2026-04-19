import { useEffect, useRef, useState } from "react";
import BottomNav, { Tab } from "@/components/wakey/BottomNav";
import AlarmList from "@/components/wakey/AlarmList";
import AlarmEdit from "@/components/wakey/AlarmEdit";
import RankScreen from "@/components/wakey/RankScreen";
import ProgressScreen from "@/components/wakey/ProgressScreen";
import MeScreen from "@/components/wakey/MeScreen";
import AlarmFiring from "@/components/wakey/AlarmFiring";
import AlarmSuccess from "@/components/wakey/AlarmSuccess";
import RankUnlock from "@/components/wakey/RankUnlock";
import { Rank, detectNewUnlocks } from "@/lib/wakey-ranks";
import {
  Alarm,
  loadAlarms,
  saveAlarms,
  loadProgress,
  loadUser,
  saveProgress,
  saveUser,
  newAlarmId,
  ProgressData,
  UserProfile,
} from "@/lib/wakey-storage";

const blankAlarm = (): Alarm => ({
  id: newAlarmId(),
  name: "",
  time: "07:00",
  days: [0, 1, 2, 3, 4],
  ringtone: "Sunrise",
  vibration: true,
  active: true,
});

const Index = () => {
  const [tab, setTab] = useState<Tab>("alarm");
  const [alarms, setAlarms] = useState<Alarm[]>(() => loadAlarms());

  const [editing, setEditing] = useState<{ alarm: Alarm; isNew: boolean } | null>(
    null
  );

  const [firing, setFiring] = useState<Alarm | null>(null);
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

  useEffect(() => saveAlarms(alarms), [alarms]);
  useEffect(() => saveProgress(progress), [progress]);
  useEffect(() => saveUser(user), [user]);

  // Alarm check loop
  useEffect(() => {
    const check = () => {
      const list = loadAlarms();
      const now = new Date();
      const jsDay = now.getDay(); // 0=Sun..6=Sat
      const ourDay = (jsDay + 6) % 7; // 0=Mon..6=Sun
      const hh = now.getHours();
      const mm = now.getMinutes();
      const nowTime = `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;

      const match = list.find(
        (a) => a.active && a.days.includes(ourDay) && a.time === nowTime
      );
      if (!match) return;

      const key = `${now.toDateString()}-${match.id}-${match.time}`;
      if (lastFireKeyRef.current === key) return;
      lastFireKeyRef.current = key;
      setFiring(match);
    };
    check();
    const id = window.setInterval(check, 30000);
    return () => clearInterval(id);
  }, []);

  // Alarm CRUD
  const upsertAlarm = (a: Alarm) =>
    setAlarms((list) => {
      const idx = list.findIndex((x) => x.id === a.id);
      if (idx === -1) return [...list, a];
      const next = [...list];
      next[idx] = a;
      return next;
    });

  const deleteAlarm = (id: string) =>
    setAlarms((list) => list.filter((x) => x.id !== id));

  const toggleAlarm = (id: string, active: boolean) =>
    setAlarms((list) => list.map((x) => (x.id === id ? { ...x, active } : x)));

  const openNew = () => setEditing({ alarm: blankAlarm(), isNew: true });
  const openEdit = (id: string) => {
    const a = alarms.find((x) => x.id === id);
    if (a) setEditing({ alarm: a, isNew: false });
  };

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
    setFiring(null);
    setSuccess({ time: label });
  };

  const handleEmergency = () => {
    setProgress((p) => ({
      ...p,
      emergencyExits: Math.max(0, p.emergencyExits - 1),
    }));
  };

  // Demo trigger — fires the first active alarm or a placeholder
  const triggerDemo = () =>
    setFiring(alarms.find((a) => a.active) ?? alarms[0] ?? blankAlarm());

  return (
    <div className="bg-background min-h-screen">
      <main className="app-shell bg-background">
        {tab === "alarm" && (
          <>
            <AlarmList
              alarms={alarms}
              onToggle={toggleAlarm}
              onOpen={openEdit}
              onCreate={openNew}
            />
            <button
              onClick={triggerDemo}
              className="press fixed bottom-44 right-5 z-30 bg-ink text-card rounded-pill px-4 py-2 shadow-card"
              style={{ fontSize: 12, fontWeight: 500 }}
              aria-label="Trigger demo alarm"
            >
              ▶ Demo alarm
            </button>
          </>
        )}
        {tab === "rank" && <RankScreen user={user} />}
        {tab === "progress" && <ProgressScreen progress={progress} user={user} />}
        {tab === "me" && (
          <MeScreen user={user} onUserChange={setUser} progress={progress} />
        )}

        <BottomNav active={tab} onChange={setTab} />
      </main>

      {editing && (
        <AlarmEdit
          initial={editing.alarm}
          isNew={editing.isNew}
          onClose={() => setEditing(null)}
          onSave={upsertAlarm}
          onDelete={deleteAlarm}
        />
      )}

      {firing && (
        <AlarmFiring
          alarmName={firing.name}
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
