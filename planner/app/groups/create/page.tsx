"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { groupSchema, GroupForm } from "@/types/validators";
import { API_ENDPOINTS, ROUTES } from "@/types/constants";
import { useAuth } from "@/lib/authContext";
import Link from "next/link";

export default function CreateGroup() {
  const router = useRouter();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [membersCanCreateTasks, setMembersCanCreateTasks] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<GroupForm>({
    resolver: zodResolver(groupSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const onSubmit = async (data: GroupForm) => {
    if (!user) {
      setError("Oturum açmanız gerekiyor");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(API_ENDPOINTS.GROUPS, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          creator_id: user.id,
          members_can_create_tasks: membersCanCreateTasks,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || "Grup oluşturulurken bir hata oluştu");
      }

      router.push(ROUTES.DASHBOARD);
      router.refresh();
    } catch (error) {
      console.error("Grup oluşturulurken hata:", error);
      setError(error instanceof Error ? error.message : "Grup oluşturulurken bir hata oluştu");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Yeni Grup Oluştur</h1>
        <Link href={ROUTES.GROUPS} className="text-blue-600 hover:underline flex items-center gap-1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Gruplara Dön
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
              Grup Adı *
            </label>
            <input
              id="name"
              {...register("name")}
              className="input w-full"
              placeholder="Grup adı"
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
              placeholder="Grup hakkında açıklama (isteğe bağlı)"
              disabled={isSubmitting}
            />
          </div>

          <div className="flex items-center">
            <input
              id="members_can_create_tasks"
              type="checkbox"
              className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              checked={membersCanCreateTasks}
              onChange={(e) => setMembersCanCreateTasks(e.target.checked)}
              disabled={isSubmitting}
            />
            <label htmlFor="members_can_create_tasks" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
              Üyelerin görev oluşturmasına izin ver
            </label>
            <div className="ml-2 text-gray-500 dark:text-gray-400">
              <span title="Bu seçenek işaretlenmezse, sadece grup yöneticileri görev oluşturabilir.">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Link
              href={ROUTES.GROUPS}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              İptal
            </Link>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? "Oluşturuluyor..." : "Grup Oluştur"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
