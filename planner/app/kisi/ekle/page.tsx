"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useAuth } from "@/lib/authContext";

// Form doğrulama şeması
const kisiSchema = z.object({
  ad: z.string().min(2, "Ad en az 2 karakter olmalıdır"),
  soyad: z.string().min(2, "Soyad en az 2 karakter olmalıdır"),
  email: z.string().email("Geçerli bir e-posta adresi giriniz"),
  telefon: z.string().optional(),
  adres: z.string().optional(),
  notlar: z.string().optional(),
});

type KisiForm = z.infer<typeof kisiSchema>;

export default function KisiEkle() {
  const router = useRouter();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Eğer kullanıcı oturum açmamışsa bu sayfayı gösterme
  if (!user) {
    return null;
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<KisiForm>({
    resolver: zodResolver(kisiSchema),
    defaultValues: {
      ad: "",
      soyad: "",
      email: "",
      telefon: "",
      adres: "",
      notlar: "",
    },
  });

  async function onSubmit(data: KisiForm) {
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/kisiler", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        router.push("/");
        router.refresh();
      } else {
        const error = await response.json();
        alert(`Hata: ${error.message || "Bir şeyler yanlış gitti"}`);
      }
    } catch (error) {
      console.error("Kişi eklenirken hata oluştu:", error);
      alert("Kişi eklenirken bir hata oluştu");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Yeni Kişi Ekle</h1>
        <Link href="/" className="text-blue-600 hover:underline flex items-center gap-1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
          </svg>
          Listeye Dön
        </Link>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="ad" className="block mb-2 font-medium">
              Ad *
            </label>
            <input id="ad" {...register("ad")} className="input w-full" disabled={isSubmitting} />
            {errors.ad && <p className="mt-1 text-red-500">{errors.ad.message}</p>}
          </div>

          <div>
            <label htmlFor="soyad" className="block mb-2 font-medium">
              Soyad *
            </label>
            <input id="soyad" {...register("soyad")} className="input w-full" disabled={isSubmitting} />
            {errors.soyad && <p className="mt-1 text-red-500">{errors.soyad.message}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block mb-2 font-medium">
            E-posta *
          </label>
          <input id="email" type="email" {...register("email")} className="input w-full" disabled={isSubmitting} />
          {errors.email && <p className="mt-1 text-red-500">{errors.email.message}</p>}
        </div>

        <div>
          <label htmlFor="telefon" className="block mb-2 font-medium">
            Telefon
          </label>
          <input id="telefon" {...register("telefon")} className="input w-full" disabled={isSubmitting} />
        </div>

        <div>
          <label htmlFor="adres" className="block mb-2 font-medium">
            Adres
          </label>
          <textarea id="adres" {...register("adres")} className="input w-full" rows={3} disabled={isSubmitting} />
        </div>

        <div>
          <label htmlFor="notlar" className="block mb-2 font-medium">
            Notlar
          </label>
          <textarea id="notlar" {...register("notlar")} className="input w-full" rows={3} disabled={isSubmitting} />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Link href="/" className="px-4 py-2 border border-gray-300 rounded-md">
            İptal
          </Link>
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </div>
      </form>
    </div>
  );
}
