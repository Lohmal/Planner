"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { useAuth } from "@/lib/authContext";
import { ROUTES } from "@/types/constants";
import { forgotPasswordSchema } from "@/types/validators"; // bunu aşağıda göstereceğim

type ForgotPasswordForm = {
  email: string;
};

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { resetPassword } = useAuth(); // context içinde tanımlanmalı
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordForm) => {
    setError("");
    setSuccessMessage("");
    setIsLoading(true);

    try {
      const result = await resetPassword(data.email); // Burada API’ye istek atılmalı
      if (result.success) {
        setSuccessMessage("Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.");
      } else {
        setError("E-posta adresi sistemde kayıtlı değil.");
      }
    } catch (err) {
      setError("Bir hata oluştu, lütfen tekrar deneyin.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-full flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight">Şifremi Unuttum</h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          E-posta adresinizi girin, size bir sıfırlama bağlantısı gönderelim.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">{error}</div>}
          {successMessage && <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-md">{successMessage}</div>}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium">
                E-posta Adresi
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  className="input w-full"
                  disabled={isLoading}
                  {...register("email")}
                />
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
              </div>
            </div>

            <div>
              <button type="submit" className="btn btn-primary w-full" disabled={isLoading}>
                {isLoading ? "Gönderiliyor..." : "Şifre Sıfırlama Linki Gönder"}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <Link href={ROUTES.LOGIN} className="text-blue-600 hover:text-blue-500 text-sm">
              Giriş sayfasına dön
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
