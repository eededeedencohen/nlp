import { Link } from "react-router-dom";
import "./Admin.css";

const tiles = [
  { to: "/admin/users", title: "משתמשים", desc: "ניהול משתמשי המערכת", icon: "👥" },
  { to: "/admin/infographics", title: "אינפוגרפיות", desc: "העלאת תמונות אינפוגרפיקה", icon: "🖼️" },
  { to: "/admin/presentations", title: "מצגות", desc: "העלאת קבצי PDF", icon: "📖" },
  { to: "/admin/attempts", title: "ניסיונות מבחן", desc: "מעקב אחרי ביצועי משתמשים", icon: "📊" },
];

function AdminHome() {
  return (
    <div dir="rtl" className="admin-wrap">
      <div className="admin-head">
        <span className="admin-accent" />
        <h1>לוח ניהול</h1>
      </div>
      <p className="admin-lead">בחר קטגוריה לניהול:</p>

      <div className="admin-tile-grid">
        {tiles.map((t) => (
          <Link key={t.to} to={t.to} className="admin-tile">
            <div style={{ fontSize: 28, marginBottom: 8 }}>{t.icon}</div>
            <h3>{t.title}</h3>
            <p>{t.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default AdminHome;
