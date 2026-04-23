import api from "./api";

export const getMyCardProgress = (userId, week = 1) =>
  api.get(`/progress/${userId}`, { params: { week } }).then((r) => r.data);

export const setCardStatus = (userId, cardNumber, status, week = 1) =>
  api
    .post(`/progress/${userId}`, { cardNumber, status, week })
    .then((r) => r.data);

export const resetMyCardProgress = (userId, week) =>
  api
    .delete(`/progress/${userId}`, { params: week ? { week } : {} })
    .then((r) => r.data);

export const getProgressSummary = () =>
  api.get(`/progress/summary`).then((r) => r.data);
