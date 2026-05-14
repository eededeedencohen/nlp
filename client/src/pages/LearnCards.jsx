import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useContent } from "../context/ContentContext";
import {
  getMyCardProgress,
  setCardStatus,
  resetMyCardProgress,
} from "../services/progressService";
import Icon from "../components/Icon";
import CommentsModal from "../components/CommentsModal";
import { listComments } from "../services/commentService";
import "./LearnCards.css";

function LearnCards() {
  const { currentUser } = useAuth();
  const { ensureCards } = useContent();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const week = params.get("week") ? Number(params.get("week")) : 1;

  const [cards, setCards] = useState([]);
  const [progress, setProgress] = useState({});
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  // phase: idle | dragging | flying
  // entry: null | 'left' | 'right' (triggers CSS entry animation via key change)
  const [swipe, setSwipe] = useState({ x: 0, phase: "idle", entry: null, entryKey: 0 });
  const pointerRef = useRef(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [data, prog] = await Promise.all([
          ensureCards(week),
          getMyCardProgress(currentUser._id, week),
        ]);
        const entries = Object.entries(data).map(([key, val]) => {
          const n = parseInt(key.replace(/\D/g, ""), 10);
          return { number: n, ...val };
        });
        entries.sort((a, b) => a.number - b.number);
        setCards(entries);
        setProgress(prog);
      } finally {
        setLoading(false);
      }
    })();
  }, [currentUser, week, ensureCards]);

  const filtered = useMemo(() => {
    if (filter === "all") return cards;
    if (filter === "unseen") return cards.filter((c) => !progress[c.number]);
    return cards.filter((c) => progress[c.number] === filter);
  }, [cards, progress, filter]);

  const card = filtered[index];

  useEffect(() => {
    setIndex(0);
    setFlipped(false);
  }, [filter, week]);

  // Fetch comment count for the current card (when not opening the modal)
  useEffect(() => {
    if (!card || commentsOpen) return;
    let cancel = false;
    listComments("card", card.number, week)
      .then((list) => {
        if (!cancel) setCommentCount(list.length);
      })
      .catch(() => !cancel && setCommentCount(0));
    return () => {
      cancel = true;
    };
  }, [card, commentsOpen]);

  const stats = useMemo(() => {
    let known = 0, unknown = 0, unseen = 0;
    for (const c of cards) {
      const s = progress[c.number];
      if (s === "known") known++;
      else if (s === "unknown") unknown++;
      else unseen++;
    }
    return { known, unknown, unseen, total: cards.length };
  }, [cards, progress]);

  const mark = async (status) => {
    if (!card) return;
    setSaving(true);
    try {
      await setCardStatus(currentUser._id, card.number, status, week);
      setProgress((p) => ({ ...p, [card.number]: status }));
      animateTo("next");
    } finally {
      setSaving(false);
    }
  };

  // Perform a navigation with fly-out + slide-in animation
  // direction: 'prev' | 'next'
  // flyDir override: +1 = fly right, -1 = fly left (passed from swipe to match finger direction)
  // When no flyDir given (button click), use REVERSED mapping: next flies right, prev flies left
  const animateTo = (direction, flyDir) => {
    if (swipe.phase === "flying" || swipe.entry) return;
    const atStart = index === 0;
    const atEnd = index >= filtered.length - 1;
    if ((direction === "prev" && atStart) || (direction === "next" && atEnd)) {
      // boundary: snap card back to center instead of leaving it stuck mid-drag
      setSwipe((s) => ({ ...s, x: 0, phase: "idle", entry: null }));
      return;
    }

    const width = window.innerWidth || 500;
    const dir = flyDir !== undefined ? flyDir : direction === "next" ? 1 : -1;
    const flyTo = dir > 0 ? width + 100 : -(width + 100);
    const entrySide = dir > 0 ? "left" : "right";

    setSwipe((s) => ({ ...s, x: flyTo, phase: "flying", entry: null }));
    setTimeout(() => {
      setFlipped(false);
      setIndex((i) =>
        direction === "prev" ? Math.max(0, i - 1) : Math.min(filtered.length - 1, i + 1)
      );
      setSwipe((s) => ({
        x: 0,
        phase: "idle",
        entry: entrySide,
        entryKey: s.entryKey + 1,
      }));
      setTimeout(() => {
        setSwipe((s) => ({ ...s, entry: null }));
      }, 380);
    }, 320);
  };

  const next = () => animateTo("next");
  const prev = () => animateTo("prev");

  const onPointerDown = (e) => {
    // Block only mid-animation; if somehow stuck in "dragging", allow a new gesture to recover
    if (swipe.phase === "flying" || swipe.entry) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;

    const startX = e.clientX;
    const startY = e.clientY;
    pointerRef.current = {
      startX,
      startY,
      currentX: 0,
      moved: false,
      axis: null,
      pointerId: e.pointerId,
    };
    setSwipe((s) => ({ ...s, x: 0, phase: "dragging", entry: null }));

    const handleMove = (ev) => {
      const p = pointerRef.current;
      if (!p) return;
      const dx = ev.clientX - p.startX;
      const dy = ev.clientY - p.startY;
      if (p.axis === null) {
        if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
          p.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
        }
      }
      if (Math.abs(dx) > 6) p.moved = true;
      if (p.axis === "x") {
        p.currentX = dx;
        ev.preventDefault?.();
        setSwipe((s) => ({ ...s, x: dx, phase: "dragging" }));
      }
    };

    const handleEnd = () => {
      const p = pointerRef.current;
      pointerRef.current = null;
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleEnd);
      window.removeEventListener("pointercancel", handleEnd);
      if (!p) {
        // safety: ensure we end up in idle state
        setSwipe((s) => ({ ...s, x: 0, phase: "idle" }));
        return;
      }

      const x = p.currentX;
      const moved = p.moved;
      const threshold = 30;

      if (moved && p.axis === "x" && Math.abs(x) > threshold) {
        // Swipe RIGHT (x>0) → next; Swipe LEFT (x<0) → previous
        animateTo(x > 0 ? "next" : "prev", Math.sign(x));
        return;
      }

      if (!moved) {
        setSwipe((s) => ({ ...s, x: 0, phase: "idle" }));
        setFlipped((f) => !f);
        return;
      }

      setSwipe((s) => ({ ...s, x: 0, phase: "idle" }));
    };

    window.addEventListener("pointermove", handleMove, { passive: false });
    window.addEventListener("pointerup", handleEnd);
    window.addEventListener("pointercancel", handleEnd);
  };

  const resetAll = async () => {
    if (!window.confirm(`לאפס את ההתקדמות שלך בשבוע ${week}?`)) return;
    await resetMyCardProgress(currentUser._id, week);
    setProgress({});
    setIndex(0);
    setFlipped(false);
  };

  if (loading) return <div style={{ padding: 20 }}>טוען...</div>;
  if (cards.length === 0)
    return <div style={{ padding: 20 }}>אין כרטיסיות לשבוע {week}.</div>;

  const currentStatus = card ? progress[card.number] : null;

  return (
    <div className="lc-wrap">
      <header className="lc-top">
        <button onClick={() => navigate("/learn")} className="lc-back">
          <Icon name="rightArrow" size={14} /> חזרה
        </button>
        <div className="lc-counter">
          שבוע {week} · {filtered.length > 0 ? `${index + 1} / ${filtered.length}` : "0 / 0"}
        </div>
      </header>

      <div className="lc-pills">
        <Pill label={`הכל ${stats.total}`} active={filter === "all"} onClick={() => setFilter("all")} />
        <Pill label={`יודע ${stats.known}`} active={filter === "known"} onClick={() => setFilter("known")} />
        <Pill label={`לא יודע ${stats.unknown}`} active={filter === "unknown"} onClick={() => setFilter("unknown")} />
        <Pill label={`חדש ${stats.unseen}`} active={filter === "unseen"} onClick={() => setFilter("unseen")} />
      </div>

      {!card ? (
        <div className="lc-empty">
          <p style={{ fontSize: 18 }}>אין כרטיסיות בפילטר הזה 🎉</p>
          <button className="btn secondary" onClick={() => setFilter("all")}>הצג הכל</button>
        </div>
      ) : (
        <>
          <div className="lc-scene">
            <div
              key={swipe.entryKey}
              className={`lc-swipe ${swipe.phase} ${swipe.entry ? `entering-${swipe.entry}` : ""}`}
              style={
                swipe.phase === "dragging" || swipe.phase === "flying"
                  ? {
                      transform: `translateX(${swipe.x}px) rotate(${swipe.x / 30}deg)`,
                      opacity: Math.max(0.3, 1 - Math.abs(swipe.x) / 600),
                    }
                  : undefined
              }
              onPointerDown={onPointerDown}
            >
            <div className={`lc-card ${flipped ? "flipped" : ""}`}>
              <div className="lc-face lc-face-front">
                <span className="lc-corner">Q.</span>
                {currentStatus && <span className={`lc-status-dot ${currentStatus}`} />}
                <span className="lc-badge">שאלה · #{card.number}</span>
                <div className="lc-text">{card.front}</div>
                <div className="lc-hint">
                  <span className="lc-flip-icon">⟲</span> הקש להיפוך
                </div>
              </div>
              <div className="lc-face lc-face-back">
                <span className="lc-corner">A.</span>
                {currentStatus && <span className={`lc-status-dot ${currentStatus}`} />}
                <span className="lc-badge">תשובה · #{card.number}</span>
                <div className="lc-text">{card.back}</div>
                <div className="lc-hint">
                  <span className="lc-flip-icon">⟲</span> הקש לחזרה
                </div>
              </div>
            </div>
            </div>
          </div>

          <div className="lc-extra-row">
            <button
              className="lc-comments-pill"
              onClick={() => setCommentsOpen(true)}
            >
              <Icon name="comment" size={16} />
              <span>תגובות</span>
              <span className="lc-comments-count">{commentCount}</span>
            </button>
          </div>

          <div className="lc-actions">
            <button className="lc-action dont-know" disabled={saving} onClick={() => mark("unknown")}>
              ✗ לא יודע
            </button>
            <button className="lc-action know" disabled={saving} onClick={() => mark("known")}>
              ✓ יודע
            </button>
          </div>

          <div className="lc-nav-row">
            <button className="lc-nav-btn" onClick={prev} disabled={index === 0}>
              <Icon name="rightArrow" size={14} /> הקודם
            </button>
            <button className="lc-nav-btn" onClick={next} disabled={index >= filtered.length - 1}>
              דלג <Icon name="leftArrow" size={14} />
            </button>
          </div>
        </>
      )}

      <button onClick={resetAll} className="lc-reset">איפוס התקדמות</button>

      <CommentsModal
        open={commentsOpen}
        onClose={() => setCommentsOpen(false)}
        type="card"
        number={card?.number}
        week={week}
        headline={card ? `כרטיסייה #${card.number}` : ""}
      />
    </div>
  );
}

function Pill({ label, active, onClick }) {
  return (
    <button className={`lc-pill ${active ? "active" : ""}`} onClick={onClick}>
      {label}
    </button>
  );
}

export default LearnCards;
