import api from "./api";

export const saveTestQuestion = (image, week = 1, correct = "A") =>
  api.post("/test-questions", { image, week, correct }).then((res) => res.data);

export const getNextTestQuestionNumber = (week = 1) =>
  api.get("/test-questions/next", { params: { week } }).then((res) => res.data);

export const deleteTestQuestion = (number, week = 1) =>
  api.delete(`/test-questions/${number}`, { params: { week } }).then((res) => res.data);

export const resetAllTestQuestions = (week) =>
  api
    .delete("/test-questions/reset", { params: week ? { week } : {} })
    .then((res) => res.data);
