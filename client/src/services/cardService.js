import api from "./api";

export const saveCards = (front, back, week = 1) =>
  api.post("/cards", { front, back, week }).then((res) => res.data);

export const getNextCardNumber = (week = 1) =>
  api.get("/cards/next", { params: { week } }).then((res) => res.data);

export const deleteCard = (number, week = 1) =>
  api.delete(`/cards/${number}`, { params: { week } }).then((res) => res.data);

export const resetAllCards = (week) =>
  api
    .delete("/cards/reset", { params: week ? { week } : {} })
    .then((res) => res.data);
