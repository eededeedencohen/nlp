import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useContent } from "../context/ContentContext";
import {
  startAttempt,
  completeAttempt,
  saveAttemptProgress,
  getUserAttempts,
  deleteAttempt,
  resetMyAttempts,
} from "../services/attemptService";
import Icon from "../components/Icon";
import CommentsModal from "../components/CommentsModal";

function LearnTest() {
  const { currentUser } = useAuth();
  const { ensureTests } = useContent();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const week = params.get("week") ? Number(params.get("week")) : 1;

  const [questions, setQuestions] = useState([]);
  const [phase, setPhase] = useState("loading"); // loading | intro | running | result
  const [attempt, setAttempt] = useState(null);
  const [answers, setAnswers] = useState({});
  const [hintUsed, setHintUsed] = useState({});
  const [showHint, setShowHint] = useState(false);
  const [index, setIndex] = useState(0);
  const [pastAttempts, setPastAttempts] = useState([]);
  const [commentsOpen, setCommentsOpen] = useState(false);

  useEffect(() => {
    (async () => {
      const data = await ensureTests(week);
      const entries = Object.entries(data)
        .map(([key, val]) => ({ number: parseInt(key.replace(/\D/g, ""), 10), ...val }))
        .sort((a, b) => a.number - b.number);
      setQuestions(entries);
      const past = await getUserAttempts(currentUser._id, week);
      setPastAttempts(past);
      setPhase("intro");
    })();
  }, [currentUser, week, ensureTests]);

  const q = questions[index];

  const beginAttempt = async () => {
    const att = await startAttempt(currentUser._id, week);
    setAttempt(att);
    setAnswers({});
    setHintUsed({});
    setIndex(0);
    setShowHint(false);
    setPhase("running");
  };

  const resumeAttempt = (att) => {
    // Rebuild answers map from saved partial answers
    const ansMap = {};
    const hintMap = {};
    for (const a of att.answers || []) {
      if (a.selected) ansMap[a.questionNumber] = a.selected;
      if (a.hintUsed) hintMap[a.questionNumber] = true;
    }
    setAttempt(att);
    setAnswers(ansMap);
    setHintUsed(hintMap);
    // Jump to first unanswered question
    const firstUnanswered = questions.findIndex((q) => !ansMap[q.number]);
    setIndex(firstUnanswered >= 0 ? firstUnanswered : 0);
    setShowHint(false);
    setPhase("running");
  };

  // Find an incomplete attempt (if any)
  const incompleteAttempt = pastAttempts.find((a) => !a.completedAt);

  const selectAnswer = (letter) => {
    if (answers[q.number]) return; // locked after first choice
    const newAnswers = { ...answers, [q.number]: letter };
    setAnswers(newAnswers);
    // Persist progress so the user can resume later
    if (attempt?._id) {
      const payload = Object.entries(newAnswers).map(([num, sel]) => {
        const qq = questions.find((x) => x.number === Number(num));
        return {
          questionNumber: Number(num),
          selected: sel,
          correct: qq?.correct || "A",
          isCorrect: sel === qq?.correct,
          hintUsed: !!hintUsed[num],
        };
      });
      saveAttemptProgress(attempt._id, payload).catch(() => {});
    }
  };

  const goNext = () => {
    setShowHint(false);
    if (index + 1 < questions.length) setIndex(index + 1);
    else finishAttempt();
  };
  const goPrev = () => {
    setShowHint(false);
    setIndex((i) => Math.max(0, i - 1));
  };

  const handleDeleteAttempt = async (id) => {
    if (!window.confirm("למחוק את הניסיון הזה?")) return;
    await deleteAttempt(id, currentUser._id);
    setPastAttempts((prev) => prev.filter((a) => a._id !== id));
  };

  const handleResetAll = async () => {
    if (!window.confirm(`לאפס את כל ניסיונות המבחן של שבוע ${week}?`)) return;
    await resetMyAttempts(currentUser._id, week);
    setPastAttempts([]);
  };

  const finishAttempt = async () => {
    const payload = questions.map((qq) => {
      const selected = answers[qq.number] || null;
      const correct = qq.correct;
      return {
        questionNumber: qq.number,
        selected,
        correct,
        isCorrect: selected === correct,
        hintUsed: !!hintUsed[qq.number],
      };
    });
    const finished = await completeAttempt(attempt._id, payload);
    setAttempt(finished);
    setPhase("result");
    const past = await getUserAttempts(currentUser._id, week);
    setPastAttempts(past);
  };

  const answered = useMemo(() => Object.keys(answers).length, [answers]);
  const allAnswered = answered === questions.length;

  if (phase === "loading") return <div style={{ padding: 20 }}>טוען...</div>;

  if (phase === "intro")
    return (
      <div style={wrap}>
        <button style={backBtn} onClick={() => navigate("/learn")}>
          <Icon name="rightArrow" size={14} /> חזרה
        </button>
        <h1>מבחן ידע</h1>
        <p style={{ color: "#6b7280" }}>
          {questions.length} שאלות. אפשר להשתמש ברמזים אבל זה נשמר בהיסטוריה.
        </p>

        {incompleteAttempt && (
          <div style={resumeBox}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
              יש לך ניסיון שלא הושלם
            </div>
            <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 10 }}>
              ניסיון #{incompleteAttempt.attemptNumber} · ענית על{" "}
              {(incompleteAttempt.answers || []).filter((a) => a.selected).length} מתוך{" "}
              {questions.length} שאלות
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="btn"
                style={{ flex: 1, background: "#f7c90c", color: "#16284b" }}
                onClick={() => resumeAttempt(incompleteAttempt)}
              >
                המשך ניסיון #{incompleteAttempt.attemptNumber}
              </button>
              <button
                style={discardBtn}
                onClick={() => handleDeleteAttempt(incompleteAttempt._id)}
              >
                ביטול
              </button>
            </div>
          </div>
        )}

        <button
          className="btn"
          style={{ marginTop: incompleteAttempt ? 16 : 10 }}
          onClick={beginAttempt}
        >
          {incompleteAttempt ? "התחלה מחדש" : `התחל ניסיון #${(pastAttempts[0]?.attemptNumber || 0) + 1}`}
        </button>

        {pastAttempts.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <h3 style={{ margin: 0 }}>היסטוריה</h3>
              <button style={resetAllBtn} onClick={handleResetAll}>
                איפוס הכל
              </button>
            </div>
            {pastAttempts.map((a) => (
              <div key={a._id} style={historyRow}>
                <div>
                  <div style={{ fontWeight: 700 }}>ניסיון #{a.attemptNumber}</div>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>
                    {new Date(a.createdAt).toLocaleString("he-IL")}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ fontWeight: 800, color: "#2eb872" }}>
                    {a.score}/{a.total}
                  </div>
                  <button
                    style={delBtn}
                    onClick={() => handleDeleteAttempt(a._id)}
                    aria-label="מחק"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );

  if (phase === "result") {
    return (
      <div style={wrap}>
        <h1>סיום מבחן</h1>
        <div style={scoreBox}>
          <div style={{ fontSize: 16 }}>ציון ניסיון #{attempt.attemptNumber}</div>
          <div style={{ fontSize: 42, fontWeight: 800 }}>
            {attempt.score}/{attempt.total}
          </div>
          <div style={{ fontSize: 14, opacity: 0.9 }}>
            {Math.round((attempt.score / attempt.total) * 100)}%
          </div>
        </div>

        <h3>פירוט תשובות</h3>
        {questions.map((qq) => {
          const ans = attempt.answers.find((a) => a.questionNumber === qq.number);
          return (
            <div key={qq.number} style={reviewRow(ans?.isCorrect)}>
              <div style={{ fontSize: 13, color: "#6b7280" }}>שאלה {qq.number}</div>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>{qq.question}</div>
              <div style={{ fontSize: 14 }}>
                תשובתך: {ans?.selected || "—"} {ans?.isCorrect ? "✓" : `✗ (נכון: ${ans?.correct})`}
              </div>
            </div>
          );
        })}

        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <button className="btn" onClick={beginAttempt} style={{ flex: 1 }}>נסיון נוסף</button>
          <button className="btn secondary" onClick={() => navigate("/learn")} style={{ flex: 1 }}>
            חזרה
          </button>
        </div>
      </div>
    );
  }

  // running
  if (!q || questions.length === 0) {
    return (
      <div style={wrap}>
        <button style={backBtn} onClick={() => navigate("/learn")}>
          <Icon name="rightArrow" size={14} /> חזרה
        </button>
        <p style={{ marginTop: 16 }}>אין שאלות זמינות לשבוע {week}.</p>
      </div>
    );
  }

  return (
    <div style={wrap}>
      <header style={topRow}>
        <button style={backBtn} onClick={() => {
          if (window.confirm("לצאת מהמבחן? תאבד את ההתקדמות בניסיון הזה.")) navigate("/learn");
        }}>
          <Icon name="rightArrow" size={14} /> יציאה
        </button>
        <div style={{ fontSize: 13, color: "#6b7280" }}>שאלה {index + 1} מתוך {questions.length}</div>
      </header>

      <div style={progress}>
        <div style={{ ...bar, width: `${((index + 1) / questions.length) * 100}%` }} />
      </div>

      <div style={qCard}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <div style={{ fontSize: 13, color: "#16284b", fontWeight: 700 }}>
            שאלה #{q.number}
          </div>
          <button style={commentsBtn} onClick={() => setCommentsOpen(true)}>
            <Icon name="comment" size={14} /> תגובות
          </button>
        </div>
        <div style={{ fontSize: 17, lineHeight: 1.5, fontWeight: 600, marginBottom: 16 }}>
          {q.question}
        </div>

        {["A", "B", "C", "D"].map((letter) => {
          const userChoice = answers[q.number];
          const answered = !!userChoice;
          const isSelected = userChoice === letter;
          const isCorrect = q.correct === letter;
          let state = "idle";
          if (answered) {
            if (isSelected && isCorrect) state = "correct";
            else if (isSelected && !isCorrect) state = "wrong";
            else if (!isSelected && isCorrect) state = "reveal";
            else state = "dim";
          }
          return (
            <button
              key={letter}
              onClick={() => selectAnswer(letter)}
              disabled={answered}
              style={{
                ...optionBtn,
                ...optionStateStyle(state),
              }}
            >
              <span style={letterBadge(state)}>{letter}</span>
              <span style={{ flex: 1 }}>{q.answers[letter]}</span>
              {state === "correct" && <span style={{ ...icon, color: "#2eb872" }}>✓</span>}
              {state === "wrong" && <span style={icon}>✗</span>}
            </button>
          );
        })}

        {answers[q.number] && (
          <div style={feedbackBox(answers[q.number] === q.correct)}>
            {answers[q.number] === q.correct
              ? "✓ תשובה נכונה! כל הכבוד"
              : `✗ תשובה שגויה. התשובה הנכונה: ${q.correct}`}
          </div>
        )}

        <button
          style={hintBtn}
          onClick={() => {
            setShowHint((s) => !s);
            if (!showHint) setHintUsed((h) => ({ ...h, [q.number]: true }));
          }}
        >
          💡 {showHint ? "הסתר רמז" : "הצג רמז"}
        </button>
        {showHint && <div style={hintBox}>{q.hint}</div>}
      </div>

      <CommentsModal
        open={commentsOpen}
        onClose={() => setCommentsOpen(false)}
        type="question"
        number={q.number}
        week={week}
        headline={`שאלה #${q.number}`}
      />

      <div style={navActions}>
        <button className="btn ghost" onClick={goPrev} disabled={index === 0}>
          <Icon name="rightArrow" size={14} /> הקודם
        </button>
        {index + 1 < questions.length ? (
          <button className="btn" onClick={goNext} disabled={!answers[q.number]}>
            הבא <Icon name="leftArrow" size={14} color="#fff" />
          </button>
        ) : (
          <button className="btn success" onClick={finishAttempt} disabled={!allAnswered}>
            סיום ({answered}/{questions.length})
          </button>
        )}
      </div>
    </div>
  );
}

const wrap = { maxWidth: 600, margin: "0 auto", padding: 16, paddingBottom: 40 };
const backBtn = { background: "transparent", border: "none", color: "#16284b", cursor: "pointer", fontSize: 15, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 6 };
const topRow = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 };

const progress = { height: 8, background: "#e5e7eb", borderRadius: 999, overflow: "hidden", marginBottom: 16 };
const bar = { height: "100%", background: "#f7c90c", transition: "width 0.3s" };

const qCard = {
  background: "#fff",
  borderRadius: 18,
  padding: 20,
  boxShadow: "0 10px 30px rgba(98,70,234,0.1)",
};

const optionBtn = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  width: "100%",
  textAlign: "right",
  padding: "12px 14px",
  background: "#f5f6fa",
  border: "2px solid transparent",
  borderRadius: 12,
  marginBottom: 8,
  fontSize: 15,
  cursor: "pointer",
  color: "#0b1c3b",
  lineHeight: 1.4,
  transition: "background 0.2s, border-color 0.2s, opacity 0.2s",
};

const optionStateStyle = (state) => {
  switch (state) {
    case "correct":
      return { background: "#dcf5e6", borderColor: "#2eb872" };
    case "wrong":
      return { background: "#fde2d8", borderColor: "#e4572e" };
    case "reveal":
      return { background: "#eefbf3", borderColor: "#2eb872" };
    case "dim":
      return { opacity: 0.55, cursor: "default" };
    case "idle":
    default:
      return { background: "#fff", border: "2px solid #fff4c2" };
  }
};

const letterBadge = (state) => {
  const bg =
    state === "correct" || state === "reveal"
      ? "#2eb872"
      : state === "wrong"
      ? "#e4572e"
      : "#fff";
  const color =
    state === "correct" || state === "wrong" || state === "reveal" ? "#fff" : "#16284b";
  return {
    minWidth: 28,
    height: 28,
    borderRadius: "50%",
    background: bg,
    color,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: 13,
    flexShrink: 0,
    boxShadow: state === "idle" ? "inset 0 0 0 2px #16284b" : "none",
  };
};

const icon = {
  fontWeight: 800,
  fontSize: 18,
  color: "#e4572e",
  marginInlineStart: 8,
};

const feedbackBox = (ok) => ({
  marginTop: 10,
  padding: "10px 14px",
  borderRadius: 12,
  fontSize: 14,
  fontWeight: 600,
  background: ok ? "#dcf5e6" : "#fde2d8",
  color: ok ? "#1a6b3f" : "#8a2e13",
  textAlign: "center",
});

const hintBtn = {
  marginTop: 6,
  background: "transparent",
  border: "1px solid #e5e7eb",
  borderRadius: 999,
  padding: "6px 14px",
  fontSize: 13,
  cursor: "pointer",
};

const commentsBtn = {
  background: "#fff8d6",
  border: "1px solid #f7c90c",
  color: "#16284b",
  borderRadius: 999,
  padding: "5px 12px",
  fontSize: 12,
  fontWeight: 700,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
};

const hintBox = {
  marginTop: 10,
  background: "#fff8e6",
  border: "1px solid #f6dfa7",
  padding: 12,
  borderRadius: 12,
  fontSize: 14,
  color: "#6b5d22",
};

const navActions = { display: "flex", justifyContent: "space-between", marginTop: 16 };

const historyRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  background: "#fff",
  padding: 12,
  borderRadius: 12,
  marginBottom: 8,
  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
};

const delBtn = {
  width: 30,
  height: 30,
  borderRadius: "50%",
  background: "#fdeae3",
  border: "1px solid #e4572e",
  color: "#e4572e",
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 700,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

const resumeBox = {
  background: "#fff4c2",
  border: "1px solid #f7c90c",
  borderRadius: 14,
  padding: 14,
  marginTop: 16,
  color: "#16284b",
};

const discardBtn = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  color: "#6b7280",
  padding: "10px 14px",
  borderRadius: 999,
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 600,
};

const resetAllBtn = {
  background: "#fff",
  border: "1px solid #e4572e",
  color: "#e4572e",
  padding: "6px 14px",
  borderRadius: 999,
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 700,
};

const scoreBox = {
  background: "#16284b",
  color: "#f7c90c",
  padding: 24,
  borderRadius: 18,
  textAlign: "center",
  marginBottom: 20,
  borderBottom: "4px solid #f7c90c",
};

const reviewRow = (correct) => ({
  background: "#fff",
  padding: 12,
  borderRadius: 12,
  marginBottom: 8,
  borderLeft: `5px solid ${correct ? "#2eb872" : "#e4572e"}`,
  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
});

export default LearnTest;
