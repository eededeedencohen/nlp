import api from "./api";

export const listComments = (type, number, week = 1) =>
  api
    .get(`/comments/${type}/${number}`, { params: { week } })
    .then((r) => r.data);

export const addComment = (type, number, userId, text, week = 1) =>
  api
    .post(`/comments/${type}/${number}`, { userId, text, week })
    .then((r) => r.data);

export const deleteComment = (id, userId) =>
  api.delete(`/comments/${id}`, { data: { userId } }).then((r) => r.data);
