"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { authMe, type AuthUser } from "@/lib/api";

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
  isRecruiter: boolean;
  isCandidate: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  loading: true,
  login: () => {},
  logout: () => {},
  isRecruiter: false,
  isCandidate: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("auth_token");
    if (saved) {
      setToken(saved);
      authMe(saved)
        .then(setUser)
        .catch(() => {
          localStorage.removeItem("auth_token");
          setToken(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback((newToken: string, newUser: AuthUser) => {
    localStorage.setItem("auth_token", newToken);
    setToken(newToken);
    setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("auth_token");
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        isRecruiter: user?.role === "recruiter",
        isCandidate: user?.role === "candidate",
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
