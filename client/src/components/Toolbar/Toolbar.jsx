import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Icon from "../Icon";
import Logo from "../Logo";
import "./Toolbar.css";

function Toolbar({ variant }) {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  if (!currentUser) return null;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className={`toolbar toolbar-${variant}`}>
      <div className="toolbar-brand">
        <Logo variant="icon" size={30} />
      </div>
      <div className="toolbar-links">
        {variant === "admin" ? (
          <>
            <Link to="/admin"><Icon name="home" size={16} /> דאשבורד</Link>
            <Link to="/admin/users">משתמשים</Link>
            <Link to="/admin/cards">כרטיסיות</Link>
            <Link to="/admin/test-questions">שאלות מבחן</Link>
            <Link to="/admin/infographics">אינפוגרפיות</Link>
            <Link to="/admin/presentations">מצגות</Link>
            <Link to="/admin/attempts">ניסיונות</Link>
          </>
        ) : (
          <Link to="/learn" className="toolbar-home-link">
            <Icon name="home" size={18} /> בית
          </Link>
        )}
      </div>
      <div className="toolbar-user">
        <span>{currentUser.name}</span>
        <button onClick={handleLogout} className="toolbar-logout">יציאה</button>
      </div>
    </nav>
  );
}

export default Toolbar;
