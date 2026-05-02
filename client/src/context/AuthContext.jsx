import { createContext, useContext, useEffect, useState } from "react";
import { login as loginApi } from "../services/userService";

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

  const login = async (email, password) => {
    const data = await loginApi(email, password);
    setCurrentUser(data);
    return data;
  };

  const logout = () => setCurrentUser(null);

  const updateCurrent = (patch) =>
    setCurrentUser((u) => (u ? { ...u, ...patch } : u));

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, updateCurrent }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
