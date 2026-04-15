import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from "react";
import type { AppRole, User } from "@/lib/types";
import { authApi, getAuthToken, removeAuthToken, setAuthToken } from "@/lib/api";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (input: {
    name: string;
    email: string;
    role: "admin" | "doctor" | "patient";
    password: string;
    passwordConfirmation: string;
  }) => Promise<{ error: Error | null; message?: string }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type BackendUser = {
  id: number;
  name: string;
  email: string | null;
  role?: string | null;
};

const normalizeRole = (role?: string | null): AppRole | null => {
  if (!role) return null;
  if (role === "admin" || role === "doctor" || role === "patient" || role === "user") {
    return role;
  }
  return null;
};

const toUser = (user: BackendUser): User => {
  const role = normalizeRole(user.role);
  return {
    id: String(user.id),
    email: user.email ?? "",
    role,
    profile: {
      id: String(user.id),
      user_id: String(user.id),
      display_name: user.name,
      avatar_url: null,
      email: user.email ?? null,
      phone: null,
      address: null,
      specialty: null,
      license_number: null,
      department: null,
      preferences: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  };
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async (): Promise<User | null> => {
    try {
      const token = getAuthToken();
      if (!token) return null;

      const profile = await authApi.getUser();
      return toUser(profile);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("fetchUser error:", err);
      removeAuthToken();
      return null;
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const userData = await fetchUser();
    setUser(userData);
  }, [fetchUser]);

  // Initialize auth on mount
  useEffect(() => {
    const initAuth = async () => {
      const userData = await fetchUser();
      setUser(userData);
      setLoading(false);
    };

    initAuth();
  }, [fetchUser]);

  const signIn = async (email: string, password: string) => {
    try {
      const response = await authApi.login(email, password);
      if (!response?.token || !response.user) {
        return { error: new Error("Login failed. Please try again.") };
      }
      setAuthToken(response.token);
      setUser(toUser(response.user));
      return { error: null };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Sign in exception:", error);
      return { error: error as Error };
    }
  };

  const signUp = async (input: {
    name: string;
    email: string;
    role: "admin" | "doctor" | "patient";
    password: string;
    passwordConfirmation: string;
  }) => {
    try {
      const response = await authApi.signupWithRole(
        input.name.trim(),
        input.email.trim(),
        input.role,
        input.password,
        input.passwordConfirmation,
      );
      if (!response?.token || !response.user) {
        return { error: new Error("Signup failed. Please try again.") };
      }
      setAuthToken(response.token);
      setUser(toUser(response.user));
      return {
        error: null,
        message: response.message || "Account created successfully!",
      };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Signup exception:", error);
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore logout errors
    }
    removeAuthToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signOut,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
