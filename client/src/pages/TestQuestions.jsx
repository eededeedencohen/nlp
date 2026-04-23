import { useEffect, useRef, useState } from "react";
import {
  saveTestQuestion,
  getNextTestQuestionNumber,
  deleteTestQuestion,
  resetAllTestQuestions,
} from "../services/testQuestionService";
import "./Admin.css";

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function TestQuestions() {
  const [image, setImage] = useState(null);
  const [selected, setSelected] = useState(false);
  const [nextNum, setNextNum] = useState(null);
  const [status, setStatus] = useState("");
  const [statusType, setStatusType] = useState("ok");
  const [saving, setSaving] = useState(false);
  const [deleteNum, setDeleteNum] = useState("");
  const [busy, setBusy] = useState(false);
  const [week, setWeek] = useState(1);
  const [correct, setCorrect] = useState(null);

  const selectedRef = useRef(selected);
  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  const refreshNext = async (w = week) => {
    try {
      const { next } = await getNextTestQuestionNumber(w);
      setNextNum(next);
    } catch (e) {}
  };

  useEffect(() => {
    refreshNext(week);
  }, [week]);

  const reportErr = (msg) => {
    setStatusType("err");
    setStatus(msg);
  };
  const reportOk = (msg) => {
    setStatusType("ok");
    setStatus(msg);
  };

  useEffect(() => {
    const handlePaste = async (e) => {
      if (!selectedRef.current) {
        reportErr("בחר קודם את המלבן להדבקה.");
        return;
      }

      const files = e.clipboardData?.files;
      let imageFile = null;
      if (files && files.length > 0) {
        const imgs = Array.from(files).filter((f) => f.type.startsWith("image/"));
        if (imgs.length > 0) imageFile = imgs[imgs.length - 1];
      }

      if (!imageFile) {
        const items = e.clipboardData?.items;
        if (items) {
          for (let i = items.length - 1; i >= 0; i--) {
            const it = items[i];
            if (it.kind === "file" && it.type.startsWith("image/")) {
              imageFile = it.getAsFile();
              break;
            }
          }
        }
      }

      if (!imageFile) {
        reportErr("לא נמצאה תמונה בלוח.");
        return;
      }

      e.preventDefault();
      const url = await fileToDataUrl(imageFile);
      setImage(url);
      setSelected(false);
      setStatus("");
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, []);

  const handleSave = async () => {
    if (!image || !correct) return;
    setSaving(true);
    setStatus("");
    try {
      const result = await saveTestQuestion(image, week, correct);
      reportOk(`נשמר בהצלחה: ${result.file} (תשובה נכונה: ${result.correct})`);
      setImage(null);
      setSelected(false);
      setCorrect(null);
      await refreshNext();
    } catch (e) {
      reportErr("שגיאה בשמירה: " + (e?.response?.data?.error || e.message));
    } finally {
      setSaving(false);
    }
  };

  const handleClear = () => {
    setImage(null);
    setSelected(false);
    setCorrect(null);
    setStatus("");
  };

  const handleDeleteNum = async () => {
    const n = parseInt(deleteNum, 10);
    if (!Number.isInteger(n) || n <= 0) {
      reportErr("יש להזין מספר תקין למחיקה.");
      return;
    }
    if (!window.confirm(`למחוק את השאלה מספר ${n} בשבוע ${week}?`)) return;
    setBusy(true);
    setStatus("");
    try {
      const result = await deleteTestQuestion(n, week);
      reportOk(`נמחק: ${result.deleted}`);
      setDeleteNum("");
      await refreshNext();
    } catch (e) {
      reportErr("שגיאה במחיקה: " + (e?.response?.data?.error || e.message));
    } finally {
      setBusy(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm(`לאפס את כל השאלות של שבוע ${week}?`)) return;
    setBusy(true);
    setStatus("");
    try {
      const result = await resetAllTestQuestions(week);
      reportOk(`אופס בהצלחה. נמחקו ${result.removed} קבצים.`);
      setImage(null);
      setSelected(false);
      setDeleteNum("");
      await refreshNext();
    } catch (e) {
      reportErr("שגיאה באיפוס: " + (e?.response?.data?.error || e.message));
    } finally {
      setBusy(false);
    }
  };

  const canSave = image && correct && !saving;

  return (
    <div dir="rtl" className="admin-wrap">
      <div className="admin-head">
        <span className="admin-accent" />
        <h1>העלאת שאלות מבחן</h1>
      </div>
      <p className="admin-lead">
        לחץ על המלבן ואז Ctrl+V להדבקת תמונה מהלוח. לחץ "אישור" לשמירה.
      </p>

      <div className="admin-card">
        <div className="admin-row" style={{ justifyContent: "space-between" }}>
          <div className="admin-row">
            <label className="admin-label">שבוע:</label>
            <input
              type="number"
              min="1"
              value={week}
              onChange={(e) => setWeek(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="admin-input small"
            />
          </div>
          {nextNum !== null && (
            <div className="admin-muted">
              המספר הבא: <strong style={{ color: "#16284b" }}>{nextNum}</strong>
            </div>
          )}
        </div>

        <div className="admin-preview-grid">
          <div
            onClick={() => setSelected(!selected)}
            className={`admin-preview ${selected ? "selected" : ""}`}
            style={{ width: 360, height: 240 }}
          >
            {image ? (
              <img src={image} alt="שאלה" />
            ) : (
              <div className="admin-preview-placeholder">
                <div style={{ fontSize: 24, marginBottom: 6 }}>📝</div>
                <div>תמונת השאלה</div>
                {selected && <div className="admin-preview-hint">מוכן להדבקה (Ctrl+V)</div>}
              </div>
            )}
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: 8, marginBottom: 6 }}>
          <div className="admin-label" style={{ marginBottom: 10 }}>
            תשובה נכונה:
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
            {["A", "B", "C", "D"].map((letter) => {
              const active = correct === letter;
              return (
                <button
                  key={letter}
                  onClick={() => setCorrect(letter)}
                  style={{
                    width: 54,
                    height: 54,
                    borderRadius: "50%",
                    border: active ? "2px solid #2eb872" : "2px solid #e5e7eb",
                    background: active ? "#2eb872" : "#fff",
                    color: active ? "#fff" : "#16284b",
                    fontSize: 22,
                    fontWeight: 800,
                    cursor: "pointer",
                    transition: "transform 0.1s, background 0.15s",
                    boxShadow: active ? "0 4px 12px rgba(46, 184, 114, 0.35)" : "0 2px 6px rgba(22,40,75,0.06)",
                  }}
                >
                  {letter}
                </button>
              );
            })}
          </div>
        </div>

        <div className="admin-actions">
          <button onClick={handleSave} disabled={!canSave} className="admin-btn primary">
            {saving ? "שומר..." : "✓ אישור"}
          </button>
          {image && (
            <button onClick={handleClear} className="admin-btn ghost">
              ניקוי
            </button>
          )}
        </div>

        {status && <div className={`admin-status ${statusType}`}>{status}</div>}
      </div>

      <div className="admin-card">
        <h3 className="admin-section-title">פעולות נוספות</h3>
        <div className="admin-row" style={{ justifyContent: "space-between" }}>
          <div className="admin-row">
            <label className="admin-label">מחיקת מספר:</label>
            <input
              type="number"
              min="1"
              value={deleteNum}
              onChange={(e) => setDeleteNum(e.target.value)}
              className="admin-input small"
              placeholder="מס'"
            />
            <button
              onClick={handleDeleteNum}
              disabled={busy || !deleteNum}
              className="admin-btn danger"
            >
              מחק שאלה
            </button>
          </div>
          <button onClick={handleReset} disabled={busy} className="admin-btn danger">
            איפוס הכל
          </button>
        </div>
      </div>
    </div>
  );
}

export default TestQuestions;
