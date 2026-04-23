import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getUsers } from "../services/userService";
import Logo from "../components/Logo";

function Login() {
  const [mode, setMode] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { loginAdmin, loginUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (mode === "user") {
      setLoading(true);
      getUsers()
        .then((all) => setUsers(all.filter((u) => u.role === "user")))
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
    }
  }, [mode]);

  const handleAdmin = async () => {
    setError("");
    try {
      await loginAdmin();
      navigate("/admin");
    } catch (e) {
      setError(e?.response?.data?.message || e.message);
    }
  };

  const handleUser = async (userId) => {
    setError("");
    try {
      await loginUser(userId);
      navigate("/learn");
    } catch (e) {
      setError(e?.response?.data?.message || e.message);
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
          <p style={subtitle}>ברוכים הבאים! בחרו איך להתחבר</p>
        </div>

        {!mode && (
          <div style={{ display: "grid", gap: 12 }}>
            <button style={bigBtn("var(--brand)", "#fff")} onClick={() => setMode("user")}>
              כניסה כמשתמש
            </button>
            <button style={bigBtn("var(--accent)", "var(--brand)")} onClick={() => setMode("admin")}>
              כניסה כמנהל
            </button>
          </div>
        )}

        {mode === "admin" && (
          <div style={{ display: "grid", gap: 12 }}>
            <p>כניסה ישירה לחשבון המנהל</p>
            <button style={bigBtn("var(--brand)", "#fff")} onClick={handleAdmin}>
              המשך כמנהל
            </button>
            <button style={linkBtn} onClick={() => setMode(null)}>
              חזרה
            </button>
          </div>
        )}

        {mode === "user" && (
          <div style={{ display: "grid", gap: 10 }}>
            <p>בחרו את המשתמש שלכם:</p>
            {loading ? (
              <p>טוען...</p>
            ) : users.length === 0 ? (
              <p style={{ color: "#888" }}>אין משתמשים עדיין. פנו למנהל.</p>
            ) : (
              users.map((u) => (
                <button key={u._id} style={userBtn} onClick={() => handleUser(u._id)}>
                  {u.name}
                </button>
              ))
            )}
            <button style={linkBtn} onClick={() => setMode(null)}>
              חזרה
            </button>
          </div>
        )}

        {error && <p style={{ color: "#e4572e", marginTop: 12 }}>{error}</p>}
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

const bigBtn = (bg, color) => ({
  padding: "14px 18px",
  background: bg,
  color,
  border: "none",
  borderRadius: 12,
  fontSize: 16,
  fontWeight: 700,
  cursor: "pointer",
  boxShadow: "0 6px 16px rgba(22,40,75,0.2)",
});

const userBtn = {
  padding: "14px 18px",
  background: "#f5f6fa",
  color: "#16284b",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  fontSize: 16,
  fontWeight: 600,
  cursor: "pointer",
  textAlign: "center",
};

const linkBtn = {
  background: "transparent",
  border: "none",
  color: "#16284b",
  cursor: "pointer",
  fontSize: 14,
  padding: 6,
};

export default Login;
