import { useEffect, useState } from "react";
import { getAllAttempts } from "../services/attemptService";
import "./Admin.css";

function AdminAttempts() {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    getAllAttempts()
      .then(setAttempts)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div dir="rtl" className="admin-wrap">
      <div className="admin-head">
        <span className="admin-accent" />
        <h1>מעקב ניסיונות מבחן</h1>
      </div>
      <p className="admin-lead">כל ניסיונות המבחן של המשתמשים במערכת.</p>

      <div className="admin-card">
        {loading ? (
          <p className="admin-muted">טוען...</p>
        ) : attempts.length === 0 ? (
          <p className="admin-muted">אין ניסיונות עדיין.</p>
        ) : (
          <div className="admin-list">
            {attempts.map((a) => {
              const isOpen = expanded === a._id;
              const user = a.userId?.name || "משתמש לא ידוע";
              const pct =
                a.completedAt && a.total ? Math.round((a.score / a.total) * 100) : null;
              const scoreColor =
                pct === null ? "#9ca3af" : pct >= 80 ? "#2eb872" : pct >= 60 ? "#e5b700" : "#e4572e";
              return (
                <div key={a._id} className="admin-list-row" style={{ flexDirection: "column", alignItems: "stretch", padding: 0, overflow: "hidden" }}>
                  <div
                    onClick={() => setExpanded(isOpen ? null : a._id)}
                    style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 14, cursor: "pointer" }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, color: "#16284b" }}>
                        {user} · ניסיון #{a.attemptNumber}
                      </div>
                      <div className="admin-muted" style={{ fontSize: 12 }}>
                        {new Date(a.createdAt).toLocaleString("he-IL")}
                        {a.completedAt ? " · הושלם" : " · בתהליך"}
                      </div>
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: scoreColor }}>
                      {a.completedAt ? `${a.score}/${a.total} (${pct}%)` : "—"}
                    </div>
                  </div>
                  {isOpen && a.answers?.length > 0 && (
                    <div style={{ padding: 12, borderTop: "1px solid #eef0f4", background: "#f9fafb" }}>
                      {a.answers.map((ans) => (
                        <div
                          key={ans.questionNumber}
                          style={{
                            display: "flex",
                            gap: 10,
                            alignItems: "center",
                            padding: "6px 10px",
                            borderRadius: 8,
                            background: ans.isCorrect ? "#e7f7ee" : "#fdeae3",
                            marginBottom: 4,
                            fontSize: 13,
                          }}
                        >
                          <span style={{ fontWeight: 700, minWidth: 36 }}>ש{ans.questionNumber}</span>
                          <span>
                            {ans.selected || "—"}{" "}
                            {ans.isCorrect ? "✓" : `✗ (נכון: ${ans.correct})`}
                          </span>
                          {ans.hintUsed && <span style={{ fontSize: 11 }}>💡 רמז</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminAttempts;
