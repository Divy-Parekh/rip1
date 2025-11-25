import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check local storage on load
    const storedUser = localStorage.getItem('rip_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    // Simulate API call
    return new Promise<void>((resolve, reject) => {
        setTimeout(() => {
            if (email && password) {
                // Dummy successful login
                const dummyUser: User = {
                    id: 'u_123',
                    name: 'HR Administrator',
                    email: email,
                    token: 'dummy-jwt-token-xyz'
                };
                setUser(dummyUser);
                localStorage.setItem('rip_user', JSON.stringify(dummyUser));
                resolve();
            } else {
                reject(new Error("Invalid credentials"));
            }
        }, 1000);
    });
  };

  const register = async (name: string, email: string, password: string) => {
      // Simulate API call
      return new Promise<void>((resolve) => {
          setTimeout(() => {
            const dummyUser: User = {
                id: `u_${Date.now()}`,
                name: name,
                email: email,
                token: 'dummy-jwt-token-abc'
            };
            setUser(dummyUser);
            localStorage.setItem('rip_user', JSON.stringify(dummyUser));
            resolve();
          }, 1000);
      });
  };

  const logout = () => {
      setUser(null);
      localStorage.removeItem('rip_user');
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
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
