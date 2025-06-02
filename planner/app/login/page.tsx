"use client";

import { useState} from "react";
import { useAuth } from "@/lib/authContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, LoginForm } from "@/types/validators";
import { ROUTES, APP_CONSTANTS } from "@/types/constants";

export default function Login() {
  const router = useRouter();
  const { login } = useAuth();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginForm) => {
    setError("");
    setIsLoading(true);

    try {
      const success = await login(data.email, data.password);
      if (!success) {
        setError("Geçersiz e-posta veya şifre");
      } else {
        // Başarılı giriş sonrası gösterge sayfasına yönlendir
        router.push(ROUTES.DASHBOARD);
      }
    } catch (error) {
      setError("Giriş yapılırken bir hata oluştu");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-full flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center text-white">
             <Image src="/logo.png" alt="Logo" width={80} height={80} />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight">{APP_CONSTANTS.TITLE}</h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Hesabınıza giriş yaparak gruplarınızı ve görevlerinizi yönetin
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow-lg sm:rounded-lg sm:px-10">
          {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">{error}</div>}

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium">
                E-posta adresi
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
              <label htmlFor="password" className="block text-sm font-medium">
                Şifre
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  className="input w-full"
                  disabled={isLoading}
                  {...register("password")}
                />
                {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
              </div>
            </div>

            <div>
              <button type="submit" className="btn btn-primary w-full" disabled={isLoading}>
                {isLoading ? "Giriş yapılıyor..." : "Giriş Yap"}
              </button>
            </div>
          </form>

          

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Hesabınız yok mu?{" "}
              <Link href={ROUTES.REGISTER} className="text-blue-600 hover:text-blue-500">
                Kayıt ol
              </Link>
            </p>
          </div>
          <div className="mt-3">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
            
              </div>
              <div className="relative flex justify-center text-sm">
                <Link href={ROUTES.FORGOT_PASSWORD} className="text-blue-600 hover:text-blue-500">
                Şifrenizi mi unuttunuz?
              </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
