import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import NavBar from '../components/NavBar';
import AiChat from '../components/AiChat';
import SideBar from '../components/SideBar';
import Footer from '../components/Footer';
import { apiFetch } from '../api/client';

const GRADIENTS = [
  "linear-gradient(135deg,#7c3aed,#a78bfa)",
  "linear-gradient(135deg,#b45309,#fbbf24)",
  "linear-gradient(135deg,#92400e,#d97706)",
  "linear-gradient(135deg,#0369a1,#38bdf8)",
  "linear-gradient(135deg,#be185d,#f472b6)",
  "linear-gradient(135deg,#15803d,#4ade80)",
];

function leagueFromXp(xp) {
  const x = Number(xp) || 0;
  if (x >= 8000) return 'Diamond League';
  if (x >= 4000) return 'Platinum League';
  if (x >= 2000) return 'Gold League';
  if (x >= 800) return 'Silver League';
  return 'Bronze League';
}

function emojiForName(name) {
  const emojis = ['🎓', '📚', '✨', '🌟', '💬', '🎯', '🧑', '👩', '👨'];
  const s = String(name || 'x');
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h + s.charCodeAt(i) * (i + 1)) % emojis.length;
  return emojis[h];
}

function bgForIndex(i) {
  return GRADIENTS[i % GRADIENTS.length];
}

const leagueBadgeStyle = {
  display: "inline-block",
  padding: "3px 10px",
  borderRadius: "6px",
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.12)",
  fontSize: "12px",
  fontWeight: "600",
  color: "#cbd5e1",
};

export default function LeaderboardPage() {
  const navigate = useNavigate();
  const [payload, setPayload] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await apiFetch("/api/leaderboard?limit=50");
        if (!cancelled) {
          setPayload(data);
          setLoadError("");
        }
      } catch (e) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : "Could not load leaderboard");
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const rows = payload?.leaderboard ?? [];
  const you = payload?.you;

  const podiumTriple = useMemo(() => {
    if (rows.length >= 3) return [rows[1], rows[0], rows[2]];
    if (rows.length === 2) return [rows[1], rows[0], null];
    if (rows.length === 1) return [null, rows[0], null];
    return [null, null, null];
  }, [rows]);

  const tableRows = rows.length > 3 ? rows.slice(3) : [];

  const topXp = rows[0]?.xp || 0;
  const pctVsLeader =
    topXp > 0 && you?.xp != null
      ? Math.min(100, Math.round((Number(you.xp) / topXp) * 100))
      : 0;

  const headerBlurb =
    you && rows.length > 0
      ? `You are #${you.rank} of ${you.total_users} learners by total XP (lessons + notes). Keep completing lessons to climb.`
      : "Rankings use total XP from lesson completions (with score bonuses) and saved notes.";

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0f1623",
      fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
      color: "#e2e8f0",
      display: "flex",
      flexDirection: "column",
    }}>
      <NavBar />

      <div style={{ display: isMobile ? "block" : "flex", flex: 1, minHeight: 0 }}>
        <SideBar />

        <main style={{
          flex: 1,
          overflowY: "auto",
          background: "#0f1623",
          padding: isMobile ? "16px 12px 40px" : "32px 32px 80px",
          boxSizing: "border-box",
        }}>
          <div style={{ maxWidth: "980px", paddingLeft: isMobile ? 0 : "5%" }}>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px", gap: "16px", flexWrap: "wrap" }}>
              <div>
                <h1 style={{ margin: "0 0 8px", fontSize: "26px", fontWeight: "800", letterSpacing: "-0.02em", color: "#f1f5f9" }}>
                  Global XP leaderboard
                </h1>
                <p style={{ margin: 0, fontSize: "13.5px", color: "#6b7280", lineHeight: "1.6", maxWidth: "520px" }}>
                  {headerBlurb}
                </p>
                {loadError && (
                  <p style={{ margin: "12px 0 0", color: "#f87171", fontSize: "14px" }}>{loadError}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => navigate("/analytics")}
                style={{
                  padding: "10px 22px",
                  borderRadius: "10px",
                  border: "none",
                  background: "#2563eb",
                  color: "#fff",
                  fontWeight: "700",
                  fontSize: "13px",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                View my stats
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1.18fr 1fr", gap: "12px", marginBottom: "20px", alignItems: "flex-end" }}>
              {podiumTriple.map((p, idx) => {
                const isCenter = idx === 1;
                if (!p) {
                  return (
                    <div key={`empty-${idx}`} style={{ minHeight: isCenter ? 120 : 80, borderRadius: "16px", border: "1px dashed rgba(255,255,255,0.08)" }} />
                  );
                }
                const isFirst = p.rank === 1;
                return (
                  <div key={p.user_id} style={{
                    background: isFirst ? "rgba(37,99,235,0.12)" : "rgba(255,255,255,0.04)",
                    border: isFirst ? "1px solid rgba(59,130,246,0.45)" : "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "16px",
                    padding: isFirst ? "24px 16px 20px" : "20px 14px 18px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "8px",
                  }}>
                    <div style={{ fontSize: isFirst ? "28px" : "22px", lineHeight: 1 }}>
                      {isFirst ? "🏅" : p.rank === 2 ? "🥈" : "🥉"}
                    </div>
                    <div style={{
                      width: isFirst ? "72px" : "58px",
                      height: isFirst ? "72px" : "58px",
                      borderRadius: "50%",
                      background: bgForIndex(p.rank),
                      border: isFirst ? "3px solid #3b82f6" : "2px solid rgba(255,255,255,0.15)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: isFirst ? "30px" : "24px",
                    }}>
                      {emojiForName(p.username)}
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: isFirst ? "15px" : "13px", fontWeight: "800", color: "#f1f5f9", marginBottom: "2px" }}>
                        {p.username}{p.is_you ? " (you)" : ""}
                      </div>
                      <div style={{ fontSize: "11px", fontWeight: "600", color: isFirst ? "#60a5fa" : "#6b7280" }}>
                        {leagueFromXp(p.xp)}
                      </div>
                    </div>
                    <div style={{
                      width: "100%", textAlign: "center",
                      background: isFirst ? "#2563eb" : "rgba(255,255,255,0.06)",
                      border: isFirst ? "none" : "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "8px", padding: "8px 6px",
                    }}>
                      <span style={{ fontSize: isFirst ? "20px" : "16px", fontWeight: "800", color: isFirst ? "#fff" : "#60a5fa" }}>
                        {Number(p.xp).toLocaleString()}
                      </span>
                      <span style={{ fontSize: "10px", fontWeight: "700", color: isFirst ? "rgba(255,255,255,0.65)" : "#475569", marginLeft: "4px" }}>
                        XP
                      </span>
                    </div>
                    <div style={{ fontSize: "12px", color: "#f97316", fontWeight: "600" }}>
                      🔥 {p.streak_days} day streak
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{
              background: "#111827",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "14px",
              overflowX: "auto",
              marginBottom: "16px",
            }}>
              <div style={{
                display: "grid",
                gridTemplateColumns: "52px minmax(160px,1fr) 120px 80px 90px",
                padding: "10px 20px",
                borderBottom: "1px solid rgba(255,255,255,0.07)",
                minWidth: isMobile ? "560px" : "auto",
              }}>
                {["RANK", "LEARNER", "LEAGUE", "STREAK", "XP"].map((h) => (
                  <div key={h} style={{ fontSize: "10px", fontWeight: "700", letterSpacing: "0.1em", color: "#4b5563", textTransform: "uppercase" }}>
                    {h}
                  </div>
                ))}
              </div>
              {tableRows.length === 0 && !loadError && (
                <div style={{ padding: "20px", color: "#6b7280", fontSize: "14px" }}>
                  {rows.length <= 3 ? "Not enough players for a table yet." : "No additional rows."}
                </div>
              )}
              {tableRows.map((r, i) => (
                <div
                  key={r.user_id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "52px minmax(160px,1fr) 120px 80px 90px",
                    padding: "14px 20px",
                    alignItems: "center",
                    borderBottom: i < tableRows.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                    transition: "background 0.12s",
                    cursor: "default",
                    background: r.is_you ? "rgba(37,99,235,0.08)" : "transparent",
                    minWidth: isMobile ? "560px" : "auto",
                  }}
                  onMouseEnter={(e) => { if (!r.is_you) e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = r.is_you ? "rgba(37,99,235,0.08)" : "transparent"; }}
                >
                  <div style={{ fontSize: "13px", fontWeight: "700", color: "#6b7280" }}>#{r.rank}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{
                      width: "36px", height: "36px", borderRadius: "50%",
                      background: bgForIndex(r.rank), display: "flex", alignItems: "center",
                      justifyContent: "center", fontSize: "16px", flexShrink: 0,
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}>
                      {emojiForName(r.username)}
                    </div>
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: "700", color: "#e2e8f0" }}>
                        {r.username}{r.is_you ? " (you)" : ""}
                      </div>
                    </div>
                  </div>
                  <div><span style={leagueBadgeStyle}>{leagueFromXp(r.xp)}</span></div>
                  <div style={{ fontSize: "13px", fontWeight: "600", color: "#f97316" }}>🔥 {r.streak_days}</div>
                  <div style={{ fontSize: "14px", fontWeight: "800", color: "#3b82f6" }}>{Number(r.xp).toLocaleString()}</div>
                </div>
              ))}
            </div>

            {you && (
              <div style={{
                background: "#111827",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "14px",
                padding: "14px 20px",
                display: "flex",
                alignItems: "center",
                gap: "20px",
                flexWrap: "wrap",
              }}>
                <div style={{ flexShrink: 0 }}>
                  <div style={{ fontSize: "10px", fontWeight: "700", letterSpacing: "0.1em", color: "#4b5563", textTransform: "uppercase", marginBottom: "2px" }}>
                    Your rank
                  </div>
                  <div style={{ fontSize: "28px", fontWeight: "900", color: "#3b82f6", letterSpacing: "-0.03em" }}>
                    #{you.rank}
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: "160px" }}>
                  <div style={{ fontSize: "11px", color: "#6b7280", marginBottom: "6px" }}>
                    {topXp > 0 && you.rank > 1
                      ? `You have ${pctVsLeader}% of the #1 learner’s XP. Complete more lessons and save notes to climb.`
                      : you.rank === 1
                        ? "You’re at the top — keep learning to stay ahead."
                        : "Earn XP from lessons (with score bonuses) and notes."}
                  </div>
                  <div style={{ height: "6px", background: "rgba(255,255,255,0.07)", borderRadius: "999px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pctVsLeader}%`, background: "linear-gradient(90deg,#2563eb,#60a5fa)", borderRadius: "999px" }} />
                  </div>
                </div>
                <div style={{ flexShrink: 0, textAlign: "center" }}>
                  <div style={{ fontSize: "10px", fontWeight: "700", letterSpacing: "0.1em", color: "#4b5563", textTransform: "uppercase", marginBottom: "2px" }}>
                    Your XP
                  </div>
                  <div style={{ fontSize: "18px", fontWeight: "900", color: "#60a5fa" }}>
                    {Number(you.xp).toLocaleString()}
                  </div>
                </div>
                <div style={{ flexShrink: 0, textAlign: "center" }}>
                  <div style={{ fontSize: "10px", fontWeight: "700", letterSpacing: "0.1em", color: "#4b5563", textTransform: "uppercase", marginBottom: "2px" }}>
                    Streak
                  </div>
                  <div style={{ fontSize: "18px", fontWeight: "900", color: "#f97316" }}>
                    🔥 {you.streak_days}d
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => navigate("/roadmap")}
                  style={{
                    flexShrink: 0, padding: "9px 18px", borderRadius: "8px",
                    border: "none", background: "transparent", color: "#3b82f6",
                    fontWeight: "700", fontSize: "13px", cursor: "pointer",
                  }}
                >
                  Practice now
                </button>
              </div>
            )}

          </div>
        </main>
      </div>

      <Footer />
      <AiChat />
    </div>
  );
}
