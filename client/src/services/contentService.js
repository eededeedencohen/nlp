import api from "./api";
import { DOMAIN } from "../constants";

export const getWeeks = () => api.get("/content/weeks").then((r) => r.data);

export const getCardsData = (week) =>
  api.get("/content/cards-data", { params: week ? { week } : {} }).then((r) => r.data);
export const getTestQuestionsData = (week) =>
  api
    .get("/content/test-questions-data", { params: week ? { week } : {} })
    .then((r) => r.data);
export const getInfographics = (week) =>
  api
    .get("/content/infographics", { params: week ? { week } : {} })
    .then((r) => r.data.map((f) => ({ ...f, url: `${DOMAIN}${f.url}` })));
export const getPresentations = (week) =>
  api
    .get("/content/presentations", { params: week ? { week } : {} })
    .then((r) => r.data.map((f) => ({ ...f, url: `${DOMAIN}${f.url}` })));

export const uploadInfographic = (file, filename, week = 1) =>
  api
    .post("/content/infographics", { file, filename, week })
    .then((r) => r.data);

export const deleteInfographic = (name, week = 1) =>
  api
    .delete(`/content/infographics/${encodeURIComponent(name)}`, { params: { week } })
    .then((r) => r.data);

export const uploadPresentation = (file, filename, week = 1) =>
  api
    .post("/content/presentations", { file, filename, week })
    .then((r) => r.data);

export const deletePresentation = (name, week = 1) =>
  api
    .delete(`/content/presentations/${encodeURIComponent(name)}`, { params: { week } })
    .then((r) => r.data);
export const getCardImages = () =>
  api.get("/content/card-images").then((r) =>
    r.data.map((c) => ({
      ...c,
      front: c.front ? `${DOMAIN}${c.front}` : null,
      back: c.back ? `${DOMAIN}${c.back}` : null,
    }))
  );
export const getTestImages = () =>
  api.get("/content/test-images").then((r) =>
    r.data.map((t) => ({ ...t, url: `${DOMAIN}${t.url}` }))
  );
