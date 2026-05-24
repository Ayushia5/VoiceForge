/**
 * useSpeechHistory.js
 * Custom hook that manages speech history, favorites, and localStorage persistence.
 * Drop this into src/hooks/useSpeechHistory.js in the VoiceForge project.
 */

import { useState, useEffect, useCallback } from "react";

const HISTORY_KEY = "vf_history";
const FAVS_KEY = "vf_favorites";
const MAX_HISTORY = 25;

/**
 * Safely reads a JSON value from localStorage.
 * Returns `fallback` if the key is missing or the value is unparseable.
 */
function readStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function useSpeechHistory() {
  // ── State ────────────────────────────────────────────────────────────────
  const [history, setHistory] = useState(() => readStorage(HISTORY_KEY, []));
  const [favorites, setFavorites] = useState(
    () => new Set(readStorage(FAVS_KEY, []))
  );

  // ── Persistence ──────────────────────────────────────────────────────────
  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch {
      /* storage quota exceeded — silently skip */
    }
  }, [history]);

  useEffect(() => {
    try {
      localStorage.setItem(FAVS_KEY, JSON.stringify([...favorites]));
    } catch {
      /* storage quota exceeded — silently skip */
    }
  }, [favorites]);

  // ── Actions ──────────────────────────────────────────────────────────────

  /**
   * Adds a message to history.
   * If the exact text already exists, it is moved to the top (deduplicated).
   * Enforces the MAX_HISTORY cap.
   */
  const addMessage = useCallback((text) => {
    if (!text.trim()) return;

    setHistory((prev) => {
      const withoutDup = prev.filter((m) => m.text !== text.trim());
      const newEntry = {
        id: Date.now().toString(),
        text: text.trim(),
        timestamp: Date.now(),
      };
      return [newEntry, ...withoutDup].slice(0, MAX_HISTORY);
    });
  }, []);

  /**
   * Removes a message by id and also removes it from favorites.
   */
  const removeMessage = useCallback((id) => {
    setHistory((prev) => prev.filter((m) => m.id !== id));
    setFavorites((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  /**
   * Pins or unpins a message.
   */
  const toggleFavorite = useCallback((id) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  /**
   * Wipes all history and favorites.
   */
  const clearHistory = useCallback(() => {
    setHistory([]);
    setFavorites(new Set());
  }, []);

  return {
    history,
    favorites,
    addMessage,
    removeMessage,
    toggleFavorite,
    clearHistory,
  };
}