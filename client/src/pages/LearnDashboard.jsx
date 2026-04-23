import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Icon from "../components/Icon";
import Logo from "../components/Logo";
import {
  getCardsData,
  getTestQuestionsData,
  getInfographics,
  getPresentations,
  getWeeks,
} from "../services/contentService";
import { getMyCardProgress } from "../services/progressService";
import { getUserAttempts } from "../services/attemptService";
import "./LearnDashboard.css";

const tiles = [
  {
    to: "/learn/cards",
    title: "כרטיסיות",
    desc: "לימוד עם זכרו/לא זכרו",
    icon: "cards",
    bg: "#16284b",
    fg: "#fff",
    statKey: "cards",
  },
  {
    to: "/learn/test",
    title: "מבחן",
    desc: "בחנו את עצמכם",
    icon: "exam",
    bg: "#f7c90c",
    fg: "#16284b",
    statKey: "test",
  },
  {
    to: "/learn/infographics",
    title: "אינפוגרפיות",
    desc: "תצוגה חזותית של החומר",
    icon: "infographics",
    bg: "#2e4a7f",
    fg: "#fff",
    statKey: "info",
  },
  {
    to: "/learn/presentation",
    title: "מצגת",
    desc: "חומר הלימוד המלא",
    icon: "presentations",
    bg: "#e5b700",
    fg: "#16284b",
    statKey: "pres",
  },
];

function LearnDashboard() {
  const { currentUser } = useAuth();
  const [selectedWeek, setSelectedWeek] = useState(() => {
    const saved = localStorage.getItem("selectedWeek");
    return saved ? Number(saved) : 1;
  });
  const [weeks, setWeeks] = useState([1]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getWeeks().then((ws) => setWeeks(ws?.length ? ws : [1]));
  }, []);

  useEffect(() => {
    localStorage.setItem("selectedWeek", String(selectedWeek));
  }, [selectedWeek]);

  useEffect(() => {
    let cancel = false;
    setLoading(true);
    (async () => {
      const [cards, qs, info, pres, progress, attempts] = await Promise.all([
        getCardsData(selectedWeek),
        getTestQuestionsData(selectedWeek),
        getInfographics(selectedWeek),
        getPresentations(selectedWeek),
        getMyCardProgress(currentUser._id, selectedWeek),
        getUserAttempts(currentUser._id, selectedWeek),
      ]);
      if (cancel) return;

      const cardNumbers = Object.keys(cards).map((k) => parseInt(k.replace(/\D/g, ""), 10));
      let known = 0,
        unknown = 0,
        unseen = 0;
      for (const n of cardNumbers) {
        const s = progress[n];
        if (s === "known") known++;
        else if (s === "unknown") unknown++;
        else unseen++;
      }

      const completed = attempts.filter((a) => a.completedAt);
      const bestScore = completed.reduce(
        (best, a) => (a.total && a.score / a.total > best ? a.score / a.total : best),
        0
      );
      // Latest completed attempt (attempts are sorted by attemptNumber DESC)
      const lastCompleted = completed[0] || null;
      const lastScorePct =
        lastCompleted && lastCompleted.total
          ? Math.round((lastCompleted.score / lastCompleted.total) * 100)
          : null;

      setStats({
        cardsTotal: cardNumbers.length,
        known,
        unknown,
        unseen,
        testsTotal: Object.keys(qs).length,
        attemptsCount: completed.length,
        bestScorePct: Math.round(bestScore * 100),
        lastAttemptNumber: lastCompleted?.attemptNumber || null,
        lastScorePct,
        lastScore: lastCompleted?.score ?? null,
        lastTotal: lastCompleted?.total ?? null,
        infoCount: info.length,
        presCount: pres.length,
      });
      setLoading(false);
    })();
    return () => {
      cancel = true;
    };
  }, [currentUser, selectedWeek]);

  const masteryPct = useMemo(() => {
    if (!stats || !stats.cardsTotal) return 0;
    return Math.round((stats.known / stats.cardsTotal) * 100);
  }, [stats]);

  const tileStat = (key) => {
    if (!stats) return "";
    if (key === "cards") return `${stats.known}/${stats.cardsTotal} ידועות`;
    if (key === "test")
      return stats.attemptsCount
        ? `שיא: ${stats.bestScorePct}% · ${stats.attemptsCount} ניסיונות`
        : `${stats.testsTotal} שאלות`;
    if (key === "info") return `${stats.infoCount} תמונות`;
    if (key === "pres") return `${stats.presCount} קבצים`;
    return "";
  };

  return (
    <div className="dash-wrap">
      <header className="dash-top">
        <Logo variant="logo" size={38} />
        <div className="dash-avatar">{(currentUser?.name || "?").slice(0, 1)}</div>
      </header>

      <div className="dash-greet">
        <div style={{ fontSize: 13, opacity: 0.7 }}>שלום,</div>
        <div style={{ fontSize: 22, fontWeight: 800 }}>{currentUser?.name}</div>
      </div>

      <div className="dash-week-row">
        <span style={{ fontSize: 13, color: "#6b7280", marginLeft: 8 }}>שבוע:</span>
        <div className="dash-weeks">
          {weeks.map((w) => (
            <button
              key={w}
              className={`dash-week ${selectedWeek === w ? "active" : ""}`}
              onClick={() => setSelectedWeek(w)}
            >
              {w}
            </button>
          ))}
        </div>
      </div>

      <div className="dash-hero">
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, opacity: 0.85 }}>שליטה בחומר</div>
          <div style={{ fontSize: 30, fontWeight: 900, color: "#f7c90c", marginTop: 2 }}>
            {masteryPct}%
          </div>
          <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>
            {stats ? `${stats.known} כרטיסיות ידועות מתוך ${stats.cardsTotal}` : "..."}
          </div>
        </div>
        <div className="dash-ring">
          <svg width="72" height="72" viewBox="0 0 72 72">
            <circle cx="36" cy="36" r="30" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="8" />
            <circle
              cx="36"
              cy="36"
              r="30"
              fill="none"
              stroke="#f7c90c"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${(masteryPct / 100) * 188.5} 188.5`}
              transform="rotate(-90 36 36)"
              style={{ transition: "stroke-dasharray 0.6s" }}
            />
          </svg>
          <div className="dash-ring-num">{masteryPct}%</div>
        </div>
      </div>

      <div className="dash-mini-stats">
        <MiniStat label="ידוע" value={stats?.known ?? 0} color="#2eb872" />
        <MiniStat label="לא ידוע" value={stats?.unknown ?? 0} color="#e4572e" />
        <MiniStat label="חדש" value={stats?.unseen ?? 0} color="#2e4a7f" />
        <MiniStat label="מבחנים" value={stats?.attemptsCount ?? 0} color="#e5b700" />
      </div>

      {stats?.lastScorePct !== null && stats?.lastScorePct !== undefined && (
        <Link
          to={`/learn/test?week=${selectedWeek}`}
          className="dash-last-test"
          style={{
            background:
              stats.lastScorePct >= 80
                ? "#2eb872"
                : stats.lastScorePct >= 60
                ? "#e5b700"
                : "#e4572e",
          }}
        >
          <div>
            <div style={{ fontSize: 12, opacity: 0.9 }}>
              מבחן אחרון · ניסיון #{stats.lastAttemptNumber}
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, marginTop: 2 }}>
              {stats.lastScore}/{stats.lastTotal}{" "}
              <span style={{ fontSize: 14, fontWeight: 700, opacity: 0.95 }}>
                ({stats.lastScorePct}%)
              </span>
            </div>
            {stats.attemptsCount > 1 && (
              <div style={{ fontSize: 11, opacity: 0.85, marginTop: 2 }}>
                שיא אישי: {stats.bestScorePct}%
              </div>
            )}
          </div>
          <div className="dash-last-test-icon">
            <Icon name="exam" size={28} color="#fff" />
          </div>
        </Link>
      )}

      <div className="dash-grid">
        {tiles.map((t) => {
          const iconBg = t.fg === "#fff" ? "rgba(255,255,255,0.15)" : "rgba(22,40,75,0.12)";
          return (
            <Link
              key={t.to}
              to={`${t.to}?week=${selectedWeek}`}
              className="dash-tile"
              style={{ background: t.bg, color: t.fg }}
            >
              <div className="dash-tile-shine" />
              <div className="dash-tile-icon" style={{ background: iconBg }}>
                <Icon name={t.icon} size={34} color={t.fg} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 17 }}>{t.title}</div>
                <div style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>{t.desc}</div>
                <div style={{ fontSize: 11, opacity: 0.75, marginTop: 6, fontWeight: 600 }}>
                  {loading ? "..." : tileStat(t.statKey)}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function MiniStat({ label, value, color }) {
  return (
    <div className="dash-mini">
      <div className="dash-mini-val" style={{ color }}>{value}</div>
      <div className="dash-mini-lbl">{label}</div>
    </div>
  );
}

export default LearnDashboard;
