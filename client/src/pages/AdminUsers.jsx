import { useEffect, useState } from "react";
import * as userService from "../services/userService";
import "./Admin.css";

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

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
    if (!name.trim()) return;
    setSaving(true);
    try {
      await userService.createUser({ name: name.trim(), role: "user" });
      setName("");
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

  return (
    <div dir="rtl" className="admin-wrap">
      <div className="admin-head">
        <span className="admin-accent" />
        <h1>ניהול משתמשים</h1>
      </div>
      <p className="admin-lead">הוספה, מחיקה וצפייה במשתמשי המערכת.</p>

      <div className="admin-card">
        <h3 className="admin-section-title">הוספת משתמש חדש</h3>
        <form onSubmit={handleAdd} className="admin-row">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="שם המשתמש"
            className="admin-input"
            style={{ flex: 1, minWidth: 160 }}
          />
          <button type="submit" className="admin-btn primary" disabled={saving}>
            הוסף
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
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
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
                    }}
                  >
                    {u.name.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: "#16284b" }}>{u.name}</div>
                    <div className="admin-muted" style={{ fontSize: 12 }}>
                      {u.role === "admin" ? "מנהל" : "משתמש"} · נוצר{" "}
                      {new Date(u.createdAt).toLocaleDateString("he-IL")}
                    </div>
                  </div>
                </div>
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminUsers;
