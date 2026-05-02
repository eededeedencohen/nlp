import api from "./api";

export const getUsers = () => api.get("/users").then((res) => res.data);

export const getUserById = (id) =>
  api.get(`/users/${id}`).then((res) => res.data);

export const createUser = (data) =>
  api.post("/users", data).then((res) => res.data);

export const updateUser = (id, data) =>
  api.put(`/users/${id}`, data).then((res) => res.data);

export const deleteUser = (id) =>
  api.delete(`/users/${id}`).then((res) => res.data);

export const login = (email, password) =>
  api.post("/users/login", { email, password }).then((r) => r.data);

export const changePassword = (userId, currentPassword, newPassword) =>
  api
    .post(`/users/${userId}/change-password`, { currentPassword, newPassword })
    .then((r) => r.data);
