"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useAuth } from "@/lib/authContext";
import { API_ENDPOINTS, ROUTES } from "@/types/constants";

// Form doğrulama şeması
const subgroupSchema = z.object({
  name: z.string().min(3, "Alt grup adı en az 3 karakter olmalıdır"),
  description: z.string().optional(),
});

type SubgroupForm = z.infer<typeof subgroupSchema>;

export default function CreateSubgroup({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [groupId, setGroupId] = useState<string>("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SubgroupForm>({
    resolver: zodResolver(subgroupSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  // Use params directly instead of React.use
  useEffect(() => {
    if (params.id) {
      setGroupId(params.id);
    }
  }, [params.id]);

  const onSubmit = async (data: SubgroupForm) => {
    if (!user) {
      setError("Oturum açmanız gerekiyor");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`${API_ENDPOINTS.GROUP_DETAIL(groupId)}/subgroups`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          group_id: parseInt(groupId),
          creator_id: user.id,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || "Alt grup oluşturulurken bir hata oluştu");
      }

      router.push(`/groups/${groupId}/subgroups`);
      router.refresh();
    } catch (error) {
      console.error("Alt grup oluşturulurken hata:", error);
      setError(error instanceof Error ? error.message : "Alt grup oluşturulurken bir hata oluştu");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Yeni Alt Grup Oluştur</h1>
        <Link href={`/groups/${groupId}/subgroups`} className="text-blue-600 hover:underline flex items-center gap-1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Geri Dön
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 dark:bg-red-900/30 dark:text-red-400">
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-2">
              Alt Grup Adı *
            </label>
            <input
              id="name"
              {...register("name")}
              className="input w-full"
              placeholder="Örn: Frontend Ekibi"
              disabled={isSubmitting}
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-2">
              Açıklama
            </label>
            <textarea
              id="description"
              {...register("description")}
              className="input w-full"
              rows={4}
              placeholder="Alt grup hakkında açıklama (isteğe bağlı)"
              disabled={isSubmitting}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Link
              href={`/groups/${groupId}/subgroups`}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              İptal
            </Link>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? "Oluşturuluyor..." : "Alt Grup Oluştur"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
