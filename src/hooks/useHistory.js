import { useState } from 'react';

const HISTORY_KEY = 'h2o.history';
const HISTORY_LIMIT = 10;

function sameHistoryEntry(a, b) {
  const aData = { ...a };
  const bData = { ...b };
  delete aData.timestamp;
  delete bData.timestamp;
  return JSON.stringify(aData) === JSON.stringify(bData);
}

export function useHistory(storageKey = HISTORY_KEY, limit = HISTORY_LIMIT) {
  const [history, setHistoryState] = useState(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      const data = raw ? JSON.parse(raw) : [];
      return Array.isArray(data) ? data : [];
    } catch (error) {
      void error;
      return [];
    }
  });

  const addToHistory = (entry) => {
    setHistoryState((prev) => {
      const filtered = prev.filter((e) => !sameHistoryEntry(e, entry));
      const updated = [entry, ...filtered].slice(0, limit);
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch (error) {
        void error;
      }
      return updated;
    });
  };

  const clearHistory = () => {
    setHistoryState([]);
    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      void error;
    }
  };

  return {
    history,
    addToHistory,
    clearHistory,
  };
}
