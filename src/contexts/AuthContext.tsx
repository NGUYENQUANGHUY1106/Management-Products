import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { onIdTokenChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../config/firebase";
import { UserProfile } from "../types/user";
import { errorMessage } from "../utils/validation";
type Session = {
  user: User | null;
  admin: boolean;
  profile: UserProfile | null;
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
};
const Context = createContext<Session>({
  user: null,
  admin: false,
  profile: null,
  loading: true,
  error: "",
  refresh: async () => {},
});
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<Omit<Session, "refresh">>({
    user: null,
    admin: false,
    profile: null,
    loading: true,
    error: "",
  });
  const refresh = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) {
      setState({
        user: null,
        admin: false,
        profile: null,
        loading: false,
        error: "",
      });
      return;
    }
    try {
      const token = await user.getIdTokenResult();
      const admin = token.claims.admin === true;
      const snapshot = await getDoc(doc(db, "users", user.uid));
      if (auth.currentUser?.uid !== user.uid) return;
      setState({
        user,
        admin,
        profile: snapshot.exists() ? (snapshot.data() as UserProfile) : null,
        loading: false,
        error: "",
      });
    } catch (e) {
      if (auth.currentUser?.uid === user.uid)
        setState({
          user,
          admin: false,
          profile: null,
          loading: false,
          error: errorMessage(e),
        });
    }
  }, []);
  useEffect(
    () =>
      onIdTokenChanged(auth, () => {
        void refresh();
      }),
    [refresh],
  );
  return (
    <Context.Provider value={{ ...state, refresh }}>
      {children}
    </Context.Provider>
  );
}
export const useAuth = () => useContext(Context);
