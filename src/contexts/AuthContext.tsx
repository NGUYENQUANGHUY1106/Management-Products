import React, { createContext, useContext, useEffect, useState } from "react";
import { onIdTokenChanged, User } from "firebase/auth";
import { auth } from "../config/firebase";
import { errorMessage } from "../utils/validation";
type Session = { user: User | null; admin: boolean; loading: boolean; error: string };
const Context = createContext<Session>({ user: null, admin: false, loading: true, error: "" });
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<Session>({ user: null, admin: false, loading: true, error: "" });
  useEffect(() => onIdTokenChanged(auth, async user => {
    if (!user) { setState({ user: null, admin: false, loading: false, error: "" }); return; }
    try {
      const token = await user.getIdTokenResult();
      if (auth.currentUser?.uid === user.uid) setState({ user, admin: token.claims.admin === true, loading: false, error: "" });
    } catch (e) {
      if (auth.currentUser?.uid === user.uid) setState({ user, admin: false, loading: false, error: errorMessage(e) });
    }
  }), []);
  return <Context.Provider value={state}>{children}</Context.Provider>;
}
export const useAuth = () => useContext(Context);
