import { useEffect, useRef, useState } from "react";
import {
  saveCards,
  getNextCardNumber,
  deleteCard,
  resetAllCards,
} from "../services/cardService";
import "./Admin.css";

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function Cards() {
  const [front, setFront] = useState(null);
  const [back, setBack] = useState(null);
  const [selected, setSelected] = useState(null);
  const [nextNum, setNextNum] = useState(null);
  const [status, setStatus] = useState("");
  const [statusType, setStatusType] = useState("ok");
  const [saving, setSaving] = useState(false);
  const [deleteNum, setDeleteNum] = useState("");
  const [busy, setBusy] = useState(false);
  const [week, setWeek] = useState(1);

  const selectedRef = useRef(selected);
  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  const refreshNext = async (w = week) => {
    try {
      const { next } = await getNextCardNumber(w);
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
      const target = selectedRef.current;
      if (!target) {
        reportErr("בחר קודם לאיזה צד להדביק (לחץ על המלבן).");
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
      if (target === "front") setFront(url);
      else setBack(url);
      setSelected(null);
      setStatus("");
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, []);

  const handleSave = async () => {
    if (!front || !back) return;
    setSaving(true);
    setStatus("");
    try {
      const result = await saveCards(front, back, week);
      reportOk(`נשמר בהצלחה: ${result.front}, ${result.back}`);
      setFront(null);
      setBack(null);
      setSelected(null);
      await refreshNext();
    } catch (e) {
      reportErr("שגיאה בשמירה: " + (e?.response?.data?.error || e.message));
    } finally {
      setSaving(false);
    }
  };

  const handleClear = () => {
    setFront(null);
    setBack(null);
    setSelected(null);
    setStatus("");
  };

  const handleDeleteNum = async () => {
    const n = parseInt(deleteNum, 10);
    if (!Number.isInteger(n) || n <= 0) {
      reportErr("יש להזין מספר תקין למחיקה.");
      return;
    }
    if (!window.confirm(`למחוק את הזוג מספר ${n} בשבוע ${week}?`)) return;
    setBusy(true);
    setStatus("");
    try {
      const result = await deleteCard(n, week);
      reportOk(`נמחק: ${result.deleted.join(", ")}`);
      setDeleteNum("");
      await refreshNext();
    } catch (e) {
      reportErr("שגיאה במחיקה: " + (e?.response?.data?.error || e.message));
    } finally {
      setBusy(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm(`לאפס את כל הכרטיסיות של שבוע ${week}?`)) return;
    setBusy(true);
    setStatus("");
    try {
      const result = await resetAllCards(week);
      reportOk(`אופס בהצלחה. נמחקו ${result.removed} קבצים.`);
      setFront(null);
      setBack(null);
      setSelected(null);
      setDeleteNum("");
      await refreshNext();
    } catch (e) {
      reportErr("שגיאה באיפוס: " + (e?.response?.data?.error || e.message));
    } finally {
      setBusy(false);
    }
  };

  const canSave = front && back && !saving;

  return (
    <div dir="rtl" className="admin-wrap">
      <div className="admin-head">
        <span className="admin-accent" />
        <h1>הדבקת כרטיסיות</h1>
      </div>
      <p className="admin-lead">
        לחץ על אחד המלבנים לבחירה, ואז Ctrl+V ידביק אליו את התמונה האחרונה בלוח. כששני הצדדים מלאים — לחץ "אישור".
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
          <PreviewBox
            title="צד קדמי"
            src={front}
            selected={selected === "front"}
            onClick={() => setSelected(selected === "front" ? null : "front")}
          />
          <PreviewBox
            title="צד אחורי"
            src={back}
            selected={selected === "back"}
            onClick={() => setSelected(selected === "back" ? null : "back")}
          />
        </div>

        <div className="admin-actions">
          <button onClick={handleSave} disabled={!canSave} className="admin-btn primary">
            {saving ? "שומר..." : "✓ אישור"}
          </button>
          {(front || back) && (
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
              מחק זוג
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

function PreviewBox({ title, src, selected, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`admin-preview ${selected ? "selected" : ""}`}
    >
      {src ? (
        <img src={src} alt={title} />
      ) : (
        <div className="admin-preview-placeholder">
          <div style={{ fontSize: 24, marginBottom: 6 }}>🖼️</div>
          <div>{title}</div>
          {selected && <div className="admin-preview-hint">מוכן להדבקה (Ctrl+V)</div>}
        </div>
      )}
    </div>
  );
}

export default Cards;
