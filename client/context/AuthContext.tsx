import React, { createContext, useContext, useState, useEffect } from "react";
import { User, UserRole } from "../types";
import { API_BASE_URL } from "../services/apiConfig";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string, role: UserRole) => Promise<void>;
  register: (name: string, email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("rip_user");

    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error("Invalid JSON in localStorage:", storedUser);
        console.log(error);
        localStorage.removeItem("rip_user");
      }
    }

    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string, role: UserRole) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password, role }),
    });
    const data = await response.json();

    if (response.ok) {
      const userData: User = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role,
      };
      setUser(userData);
      localStorage.setItem("rip_user", JSON.stringify(userData));
      if (data.token) {
        localStorage.setItem("rip_token", data.token);
      }
    } else {
      throw new Error(data.message || "Login failed");
    }
  };

  const register = async (name: string, email: string, password: string, role: UserRole) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, email, password, role }),
    });
    const data = await response.json();

    if (response.ok) {
      const userData: User = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role,
      };
      setUser(userData);
      localStorage.setItem("rip_user", JSON.stringify(userData));
      if (data.token) {
        localStorage.setItem("rip_token", data.token);
      }
    } else {
      throw new Error(data.message || "Registration failed");
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("rip_user");
    localStorage.removeItem("rip_token");
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
