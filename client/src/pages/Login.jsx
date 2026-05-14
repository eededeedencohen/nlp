import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Logo from "../components/Logo";

function Login() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!identifier.trim() || !password) {
      setError("נא להזין שם משתמש/אימייל וסיסמה");
      return;
    }
    setLoading(true);
    try {
      const user = await login(identifier.trim(), password);
      navigate(user.role === "admin" ? "/admin" : "/learn");
    } catch (e) {
      setError(e?.response?.data?.message || "שגיאה בהתחברות");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={wrapper}>
      <div style={decor1} />
      <div style={decor2} />
      <div style={inner}>
        <div style={brand}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
            <Logo variant="logo" size={88} />
          </div>
          <p style={subtitle}>ברוכים הבאים! הזינו את פרטי ההתחברות</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
          <label style={label}>
            שם משתמש או אימייל
            <input
              type="text"
              autoComplete="username"
              dir="ltr"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              style={input}
              placeholder="username or email"
            />
          </label>
          <label style={label}>
            סיסמה
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={input}
              placeholder="••••••••"
            />
          </label>
          <button type="submit" style={submitBtn} disabled={loading}>
            {loading ? "מתחבר..." : "כניסה"}
          </button>
        </form>

        {error && <p style={{ color: "#e4572e", marginTop: 12, textAlign: "center" }}>{error}</p>}
      </div>
    </div>
  );
}

const wrapper = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 20,
  background: "#16284b",
  position: "relative",
  overflow: "hidden",
};

const decor1 = {
  position: "absolute",
  top: -90,
  right: -90,
  width: 240,
  height: 240,
  borderRadius: "50%",
  background: "#f7c90c",
  opacity: 0.12,
  pointerEvents: "none",
};
const decor2 = {
  position: "absolute",
  bottom: -70,
  left: -70,
  width: 180,
  height: 180,
  borderRadius: "50%",
  background: "#f7c90c",
  opacity: 0.08,
  pointerEvents: "none",
};

const inner = {
  background: "#fff",
  borderRadius: 24,
  padding: 28,
  width: "100%",
  maxWidth: 380,
  boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
  position: "relative",
  zIndex: 1,
};

const brand = { textAlign: "center", marginBottom: 24 };
const subtitle = { margin: 0, color: "#6b7280", fontSize: 14, textAlign: "center" };

const label = {
  display: "grid",
  gap: 6,
  fontSize: 13,
  fontWeight: 700,
  color: "#16284b",
};

const input = {
  width: "100%",
  padding: "12px 14px",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  fontSize: 15,
  fontFamily: "inherit",
  background: "#f5f6fa",
  outline: "none",
};

const submitBtn = {
  padding: "14px 18px",
  background: "#16284b",
  color: "#f7c90c",
  border: "none",
  borderRadius: 12,
  fontSize: 16,
  fontWeight: 700,
  cursor: "pointer",
  marginTop: 6,
};

export default Login;
