import { useEffect, useRef, useState } from "react";
import {
  getInfographics,
  uploadInfographic,
  deleteInfographic,
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

function AdminInfographics() {
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
      const data = await getInfographics(w);
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
        if (!f.type.startsWith("image/")) continue;
        const url = await fileToDataUrl(f);
        await uploadInfographic(url, f.name, week);
        uploaded++;
      }
      ok(`הועלו ${uploaded} אינפוגרפיות לשבוע ${week}`);
      await refresh(week);
    } catch (e) {
      err("שגיאה בהעלאה: " + (e?.response?.data?.error || e.message));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleDelete = async (name) => {
    if (!window.confirm(`למחוק את ${name}?`)) return;
    try {
      await deleteInfographic(name, week);
      ok(`נמחק: ${name}`);
      await refresh(week);
    } catch (e) {
      err("שגיאה במחיקה: " + (e?.response?.data?.error || e.message));
    }
  };

  return (
    <div dir="rtl" className="admin-wrap">
      <div className="admin-head">
        <span className="admin-accent" />
        <h1>ניהול אינפוגרפיות</h1>
      </div>
      <p className="admin-lead">העלאת תמונות אינפוגרפיקה למשתמשים, מחולק לפי שבועות.</p>

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
            accept="image/*"
            multiple
            onChange={(e) => handleFiles(e.target.files)}
            style={{ display: "none" }}
          />
          <button
            className="admin-btn primary"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? "מעלה..." : "📎 בחר קבצים"}
          </button>
        </div>
        <div className="admin-muted" style={{ marginTop: 8, fontSize: 12 }}>
          ניתן לבחור כמה תמונות יחד. סוגים נתמכים: png, jpg, gif, webp.
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
          <p className="admin-muted">אין אינפוגרפיות לשבוע זה עדיין.</p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
              gap: 12,
            }}
          >
            {items.map((img) => (
              <div
                key={img.name}
                style={{
                  background: "#fff",
                  border: "1px solid #eef0f4",
                  borderRadius: 12,
                  overflow: "hidden",
                  boxShadow: "0 2px 8px rgba(22,40,75,0.05)",
                }}
              >
                <img
                  src={img.url}
                  alt={img.name}
                  style={{
                    width: "100%",
                    aspectRatio: "1/1",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
                <div style={{ padding: 10 }}>
                  <div
                    style={{
                      fontSize: 12,
                      color: "#16284b",
                      fontWeight: 700,
                      wordBreak: "break-all",
                      marginBottom: 8,
                    }}
                  >
                    {img.name}
                  </div>
                  <button
                    className="admin-btn danger"
                    style={{ padding: "6px 12px", fontSize: 12, width: "100%" }}
                    onClick={() => handleDelete(img.name)}
                  >
                    מחק
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminInfographics;
