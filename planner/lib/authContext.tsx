"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { User } from "@/types";
import { API_ENDPOINTS, ROUTES } from "@/types/constants";

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (data: { username: string; email: string; password: string; fullName?: string }) => Promise<boolean>;
  logout: () => void;
  refreshUser: () => Promise<void>; // Add this method
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Sayfa yüklendiğinde oturum durumunu kontrol et
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // API'den mevcut kullanıcı bilgisini kontrol et
        const response = await fetch(API_ENDPOINTS.CURRENT_USER);

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setUser(data.data);
          } else {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Kimlik doğrulama kontrolü sırasında hata:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Oturum durumuna göre sayfa yönlendirmelerini yönet
  useEffect(() => {
    if (!loading) {
      // Genel erişim sayfaları (bu sayfalara hem giriş yapmış hem de yapmamış kullanıcılar erişebilir)
      const publicRoutes = [ROUTES.LOGIN, ROUTES.REGISTER];

      // Kullanıcı oturum açmamışsa ve korumalı bir sayfadaysa login sayfasına yönlendir
      if (!user && !publicRoutes.includes(pathname)) {
        router.push(ROUTES.LOGIN);
      }

      // Kullanıcı oturum açmışsa ve login/register sayfasındaysa ana sayfaya yönlendir
      if (user && publicRoutes.includes(pathname)) {
        router.push(ROUTES.DASHBOARD);
      }
    }
  }, [user, loading, pathname, router]);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(API_ENDPOINTS.LOGIN, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success && data.data) {
        setUser(data.data);
        return true;
      }

      return false;
    } catch (error) {
      console.error("Giriş sırasında hata:", error);
      return false;
    }
  };

  const register = async (data: { username: string; email: string; password: string; fullName?: string }) => {
    try {
      const response = await fetch(API_ENDPOINTS.REGISTER, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (response.ok && responseData.success) {
        return true;
      }

      return false;
    } catch (error) {
      console.error("Kayıt sırasında hata:", error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await fetch(API_ENDPOINTS.LOGOUT, {
        method: "POST",
      });
    } catch (error) {
      console.error("Çıkış sırasında hata:", error);
    } finally {
      setUser(null);
      router.push(ROUTES.LOGIN);
    }
  };

  // Add the refreshUser implementation
  const refreshUser = async () => {
    if (!user) return;

    try {
      const response = await fetch("/api/users/profile");
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setUser(data.data);
        }
      }
    } catch (error) {
      console.error("Error refreshing user data:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
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
