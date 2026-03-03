import { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Optimistically load from localStorage — avoids blank-screen on hard refresh
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("ll_user");
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });

  // authReady = true once Firebase has confirmed or denied the session.
  // PrivateRoute uses this to decide whether to redirect.
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // Firebase confirmed a session — re-sync from localStorage (source of truth for role/name)
        const stored = localStorage.getItem("ll_user");
        if (stored) {
          setUser(JSON.parse(stored));
        } else {
          // localStorage was cleared; keep minimal info
          setUser({ email: firebaseUser.email, uid: firebaseUser.uid });
        }
      } else {
        // No active Firebase session — clear everything
        setUser(null);
        localStorage.removeItem("ll_user");
      }
      setAuthReady(true); // signal that PrivateRoute can now make routing decisions
    });
    return unsubscribe;
  }, []);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem("ll_user", JSON.stringify(userData));
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    localStorage.removeItem("ll_user");
  };

  return (
    // Always render children — PrivateRoute shows its own spinner if authReady is false
    <AuthContext.Provider value={{ user, role: user?.role ?? null, login, logout, authReady }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
