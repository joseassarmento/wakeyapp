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
import UsernameSetup from "@/components/wakey/UsernameSetup";
import { primeAudio, stopAlarmSound } from "@/lib/wakey-audio";
import { Rank, detectNewUnlocks } from "@/lib/wakey-ranks";

// Detect NFC-pod redirect (?stopped=true) at module load, before render.
// This guarantees any in-flight alarm audio is silenced immediately and the
// app boots straight into the success screen.
const STOPPED_FROM_URL = (() => {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  return params.get("stopped") === "true";
})();
if (STOPPED_FROM_URL) {
  // Signal any other open tab (the original alarm tab) to stop its audio
  // BEFORE we tear down our own context. The 300ms delay in showing the
  // success screen below gives the message time to reach the other tab.
  if (typeof window !== "undefined" && "BroadcastChannel" in window) {
    try {
      const ch = new BroadcastChannel("wakey_alarm");
      ch.postMessage("stop");
      ch.close();
    } catch (error) {
      console.warn("[wakey] BroadcastChannel post failed", error);
    }
  }
  stopAlarmSound();
}
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
  // Defer the success screen briefly when arriving via ?stopped=true so the
  // BroadcastChannel "stop" message has time to reach the original alarm tab.
  const [success, setSuccess] = useState<{ time: string } | null>(null);
  useEffect(() => {
    if (!STOPPED_FROM_URL) return;
    const t = window.setTimeout(() => {
      const now = new Date();
      const h = now.getHours();
      const period = h >= 12 ? "PM" : "AM";
      const h12 = h % 12 === 0 ? 12 : h % 12;
      setSuccess({
        time: `${h12}:${now.getMinutes().toString().padStart(2, "0")} ${period}`,
      });
    }, 300);
    return () => clearTimeout(t);
  }, []);
  const [unlockQueue, setUnlockQueue] = useState<Rank[]>([]);

  const [progress, setProgress] = useState<ProgressData>(() => loadProgress());
  const [user, setUser] = useState<UserProfile>(() => loadUser());

  const lastFireKeyRef = useRef<string | null>(null);
  const pendingSuccessRef = useRef<{ time: string } | null>(null);

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

  // Normalize weekly heatmap on mount: past days not "done" become "missed",
  // today stays "today" unless already done, future days stay "future".
  // Recompute streak from the cleaned array.
  useEffect(() => {
    const now = new Date();
    const ourDay = (now.getDay() + 6) % 7; // 0=Mon..6=Sun
    setProgress((p) => {
      const weekly = [...p.weekly] as ProgressData["weekly"];
      for (let i = 0; i < 7; i++) {
        if (i < ourDay && weekly[i] !== "done") weekly[i] = "missed";
        else if (i === ourDay && weekly[i] !== "done") weekly[i] = "today";
        else if (i > ourDay) weekly[i] = "future";
      }
      let streak = 0;
      for (let i = ourDay; i >= 0; i--) {
        if (weekly[i] === "done") streak++;
        else if (weekly[i] === "missed") break;
      }
      return { ...p, weekly, streak };
    });
  }, []);

  // Cross-tab stop signal: when another tab loads ?stopped=true, it broadcasts
  // "stop" on the "wakey_alarm" channel. This tab then tears down its audio
  // and jumps to the success screen — same end state as a local NFC tap.
  useEffect(() => {
    if (typeof window === "undefined" || !("BroadcastChannel" in window)) return;
    const ch = new BroadcastChannel("wakey_alarm");
    ch.onmessage = (event) => {
      if (event.data !== "stop") return;
      stopAlarmSound();
      const now = new Date();
      const h = now.getHours();
      const period = h >= 12 ? "PM" : "AM";
      const h12 = h % 12 === 0 ? 12 : h % 12;
      const label = `${h12}:${now.getMinutes().toString().padStart(2, "0")} ${period}`;
      // If an alarm was firing here, count it as a successful wake.
      if (firing) {
        handleSuccess();
      } else {
        setSuccess({ time: label });
      }
    };
    return () => ch.close();
  }, [firing]);

  // Alarm check loop
  useEffect(() => {
    const check = () => {
      // Don't open the firing modal if we landed via NFC redirect (?stopped=true)
      // — the success screen is already showing.
      if (STOPPED_FROM_URL && success) return;
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
    const newTotal = progress.totalMornings + 1;
    const ourDay = (now.getDay() + 6) % 7; // 0=Mon..6=Sun
    setProgress((p) => {
      const weekly = [...p.weekly];
      weekly[ourDay] = "done";
      // Recompute streak: walk back from today; "done" extends, "missed" breaks.
      let streak = 0;
      for (let i = ourDay; i >= 0; i--) {
        if (weekly[i] === "done") streak++;
        else if (weekly[i] === "missed") break;
      }
      return {
        ...p,
        totalMornings: p.totalMornings + 1,
        streak,
        lastWakeISO: now.toISOString(),
        weekly,
      };
    });
    setFiring(null);

    // Detect any newly unlocked ranks based on the new total
    const newly = detectNewUnlocks(newTotal);
    if (newly.length > 0) {
      setUnlockQueue(newly);
    } else {
      setSuccess({ time: label });
    }
    // Stash time for after unlock celebrations finish
    pendingSuccessRef.current = { time: label };
  };

  const handleEmergency = () => {
    setProgress((p) => ({
      ...p,
      emergencyExits: Math.max(0, p.emergencyExits - 1),
    }));
  };

  // Demo trigger — fires the first active alarm or a placeholder.
  // primeAudio() runs synchronously inside the click so the browser
  // grants AudioContext permission via the user gesture.
  const triggerDemo = () => {
    primeAudio();
    setFiring(alarms.find((a) => a.active) ?? alarms[0] ?? blankAlarm());
  };

  // First-launch onboarding gate: require a username before entering the app.
  // Skip when arriving via NFC pod redirect so the success screen always wins.
  if (!user.username && !STOPPED_FROM_URL) {
    return (
      <UsernameSetup
        onComplete={(name, username) => setUser({ ...user, name, username })}
      />
    );
  }

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
        {tab === "rank" && <RankScreen user={user} progress={progress} />}
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

      {unlockQueue.length > 0 && (
        <RankUnlock
          rank={unlockQueue[0]}
          onContinue={() => {
            setUnlockQueue((q) => {
              const next = q.slice(1);
              if (next.length === 0 && pendingSuccessRef.current) {
                setSuccess(pendingSuccessRef.current);
                pendingSuccessRef.current = null;
              }
              return next;
            });
          }}
        />
      )}

      {success && (
        <AlarmSuccess
          streak={progress.streak}
          wakeTimeLabel={success.time}
          onContinue={() => {
            setSuccess(null);
            setTab("alarm");
            // If we arrived via ?stopped=true, clean the URL so refreshes
            // don't keep re-triggering the success screen.
            if (window.location.search) {
              window.history.replaceState(null, "", window.location.pathname);
            }
          }}
        />
      )}
    </div>
  );
};

export default Index;
