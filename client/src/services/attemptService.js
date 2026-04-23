import api from "./api";

export const startAttempt = (userId, week = 1) =>
  api.post(`/attempts/${userId}/start`, { week }).then((r) => r.data);

export const saveAttemptProgress = (attemptId, answers) =>
  api.put(`/attempts/save/${attemptId}`, { answers }).then((r) => r.data);

export const completeAttempt = (attemptId, answers) =>
  api.put(`/attempts/complete/${attemptId}`, { answers }).then((r) => r.data);

export const getUserAttempts = (userId, week) =>
  api
    .get(`/attempts/${userId}`, { params: week ? { week } : {} })
    .then((r) => r.data);

export const getAllAttempts = () => api.get(`/attempts/all`).then((r) => r.data);

export const deleteAttempt = (attemptId, userId) =>
  api.delete(`/attempts/${attemptId}`, { data: { userId } }).then((r) => r.data);

export const resetMyAttempts = (userId, week) =>
  api
    .delete(`/attempts/user/${userId}/reset`, { params: week ? { week } : {} })
    .then((r) => r.data);
