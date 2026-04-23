import { useState } from "react";
import { useUsers } from "../hooks/useUsers";

function Users() {
  const { users, loading, error, addUser, removeUser } = useUsers();
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await addUser(form);
    setForm({ name: "", email: "", password: "" });
  };

  if (loading) return <p>טוען...</p>;
  if (error) return <p>שגיאה: {error}</p>;

  return (
    <div style={{ padding: 24 }}>
      <h1>משתמשים</h1>

      <form onSubmit={handleSubmit} style={{ marginBottom: 24 }}>
        <input
          placeholder="שם"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <input
          placeholder="אימייל"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <input
          placeholder="סיסמה"
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <button type="submit">הוסף</button>
      </form>

      <ul>
        {users.map((u) => (
          <li key={u._id}>
            {u.name} — {u.email}{" "}
            <button onClick={() => removeUser(u._id)}>מחק</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Users;
