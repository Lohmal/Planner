"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/authContext";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { User } from "lucide-react";
import { API_ENDPOINTS } from "@/types/constants";

// Profile form validation schema
const profileSchema = z
  .object({
    username: z.string().min(3, "Kullanıcı adı en az 3 karakter olmalıdır"),
    email: z.string().email("Geçerli bir e-posta adresi giriniz"),
    full_name: z.string().optional(),
    current_password: z.string().optional(),
    new_password: z.string().optional(),
    confirm_password: z.string().optional(),
  })
  .refine(
    (data) => {
      // If any password field is filled, all password fields must be filled
      const hasCurrentPassword = !!data.current_password;
      const hasNewPassword = !!data.new_password;
      const hasConfirmPassword = !!data.confirm_password;

      if (hasCurrentPassword || hasNewPassword || hasConfirmPassword) {
        return hasCurrentPassword && hasNewPassword && hasConfirmPassword;
      }

      return true;
    },
    {
      message: "Şifrenizi değiştirmek için mevcut şifrenizi ve yeni şifrenizi girmelisiniz",
      path: ["current_password"],
    }
  )
  .refine(
    (data) => {
      // If new_password is provided, it must be at least 6 characters
      if (data.new_password) {
        return data.new_password.length >= 6;
      }
      return true;
    },
    {
      message: "Yeni şifre en az 6 karakter olmalıdır",
      path: ["new_password"],
    }
  )
  .refine(
    (data) => {
      // If both new_password and confirm_password are provided, they must match
      if (data.new_password && data.confirm_password) {
        return data.new_password === data.confirm_password;
      }
      return true;
    },
    {
      message: "Şifreler eşleşmiyor",
      path: ["confirm_password"],
    }
  );

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user, refreshUser, logout } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [userStats, setUserStats] = useState<{
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    inProgressTasks: number;
    groups: number;
  } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: user?.username || "",
      email: user?.email || "",
      full_name: user?.full_name || "",
      current_password: "",
      new_password: "",
      confirm_password: "",
    },
  });

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }

    // Reset form with user data
    reset({
      username: user.username,
      email: user.email,
      full_name: user.full_name || "",
    });

    // Fetch user statistics
    async function fetchUserStats() {
      try {
        const response = await fetch(`${API_ENDPOINTS.USERS}/stats`);
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setUserStats(data.data);
          }
        }
      } catch (error) {
        console.error("Error fetching user stats:", error);
      }
    }

    fetchUserStats();
  }, [user, reset, router]);

  const onSubmit = async (data: ProfileFormData) => {
    if (!user) return;

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const updateData: any = {
        username: data.username,
        full_name: data.full_name,
      };

      // Only include password fields if user is changing password
      if (data.current_password && data.new_password) {
        updateData.current_password = data.current_password;
        updateData.new_password = data.new_password;
      }

      const response = await fetch(`${API_ENDPOINTS.USERS}/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || "Profile güncellenirken bir hata oluştu");
      }

      // Refresh the user data in context
      await refreshUser();

      setSuccessMessage("Profil bilgileriniz başarıyla güncellendi");

      // Clear password fields
      reset({
        ...data,
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      setError(error instanceof Error ? error.message : "Profil güncellenirken bir hata oluştu");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    if (confirm("Çıkış yapmak istediğinizden emin misiniz?")) {
      logout();
      router.push("/login");
    }
  };

  if (!user) {
    return null; // Handle in useEffect
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Profil Sayfası</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User Info Card */}
        <div className="md:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex flex-col items-center mb-4">
              <div className="w-24 h-24 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-3">
                <User className="w-12 h-12 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-xl font-semibold">{user.full_name || user.username}</h2>
              <p className="text-gray-600 dark:text-gray-400">{user.email}</p>
            </div>

            {userStats && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h3 className="font-medium mb-2">İstatistikler</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex justify-between">
                    <span>Toplam Görev:</span>
                    <span className="font-semibold">{userStats.totalTasks}</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Tamamlanan:</span>
                    <span className="font-semibold text-green-600 dark:text-green-400">{userStats.completedTasks}</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Devam Eden:</span>
                    <span className="font-semibold text-blue-600 dark:text-blue-400">{userStats.inProgressTasks}</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Bekleyen:</span>
                    <span className="font-semibold text-yellow-600 dark:text-yellow-400">{userStats.pendingTasks}</span>
                  </li>
                  <li className="flex justify-between border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
                    <span>Gruplar:</span>
                    <span className="font-semibold">{userStats.groups}</span>
                  </li>
                </ul>
              </div>
            )}

            <button
              onClick={handleLogout}
              className="w-full mt-6 py-2 px-4 border border-red-600 dark:border-red-500 text-red-600 dark:text-red-500 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              Çıkış Yap
            </button>
          </div>
        </div>

        {/* Profile Form */}
        <div className="md:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Profil Bilgileriniz</h2>

            {error && (
              <div className="p-4 mb-4 bg-red-50 border-l-4 border-red-500 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                <p>{error}</p>
              </div>
            )}

            {successMessage && (
              <div className="p-4 mb-4 bg-green-50 border-l-4 border-green-500 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                <p>{successMessage}</p>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium mb-1">
                  Kullanıcı Adı *
                </label>
                <input
                  id="username"
                  type="text"
                  className="input w-full"
                  {...register("username")}
                  disabled={isSubmitting}
                />
                {errors.username && <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-1">
                  E-posta *
                </label>
                <input
                  id="email"
                  type="email"
                  className="input w-full"
                  {...register("email")}
                  disabled={true} // Email cannot be changed
                />
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
              </div>

              <div>
                <label htmlFor="full_name" className="block text-sm font-medium mb-1">
                  Ad Soyad
                </label>
                <input
                  id="full_name"
                  type="text"
                  className="input w-full"
                  placeholder="Ad ve soyadınızı girin (isteğe bağlı)"
                  {...register("full_name")}
                  disabled={isSubmitting}
                />
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-6">
                <h3 className="font-semibold mb-4">Şifre Değiştirme</h3>

                <div>
                  <label htmlFor="current_password" className="block text-sm font-medium mb-1">
                    Mevcut Şifre
                  </label>
                  <input
                    id="current_password"
                    type="password"
                    className="input w-full"
                    placeholder="Şifrenizi değiştirmek istiyorsanız mevcut şifrenizi girin"
                    {...register("current_password")}
                    disabled={isSubmitting}
                  />
                  {errors.current_password && (
                    <p className="mt-1 text-sm text-red-600">{errors.current_password.message}</p>
                  )}
                </div>

                <div className="mt-4">
                  <label htmlFor="new_password" className="block text-sm font-medium mb-1">
                    Yeni Şifre
                  </label>
                  <input
                    id="new_password"
                    type="password"
                    className="input w-full"
                    placeholder="Yeni şifrenizi girin"
                    {...register("new_password")}
                    disabled={isSubmitting}
                  />
                  {errors.new_password && <p className="mt-1 text-sm text-red-600">{errors.new_password.message}</p>}
                </div>

                <div className="mt-4">
                  <label htmlFor="confirm_password" className="block text-sm font-medium mb-1">
                    Yeni Şifre Tekrar
                  </label>
                  <input
                    id="confirm_password"
                    type="password"
                    className="input w-full"
                    placeholder="Yeni şifrenizi tekrar girin"
                    {...register("confirm_password")}
                    disabled={isSubmitting}
                  />
                  {errors.confirm_password && (
                    <p className="mt-1 text-sm text-red-600">{errors.confirm_password.message}</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? "Güncelleniyor..." : "Değişiklikleri Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
