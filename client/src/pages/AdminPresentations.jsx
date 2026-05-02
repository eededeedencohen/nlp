import { useEffect, useRef, useState } from "react";
import {
  getPresentations,
  uploadPresentation,
  deletePresentation,
} from "../services/contentService";
import "./Admin.css";

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function fmtSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function AdminPresentations() {
  const [week, setWeek] = useState(1);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState("");
  const [statusType, setStatusType] = useState("ok");
  const fileRef = useRef(null);

  const refresh = async (w = week) => {
    setLoading(true);
    try {
      const data = await getPresentations(w);
      setItems(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh(week);
  }, [week]);

  const ok = (m) => {
    setStatusType("ok");
    setStatus(m);
  };
  const err = (m) => {
    setStatusType("err");
    setStatus(m);
  };

  const handleFiles = async (files) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setStatus("");
    try {
      let uploaded = 0;
      for (const f of files) {
        if (f.type !== "application/pdf") continue;
        if (f.size > 45 * 1024 * 1024) {
          err(`הקובץ ${f.name} גדול מדי (מקסימום ~45MB)`);
          continue;
        }
        const url = await fileToDataUrl(f);
        await uploadPresentation(url, f.name, week);
        uploaded++;
      }
      if (uploaded > 0) ok(`הועלו ${uploaded} מצגות לשבוע ${week}`);
      await refresh(week);
    } catch (e) {
      err("שגיאה בהעלאה: " + (e?.response?.data?.error || e.message));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`למחוק את ${item.name}?`)) return;
    try {
      await deletePresentation(item.id);
      ok(`נמחק: ${item.name}`);
      await refresh(week);
    } catch (e) {
      err("שגיאה במחיקה: " + (e?.response?.data?.error || e.message));
    }
  };

  return (
    <div dir="rtl" className="admin-wrap">
      <div className="admin-head">
        <span className="admin-accent" />
        <h1>ניהול מצגות</h1>
      </div>
      <p className="admin-lead">העלאת קבצי PDF למשתמשים, מחולק לפי שבועות.</p>

      <div className="admin-card">
        <h3 className="admin-section-title">העלאה</h3>
        <div className="admin-row" style={{ flexWrap: "wrap" }}>
          <label className="admin-label">שבוע:</label>
          <input
            type="number"
            min="1"
            value={week}
            onChange={(e) => setWeek(Math.max(1, parseInt(e.target.value, 10) || 1))}
            className="admin-input small"
          />
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf"
            multiple
            onChange={(e) => handleFiles(e.target.files)}
            style={{ display: "none" }}
          />
          <button
            className="admin-btn primary"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? "מעלה..." : "📎 בחר PDF"}
          </button>
        </div>
        <div className="admin-muted" style={{ marginTop: 8, fontSize: 12 }}>
          רק קבצי PDF, מקסימום 45MB לקובץ.
        </div>
        {status && <div className={`admin-status ${statusType}`}>{status}</div>}
      </div>

      <div className="admin-card">
        <h3 className="admin-section-title">
          קיימות בשבוע {week} ({items.length})
        </h3>
        {loading ? (
          <p className="admin-muted">טוען...</p>
        ) : items.length === 0 ? (
          <p className="admin-muted">אין מצגות לשבוע זה עדיין.</p>
        ) : (
          <div className="admin-list">
            {items.map((p) => (
              <div key={p.id || p.name} className="admin-list-row">
                <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 10,
                      background: "#16284b",
                      color: "#f7c90c",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 800,
                      fontSize: 13,
                      flexShrink: 0,
                    }}
                  >
                    PDF
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 700,
                        color: "#16284b",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {p.name}
                    </div>
                    <div className="admin-muted" style={{ fontSize: 12 }}>
                      <a href={p.url} target="_blank" rel="noreferrer" style={{ color: "#16284b" }}>
                        פתיחה בלשונית חדשה
                      </a>
                    </div>
                  </div>
                </div>
                <button
                  className="admin-btn danger"
                  style={{ padding: "7px 14px", fontSize: 13 }}
                  onClick={() => handleDelete(p)}
                >
                  מחק
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminPresentations;
