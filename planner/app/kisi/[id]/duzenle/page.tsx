"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useAuth } from "@/lib/authContext";
import { API_ENDPOINTS } from "@/types/constants";
import { Kisi, ApiResponse } from "@/types";

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

export default function KisiDuzenle({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Store the resolved id in a state to use it safely
  const [kisiId, setKisiId] = useState<string>("");

  // Eğer kullanıcı oturum açmamışsa bu sayfayı gösterme
  if (!user) {
    return null;
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
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

  useEffect(() => {
    // Safely resolve the params object
    const resolveParams = async () => {
      const resolvedParams = await Promise.resolve(params);
      setKisiId(resolvedParams.id);

      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(API_ENDPOINTS.KISI_DETAY(resolvedParams.id));

        if (!response.ok) {
          throw new Error("Kişi bilgileri yüklenirken bir hata oluştu");
        }

        const responseData = await response.json() as ApiResponse<Kisi>;

        if (!responseData.success || !responseData.data) {
          throw new Error(responseData.message || "Kişi bilgileri alınamadı");
        }

        const kisi = responseData.data;

        // Form alanlarını otomatik olarak doldur
        setValue("ad", kisi.ad);
        setValue("soyad", kisi.soyad);
        setValue("email", kisi.email);
        setValue("telefon", kisi.telefon || "");
        setValue("adres", kisi.adres || "");
        setValue("notlar", kisi.notlar || "");

        // reset metodu yerine her alanı tek tek ayarlıyoruz
        // bu sayede form alanları güncellendiğinde hata göstermiyor
      } catch (error) {
        console.error("Kişi yüklenirken hata:", error);
        setError(error instanceof Error ? error.message : "Bir hata oluştu");
      } finally {
        setIsLoading(false);
      }
    };

    resolveParams();
  }, [params, setValue]);

  async function onSubmit(data: KisiForm) {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(API_ENDPOINTS.KISI_DETAY(kisiId), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json() as ApiResponse<Kisi>;

      if (!response.ok || !responseData.success) {
        throw new Error(responseData.message || "Bir şeyler yanlış gitti");
      }

      router.push(`/kisi/${kisiId}`);
      router.refresh();
    } catch (error) {
      console.error("Kişi güncellenirken hata:", error);
      setError(error instanceof Error ? error.message : "Kişi güncellenirken bir hata oluştu");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function deleteKisi() {
    if (!confirm("Bu kişiyi silmek istediğinizden emin misiniz?")) {
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(API_ENDPOINTS.KISI_DETAY(kisiId), {
        method: "DELETE",
      });

      const responseData = await response.json() as ApiResponse<null>;

      if (!response.ok || !responseData.success) {
        throw new Error(responseData.message || "Bir şeyler yanlış gitti");
      }

      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Kişi silinirken hata:", error);
      setError(error instanceof Error ? error.message : "Kişi silinirken bir hata oluştu");
    } finally {
      setIsDeleting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md text-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="rounded-full bg-gray-200 dark:bg-gray-700 h-16 w-16 mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-6"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-full mb-4"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-full mb-4"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-full mb-4"></div>
        </div>
        <p className="mt-4">Kişi bilgileri yükleniyor...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md text-center">
        <div className="text-red-500 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-xl font-bold">Hata</h2>
        </div>
        <p className="mb-6">{error}</p>
        <div className="flex justify-center">
          <Link href="/" className="btn bg-gray-500 hover:bg-gray-600 text-white">
            Ana Sayfaya Dön
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Kişiyi Düzenle</h1>
        <div className="flex gap-2">
          <Link href={`/kisi/${kisiId}`} className="text-blue-600 hover:underline">
            Geri Dön
          </Link>
          <button
            onClick={deleteKisi}
            className="text-red-600 hover:underline"
            disabled={isDeleting}
          >
            {isDeleting ? "Siliniyor..." : "Sil"}
          </button>
        </div>
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
          <Link
            href={`/kisi/${kisiId}`}
            className="px-4 py-2 border border-gray-300 rounded-md"
          >
            İptal
          </Link>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </div>
      </form>
    </div>
  );
}
