import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { changePassword as changePasswordApi } from "../services/userService";
import Icon from "../components/Icon";

function ChangePassword() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null); // { ok, text }

  const handle = async (e) => {
    e.preventDefault();
    setMsg(null);
    if (next.length < 4) {
      setMsg({ ok: false, text: "הסיסמה החדשה חייבת להכיל לפחות 4 תווים" });
      return;
    }
    if (next !== confirm) {
      setMsg({ ok: false, text: "האישור לא תואם לסיסמה החדשה" });
      return;
    }
    setBusy(true);
    try {
      await changePasswordApi(currentUser._id, current, next);
      setMsg({ ok: true, text: "הסיסמה שונתה בהצלחה" });
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch (e) {
      setMsg({ ok: false, text: e?.response?.data?.message || "שגיאה" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div dir="rtl" style={wrap}>
      <button onClick={() => navigate(-1)} style={back}>
        <Icon name="rightArrow" size={14} /> חזרה
      </button>
      <h1 style={{ color: "#16284b", margin: "8px 0 4px" }}>החלפת סיסמה</h1>
      <p style={{ color: "#6b7280", margin: "0 0 20px" }}>
        משתמש: <strong>{currentUser?.name}</strong>
      </p>

      <form onSubmit={handle} style={card}>
        <label style={lbl}>
          סיסמה נוכחית
          <input
            type="password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            style={inp}
            autoComplete="current-password"
          />
        </label>
        <label style={lbl}>
          סיסמה חדשה
          <input
            type="password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            style={inp}
            autoComplete="new-password"
          />
        </label>
        <label style={lbl}>
          אישור סיסמה חדשה
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            style={inp}
            autoComplete="new-password"
          />
        </label>
        <button type="submit" className="btn" style={submit} disabled={busy}>
          {busy ? "שומר..." : "שמור סיסמה חדשה"}
        </button>
      </form>

      {msg && (
        <div
          style={{
            ...statusBox,
            background: msg.ok ? "#dcf5e6" : "#fde2d8",
            color: msg.ok ? "#1a6b3f" : "#8a2e13",
          }}
        >
          {msg.text}
        </div>
      )}
    </div>
  );
}

const wrap = { padding: 18, maxWidth: 480, margin: "0 auto" };
const back = {
  background: "transparent",
  border: "none",
  color: "#16284b",
  cursor: "pointer",
  fontSize: 15,
  fontWeight: 700,
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: 0,
};
const card = {
  background: "#fff",
  borderRadius: 16,
  padding: 18,
  display: "grid",
  gap: 12,
  boxShadow: "0 4px 14px rgba(22,40,75,0.08)",
};
const lbl = { display: "grid", gap: 6, fontSize: 13, fontWeight: 700, color: "#16284b" };
const inp = {
  padding: "12px 14px",
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  fontSize: 15,
  fontFamily: "inherit",
  background: "#f5f6fa",
  outline: "none",
};
const submit = {
  background: "#16284b",
  color: "#f7c90c",
  border: "none",
  borderRadius: 10,
  padding: "12px",
  fontWeight: 700,
  cursor: "pointer",
};
const statusBox = {
  marginTop: 14,
  padding: "10px 14px",
  borderRadius: 12,
  fontSize: 14,
  fontWeight: 600,
  textAlign: "center",
};

export default ChangePassword;
