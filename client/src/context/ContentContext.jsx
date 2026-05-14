import { createContext, useCallback, useContext, useRef, useState } from "react";
import {
  getCardsData,
  getTestQuestionsData,
  getInfographics,
  getPresentations,
  getWeeks,
} from "../services/contentService";

const ContentContext = createContext(null);

export const ContentProvider = ({ children }) => {
  const [cards, setCards] = useState({});         // { [week]: data }
  const [tests, setTests] = useState({});         // { [week]: data }
  const [infographics, setInfographics] = useState({}); // { [week]: array }
  const [presentations, setPresentations] = useState({});
  const [weeks, setWeeks] = useState(null);

  // Track in-flight requests to dedupe parallel fetches
  const pending = useRef({
    cards: new Map(),
    tests: new Map(),
    infographics: new Map(),
    presentations: new Map(),
    weeks: null,
  });

  const fetchOrCache = (key, week, currentMap, setter, fetcher) => {
    if (currentMap[week] !== undefined) return Promise.resolve(currentMap[week]);
    if (pending.current[key].has(week)) return pending.current[key].get(week);
    const p = fetcher(week)
      .then((data) => {
        setter((prev) => ({ ...prev, [week]: data }));
        return data;
      })
      .finally(() => pending.current[key].delete(week));
    pending.current[key].set(week, p);
    return p;
  };

  const ensureCards = useCallback(
    (week) => fetchOrCache("cards", week, cards, setCards, getCardsData),
    [cards]
  );
  const ensureTests = useCallback(
    (week) => fetchOrCache("tests", week, tests, setTests, getTestQuestionsData),
    [tests]
  );
  const ensureInfographics = useCallback(
    (week) =>
      fetchOrCache("infographics", week, infographics, setInfographics, getInfographics),
    [infographics]
  );
  const ensurePresentations = useCallback(
    (week) =>
      fetchOrCache("presentations", week, presentations, setPresentations, getPresentations),
    [presentations]
  );

  const ensureWeeks = useCallback(() => {
    if (weeks !== null) return Promise.resolve(weeks);
    if (pending.current.weeks) return pending.current.weeks;
    const p = getWeeks()
      .then((data) => {
        const list = data?.length ? data : [1];
        setWeeks(list);
        return list;
      })
      .finally(() => (pending.current.weeks = null));
    pending.current.weeks = p;
    return p;
  }, [weeks]);

  const invalidate = useCallback((kind, week) => {
    const setters = {
      cards: setCards,
      tests: setTests,
      infographics: setInfographics,
      presentations: setPresentations,
    };
    const setter = setters[kind];
    if (!setter) return;
    if (week === undefined) {
      setter({});
    } else {
      setter((prev) => {
        const next = { ...prev };
        delete next[week];
        return next;
      });
    }
  }, []);

  const invalidateWeeks = useCallback(() => setWeeks(null), []);

  const value = {
    cards,
    tests,
    infographics,
    presentations,
    weeks,
    ensureCards,
    ensureTests,
    ensureInfographics,
    ensurePresentations,
    ensureWeeks,
    invalidate,
    invalidateWeeks,
  };

  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>;
};

export const useContent = () => {
  const ctx = useContext(ContentContext);
  if (!ctx) throw new Error("useContent must be used within ContentProvider");
  return ctx;
};
