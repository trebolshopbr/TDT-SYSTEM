"use client";
import { useCallback, useMemo, useSyncExternalStore } from "react";
import { readDrafts, type Draft } from "../_lib/drafts";

export function useDrafts(userId: string) {
  const key = `global:catalogo:rascunhos:v1:${userId}`;
  const subscribe = useCallback((notify: () => void) => {
    window.addEventListener("storage", notify);
    window.addEventListener("catalog-draft", notify);
    return () => { window.removeEventListener("storage", notify); window.removeEventListener("catalog-draft", notify); };
  }, []);
  const snapshot = useCallback(() => {
    try { return localStorage.getItem(key) ?? "{}"; } catch { return "{}"; }
  }, [key]);
  const raw = useSyncExternalStore(subscribe, snapshot, () => "{}");
  const loaded = useSyncExternalStore(subscribe, () => true, () => false);
  const drafts = useMemo(() => readDrafts(raw), [raw]);
  const save = (id: string, draft: Draft) => {
    const current = readDrafts(localStorage.getItem(key) ?? "{}");
    localStorage.setItem(key, JSON.stringify({ ...current, [id]: draft }));
    window.dispatchEvent(new Event("catalog-draft"));
  };
  return { drafts, loaded, save };
}
