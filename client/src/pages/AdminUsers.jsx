import { useEffect, useState } from "react";
import * as userService from "../services/userService";
import "./Admin.css";

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [resetTarget, setResetTarget] = useState(null);
  const [newPassword, setNewPassword] = useState("");

  const refresh = async () => {
    setLoading(true);
    try {
      const data = await userService.getUsers();
      setUsers(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim() || !form.email.trim() || !form.password) return;
    setSaving(true);
    try {
      await userService.createUser({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: "user",
      });
      setForm({ name: "", email: "", password: "" });
      await refresh();
    } catch (err) {
      setError(err?.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`למחוק את ${name}? גם ההתקדמות שלו תימחק.`)) return;
    await userService.deleteUser(id);
    await refresh();
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetTarget || !newPassword) return;
    try {
      await userService.updateUser(resetTarget._id, { password: newPassword });
      alert(`הסיסמה של ${resetTarget.name} שונתה`);
      setResetTarget(null);
      setNewPassword("");
    } catch (err) {
      alert("שגיאה: " + (err?.response?.data?.message || err.message));
    }
  };

  return (
    <div dir="rtl" className="admin-wrap">
      <div className="admin-head">
        <span className="admin-accent" />
        <h1>ניהול משתמשים</h1>
      </div>
      <p className="admin-lead">הוספה, מחיקה ואיפוס סיסמה למשתמשים.</p>

      <div className="admin-card">
        <h3 className="admin-section-title">הוספת משתמש חדש</h3>
        <form onSubmit={handleAdd} style={{ display: "grid", gap: 10 }}>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="שם מלא"
            className="admin-input"
          />
          <input
            type="email"
            dir="ltr"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="email@example.com"
            className="admin-input"
          />
          <input
            type="text"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="סיסמה ראשונית (לפחות 4 תווים)"
            className="admin-input"
          />
          <button type="submit" className="admin-btn primary" disabled={saving}>
            {saving ? "מוסיף..." : "הוסף משתמש"}
          </button>
        </form>
        {error && <div className="admin-status err">{error}</div>}
      </div>

      <div className="admin-card">
        <h3 className="admin-section-title">רשימת משתמשים ({users.length})</h3>
        {loading ? (
          <p className="admin-muted">טוען...</p>
        ) : (
          <div className="admin-list">
            {users.map((u) => (
              <div key={u._id} className="admin-list-row">
                <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      background: u.role === "admin" ? "#f7c90c" : "#16284b",
                      color: u.role === "admin" ? "#16284b" : "#f7c90c",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 900,
                      fontSize: 17,
                      flexShrink: 0,
                    }}
                  >
                    {(u.name || "?").charAt(0)}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, color: "#16284b" }}>{u.name}</div>
                    <div className="admin-muted" style={{ fontSize: 12, direction: "ltr", textAlign: "right" }}>
                      {u.email}
                    </div>
                    <div className="admin-muted" style={{ fontSize: 11 }}>
                      {u.role === "admin" ? "מנהל" : "משתמש"} · נוצר{" "}
                      {new Date(u.createdAt).toLocaleDateString("he-IL")}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <button
                    className="admin-btn ghost"
                    onClick={() => {
                      setResetTarget(u);
                      setNewPassword("");
                    }}
                    style={{ padding: "7px 12px", fontSize: 12 }}
                  >
                    איפוס סיסמה
                  </button>
                  {u.role !== "admin" && (
                    <button
                      className="admin-btn danger"
                      onClick={() => handleDelete(u._id, u.name)}
                      style={{ padding: "7px 14px", fontSize: 13 }}
                    >
                      מחק
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {resetTarget && (
        <div
          onClick={() => setResetTarget(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(11,28,59,0.55)",
            zIndex: 2000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleResetPassword}
            style={{
              background: "#fff",
              borderRadius: 16,
              padding: 20,
              width: "100%",
              maxWidth: 360,
              display: "grid",
              gap: 12,
            }}
          >
            <h3 style={{ margin: 0, color: "#16284b" }}>איפוס סיסמה ל-{resetTarget.name}</h3>
            <input
              type="text"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="סיסמה חדשה"
              className="admin-input"
              autoFocus
            />
            <div style={{ display: "flex", gap: 8 }}>
              <button type="submit" className="admin-btn primary" style={{ flex: 1 }}>
                שמור
              </button>
              <button
                type="button"
                className="admin-btn ghost"
                onClick={() => setResetTarget(null)}
              >
                ביטול
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default AdminUsers;
