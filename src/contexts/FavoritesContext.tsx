import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { db } from "../config/firebase";
import { favoritesKey, parseFavorites, toggleFavorite } from "../utils/favorites";
import { useAuth } from "./AuthContext";

type Favorites = { ids: string[]; ready: boolean; saving: boolean; error: string; toggle: (id: string) => Promise<void>; retry: () => void };
const Context = createContext<Favorites | null>(null);
type Snapshot = { key: string; ids: string[] };

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const key = user ? favoritesKey(db.app.options.projectId || "management-product-e97a1", user.uid) : "";
  const activeKey = useRef(key);
  const alive = useRef(true);
  const locks = useRef(new Set<string>());
  const current = useRef<Snapshot>({ key: "", ids: [] });
  const [snapshot, setSnapshot] = useState<Snapshot>({ key: "", ids: [] });
  const [savingKey, setSavingKey] = useState("");
  const [failure, setFailure] = useState({ key: "", message: "" });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  useEffect(() => {
    let cancelled = false;
    activeKey.current = key;
    if (!key) return;
    AsyncStorage.getItem(key).then(raw => {
      if (cancelled) return;
      const next = { key, ids: parseFavorites(raw) };
      current.current = next; setSnapshot(next); setFailure({ key, message: "" });
    }).catch(() => {
      if (!cancelled) setFailure({ key, message: "Không tải được danh sách yêu thích trên thiết bị. Hãy thử lại." });
    });
    return () => { cancelled = true; activeKey.current = ""; };
  }, [key, attempt]);
  const toggle = useCallback(async (id: string) => {
    if (!key || activeKey.current !== key || current.current.key !== key || locks.current.has(key)) return;
    locks.current.add(key); setSavingKey(key); setFailure({ key, message: "" });
    const next = { key, ids: toggleFavorite(current.current.ids, id) };
    try {
      await AsyncStorage.setItem(key, JSON.stringify(next.ids));
      if (alive.current && activeKey.current === key) { current.current = next; setSnapshot(next); }
    } catch {
      if (alive.current && activeKey.current === key) setFailure({ key, message: "Không lưu được yêu thích trên thiết bị. Hãy thử lại." });
    } finally {
      locks.current.delete(key);
      if (alive.current && activeKey.current === key) setSavingKey("");
    }
  }, [key]);
  const ready = !!key && snapshot.key === key;
  const retry = useCallback(() => { if (!locks.current.has(key)) setAttempt(value => value + 1); }, [key]);
  return <Context.Provider value={{ ids: ready ? snapshot.ids : [], ready, saving: savingKey === key, error: failure.key === key ? failure.message : "", toggle, retry }}>{children}</Context.Provider>;
}

export function useFavorites() {
  const value = useContext(Context);
  if (!value) throw new Error("FavoritesProvider is required");
  return value;
}
