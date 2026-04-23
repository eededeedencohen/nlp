import { createContext, useContext, useState, useEffect, useCallback } from "react";
import * as userService from "../services/userService";

const UserContext = createContext(null);

export const UserContextProvider = ({ children }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await userService.getUsers();
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const addUser = useCallback(async (userData) => {
    const newUser = await userService.createUser(userData);
    setUsers((prev) => [...prev, newUser]);
    return newUser;
  }, []);

  const removeUser = useCallback(async (id) => {
    await userService.deleteUser(id);
    setUsers((prev) => prev.filter((u) => u._id !== id));
  }, []);

  return (
    <UserContext.Provider
      value={{ users, loading, error, addUser, removeUser, refetch: fetchUsers }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUserContext = () => {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUserContext must be used within UserContextProvider");
  return ctx;
};
