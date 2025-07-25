import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { auth } from "../services/Backend/Firebase/firebase"; 
import { onAuthStateChanged, User } from "firebase/auth";
import { loginWithEmail, logout } from "../services/Backend/Firebase/auth";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Firebase auth durumunu dinle
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      await loginWithEmail(email, password);
      // onAuthStateChanged user durumunu güncelleyecek
    } catch (error) {
      console.error("Login Error:", error);
      throw new Error("Giriş işlemi sırasında bir hata oluştu.");
    }
  };

  const logoutUser = async () => {
    try {
      await logout();
      setUser(null); // opsiyonel, onAuthStateChanged tetikleniyor zaten
    } catch (error) {
      console.error("Logout Error:", error);
      throw new Error("Çıkış işlemi sırasında bir hata oluştu.");
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout: logoutUser, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};
