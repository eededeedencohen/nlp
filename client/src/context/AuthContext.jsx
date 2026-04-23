import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";

const AuthContext = createContext(null);
const STORAGE_KEY = "currentUser";

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (currentUser) localStorage.setItem(STORAGE_KEY, JSON.stringify(currentUser));
    else localStorage.removeItem(STORAGE_KEY);
  }, [currentUser]);

  const loginAdmin = async () => {
    const { data } = await api.post("/users/login/admin");
    setCurrentUser(data);
    return data;
  };

  const loginUser = async (userId) => {
    const { data } = await api.post("/users/login/user", { userId });
    setCurrentUser(data);
    return data;
  };

  const logout = () => setCurrentUser(null);

  return (
    <AuthContext.Provider value={{ currentUser, loginAdmin, loginUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
