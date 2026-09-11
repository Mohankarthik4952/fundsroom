import { createContext, useContext, useEffect, useMemo, useState } from "react";

type User = {
  id: string;
  email: string;
  name: string;
  role: string;
};

type AuthContextValue = {
  user: User | null;
  token: string | null;
  login: (payload: { token: string; user: User }) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("mini-erp-user");
    const savedToken = localStorage.getItem("mini-erp-token");
    if (saved && savedToken) {
      setUser(JSON.parse(saved));
      setToken(savedToken);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      login: (payload) => {
        setUser(payload.user);
        setToken(payload.token);
        localStorage.setItem("mini-erp-user", JSON.stringify(payload.user));
        localStorage.setItem("mini-erp-token", payload.token);
      },
      logout: () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem("mini-erp-user");
        localStorage.removeItem("mini-erp-token");
      },
    }),
    [token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
