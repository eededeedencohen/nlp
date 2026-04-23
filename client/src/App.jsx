import "./App.css";
import { useLocation } from "react-router-dom";
import Routing from "./Routing";
import Toolbar from "./components/Toolbar/Toolbar";
import { useAuth } from "./context/AuthContext";

function App() {
  const { currentUser } = useAuth();
  const location = useLocation();
  const onLogin = location.pathname === "/login";
  const showToolbar = currentUser && !onLogin;

  return (
    <div className={`App ${showToolbar ? "with-toolbar" : ""}`}>
      {showToolbar && <Toolbar variant={currentUser.role} />}
      <Routing />
    </div>
  );
}

export default App;
