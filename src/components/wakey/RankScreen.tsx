import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  UserProfile,
  ProgressData,
  DEMO_USERS,
  loadFriends,
  saveFriends,
} from "@/lib/wakey-storage";
import { getRank } from "@/lib/wakey-ranks";
import Mascot from "./Mascot";

type TabId = "global" | "friends";

interface RankScreenProps {
  user?: UserProfile;
  progress?: ProgressData;
}

interface Player {
  id: string;
  name: string;
  username: string; // without @
  mornings: number;
  isMe?: boolean;
}

const GLOBAL_BASE: Player[] = [
  { id: "g1", name: "Aiko Tanaka", username: "aiko_tnk", mornings: 412 },
  { id: "g2", name: "Marco Reyes", username: "marco_r", mornings: 388 },
  { id: "g3", name: "Lena Park", username: "lena_pk", mornings: 356 },
  { id: "g4", name: "Sara Ali", username: "sara_ali", mornings: 41 },
  { id: "g5", name: "Theo N.", username: "theo_n", mornings: 33 },
  { id: "g6", name: "Mei Lin", username: "mei_lin", mornings: 28 },
];

const initial = (s: string) => (s.trim()[0] || "?").toUpperCase();

export const RankScreen = ({ user, progress }: RankScreenProps = {}) => {
  const [tab, setTab] = useState<TabId>("global");
  const [friends, setFriends] = useState<string[]>(() => loadFriends());
  const [search, setSearch] = useState("");
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  const myUsername = user?.username || "you";
  const myName = user?.name || "You";
  const myMornings = progress?.totalMornings ?? 0;

  const me: Player = {
    id: "me",
    name: myName,
    username: myUsername,
    mornings: myMornings,
    isMe: true,
  };

  const globalList = useMemo(
    () => [...GLOBAL_BASE, me].sort((a, b) => b.mornings - a.mornings),
    [myMornings, myUsername, myName],
  );

  const friendPlayers: Player[] = useMemo(() => {
    const matched = friends
      .map((u) => DEMO_USERS.find((d) => d.username === u))
      .filter(Boolean)
      .map((d) => ({
        id: `f-${d!.username}`,
        name: d!.name,
        username: d!.username,
        mornings: d!.mornings,
      }));
    return [...matched, me].sort((a, b) => b.mornings - a.mornings);
  }, [friends, myMornings, myUsername, myName]);

  const totalGlobal = globalList.reduce((s, p) => s + p.mornings, 0);

  const searchActive = search.trim().length > 0;
  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase().replace(/^@/, "");
    if (!q) return [];
    return DEMO_USERS.filter((d) => d.username.includes(q));
  }, [search]);

  const addFriend = (username: string) => {
    if (friends.includes(username)) return;
    const next = [...friends, username];
    setFriends(next);
    saveFriends(next);
  };

  const removeFriend = (username: string) => {
    const next = friends.filter((u) => u !== username);
    setFriends(next);
    saveFriends(next);
    setConfirmRemove(null);
  };

  return (
    <div className="pb-32 px-5 pt-6 animate-fade-in">
      <h1 className="text-ink mb-5" style={{ fontSize: 26, fontWeight: 600 }}>
        Rank
      </h1>

      {/* Tab pills */}
      <div className="bg-surface rounded-pill p-1 flex mb-5">
        {(["global", "friends"] as TabId[]).map((t) => (
          <button
            key={t}
            onClick={() => {
              setTab(t);
              setSearch("");
            }}
            className={cn(
              "press flex-1 py-2.5 rounded-pill capitalize transition-colors",
              tab === t ? "bg-ink text-card" : "text-ink/60",
            )}
            style={{ fontSize: 14, fontWeight: 500 }}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "global" && (
        <>
          <div className="bg-yellow rounded-[24px] p-5 mb-5 text-center">
            <div className="label-caps text-ink/70 mb-1">
              Total mornings saved
            </div>
            <div
              className="text-ink"
              style={{ fontSize: 40, fontWeight: 600, letterSpacing: "-1px" }}
            >
              {totalGlobal.toLocaleString()}
            </div>
          </div>
          <LeaderboardList list={globalList} userAvatar={user?.avatar} />
        </>
      )}

      {tab === "friends" && (
        <>
          <SearchBar value={search} onChange={setSearch} />

          {searchActive ? (
            <SearchResults
              results={searchResults}
              friends={friends}
              onAdd={addFriend}
            />
          ) : friends.length === 0 ? (
            <div className="flex flex-col items-center pt-10 gap-4">
              <Mascot variant="happy" size={120} />
              <p
                className="text-soft text-center px-6"
                style={{ fontSize: 15, fontWeight: 400 }}
              >
                No friends yet. Search by @username to add people.
              </p>
            </div>
          ) : (
            <FriendsLeaderboard
              list={friendPlayers}
              userAvatar={user?.avatar}
              onLongPress={(username) => {
                if (username !== myUsername) setConfirmRemove(username);
              }}
            />
          )}
        </>
      )}

      {confirmRemove && (
        <RemoveConfirmSheet
          username={confirmRemove}
          onCancel={() => setConfirmRemove(null)}
          onConfirm={() => removeFriend(confirmRemove)}
        />
      )}
    </div>
  );
};

const Avatar = ({
  username,
  src,
  size = 38,
}: {
  username: string;
  src?: string;
  size?: number;
}) => (
  <div
    className="rounded-full bg-yellow flex items-center justify-center text-ink overflow-hidden flex-shrink-0"
    style={{ width: size, height: size, fontSize: size * 0.42, fontWeight: 600 }}
  >
    {src ? (
      <img src={src} alt={`@${username} avatar`} className="w-full h-full object-cover" />
    ) : (
      initial(username)
    )}
  </div>
);

const LeaderboardList = ({
  list,
  userAvatar,
}: {
  list: Player[];
  userAvatar?: string;
}) => (
  <ul className="space-y-2.5 animate-fade-in">
    {list.map((p, i) => {
      const rank = i + 1;
      const isFirst = rank === 1;
      return (
        <li
          key={p.id}
          className={cn(
            "rounded-[16px] shadow-card flex items-center gap-3 px-4 py-3 animate-slide-up transition-smooth",
            isFirst ? "bg-yellow" : "bg-card",
            p.isMe && !isFirst && "ring-2 ring-yellow",
          )}
          style={{ animationDelay: `${Math.min(i, 6) * 40}ms` }}
        >
          <div
            className="w-7 text-center text-ink/70"
            style={{ fontSize: 14, fontWeight: 500 }}
          >
            {rank}
          </div>
          <Avatar username={p.username} src={p.isMe ? userAvatar : undefined} />
          <div className="flex-1 flex items-center gap-2 text-ink" style={{ fontSize: 15, fontWeight: 500 }}>
            <span>@{p.username}</span>
            {p.isMe && (
              <span
                className="text-ink/60 bg-ink/10 rounded-pill px-2 py-0.5"
                style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.5px" }}
              >
                YOU
              </span>
            )}
          </div>
          <div className="text-soft" style={{ fontSize: 13, fontWeight: 400 }}>
            {p.mornings}
          </div>
        </li>
      );
    })}
  </ul>
);

const FriendsLeaderboard = ({
  list,
  userAvatar,
  onLongPress,
}: {
  list: Player[];
  userAvatar?: string;
  onLongPress: (username: string) => void;
}) => {
  const timerRef = useRef<number | null>(null);

  const startPress = (username: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => onLongPress(username), 550);
  };
  const endPress = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  return (
    <ul className="space-y-2.5 mt-4">
      {list.map((p, i) => {
        const rank = getRank(p.mornings);
        return (
          <li
            key={p.id}
            onPointerDown={() => !p.isMe && startPress(p.username)}
            onPointerUp={endPress}
            onPointerLeave={endPress}
            onPointerCancel={endPress}
            className={cn(
              "rounded-[16px] shadow-card bg-card flex items-center gap-3 px-4 py-3 select-none animate-slide-up transition-smooth",
              p.isMe && "ring-2 ring-yellow",
            )}
            style={{ animationDelay: `${Math.min(i, 6) * 40}ms` }}
          >
            <div
              className="w-7 text-center text-ink/70"
              style={{ fontSize: 14, fontWeight: 500 }}
            >
              {i + 1}
            </div>
            <Avatar
              username={p.username}
              src={p.isMe ? userAvatar : undefined}
            />
            <div className="flex-1 min-w-0">
              <div
                className="text-ink flex items-center gap-2"
                style={{ fontSize: 15, fontWeight: 500 }}
              >
                <span className="truncate">@{p.username}</span>
                {p.isMe && (
                  <span
                    className="text-ink/60 bg-ink/10 rounded-pill px-2 py-0.5"
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      letterSpacing: "0.5px",
                    }}
                  >
                    YOU
                  </span>
                )}
              </div>
              <span
                className="rounded-pill px-2 py-0.5 inline-block mt-1 text-card"
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  backgroundColor: rank.color,
                }}
              >
                {rank.name}
              </span>
            </div>
            <div className="text-soft" style={{ fontSize: 13, fontWeight: 400 }}>
              {p.mornings}
            </div>
          </li>
        );
      })}
    </ul>
  );
};

const SearchBar = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) => (
  <div className="relative bg-card rounded-pill shadow-card flex items-center px-4 h-12 mb-2">
    <Search size={16} className="text-ink/40 mr-2" />
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Search by @username"
      autoCapitalize="none"
      autoCorrect="off"
      spellCheck={false}
      className="flex-1 bg-transparent outline-none text-ink placeholder:text-ink/35"
      style={{ fontSize: 14, fontWeight: 400 }}
    />
    {value && (
      <button
        onClick={() => onChange("")}
        aria-label="Clear search"
        className="press text-ink/40"
      >
        <X size={16} />
      </button>
    )}
  </div>
);

const SearchResults = ({
  results,
  friends,
  onAdd,
}: {
  results: { name: string; username: string; mornings: number }[];
  friends: string[];
  onAdd: (username: string) => void;
}) => {
  if (results.length === 0) {
    return (
      <p
        className="text-soft text-center mt-8"
        style={{ fontSize: 13, fontWeight: 400 }}
      >
        No user found with that username
      </p>
    );
  }
  return (
    <ul className="space-y-2.5 mt-4">
      {results.map((u) => {
        const added = friends.includes(u.username);
        return (
          <li
            key={u.username}
            className="bg-card rounded-[16px] shadow-card flex items-center gap-3 px-4 py-3"
          >
            <Avatar username={u.username} />
            <div className="flex-1 min-w-0">
              <div
                className="text-ink truncate"
                style={{ fontSize: 15, fontWeight: 500 }}
              >
                @{u.username}
              </div>
              <div
                className="text-soft truncate"
                style={{ fontSize: 13, fontWeight: 400 }}
              >
                {u.name}
              </div>
            </div>
            <div className="text-soft" style={{ fontSize: 13, fontWeight: 400 }}>
              {u.mornings}
            </div>
            {added ? (
              <span
                className="bg-surface text-ink/55 rounded-pill"
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  padding: "8px 14px",
                }}
              >
                Friends
              </span>
            ) : (
              <button
                onClick={() => onAdd(u.username)}
                className="press bg-yellow text-ink rounded-pill"
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  padding: "8px 14px",
                }}
              >
                Add
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
};

const RemoveConfirmSheet = ({
  username,
  onCancel,
  onConfirm,
}: {
  username: string;
  onCancel: () => void;
  onConfirm: () => void;
}) => {
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    requestAnimationFrame(() => setEntered(true));
  }, []);
  const close = () => {
    setEntered(false);
    setTimeout(onCancel, 280);
  };
  const confirm = () => {
    setEntered(false);
    setTimeout(onConfirm, 280);
  };
  return (
    <div
      className={cn(
        "fixed inset-0 z-[70] flex items-end justify-center transition-opacity duration-[280ms]",
        entered ? "opacity-100" : "opacity-0",
      )}
    >
      <div
        className="absolute inset-0 bg-ink/40"
        onClick={close}
        aria-hidden
      />
      <div
        className="relative w-full max-w-[430px] bg-card rounded-t-[28px] shadow-card pb-8 transition-transform duration-[280ms] ease-out"
        style={{ transform: entered ? "translateY(0)" : "translateY(100%)" }}
      >
        <div className="flex justify-center pt-3 pb-1">
          <span className="block w-10 h-1 rounded-full bg-ink/15" />
        </div>
        <h3
          className="text-ink px-5 pt-3 pb-2 text-center"
          style={{ fontSize: 18, fontWeight: 600 }}
        >
          Remove @{username}?
        </h3>
        <p
          className="text-soft text-center px-6 pb-5"
          style={{ fontSize: 13, fontWeight: 400 }}
        >
          They won't appear in your friends leaderboard anymore.
        </p>
        <div className="px-5 flex flex-col gap-2">
          <button
            onClick={confirm}
            className="press w-full h-12 rounded-pill text-orange bg-orange/10"
            style={{ fontSize: 15, fontWeight: 600 }}
          >
            Remove
          </button>
          <button
            onClick={close}
            className="press w-full h-12 rounded-pill text-ink/70"
            style={{ fontSize: 15, fontWeight: 500 }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default RankScreen;
