"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { subgroupSchema, SubgroupForm } from "@/types/validators";
import { API_ENDPOINTS, ROUTES } from "@/types/constants";
import { useAuth } from "@/lib/authContext";
import Link from "next/link";

export default function CreateSubgroup() {
  const router = useRouter();
  const params = useParams();
  const groupId = (Array.isArray(params.id) ? params.id[0] : params.id) as string;

  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [groupName, setGroupName] = useState<string>("");

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

  // Fetch group data to show the group name
  useEffect(() => {
    async function fetchGroupData() {
      if (!groupId || !user) return;

      try {
        const response = await fetch(API_ENDPOINTS.GROUP_DETAIL(groupId));

        if (!response.ok) {
          throw new Error("Grup bilgileri alınırken bir hata oluştu");
        }

        const data = await response.json();

        if (!data.success || !data.data) {
          throw new Error(data.message || "Grup bulunamadı");
        }

        setGroupName(data.data.name);
      } catch (error) {
        console.error("Grup bilgileri alınırken hata:", error);
        setError(error instanceof Error ? error.message : "Bir hata oluştu");
      }
    }

    fetchGroupData();
  }, [groupId, user]);

  const onSubmit = async (data: SubgroupForm) => {
    if (!user) {
      setError("Oturum açmanız gerekiyor");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const subgroupData = {
        ...data,
        group_id: Number(groupId),
        creator_id: user.id,
      };

      // Use the correct API endpoint for creating subgroups
      const response = await fetch(`/api/groups/${groupId}/subgroups`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(subgroupData),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || "Alt grup oluşturulurken bir hata oluştu");
      }

      // Change the redirect to go to the group detail page instead of subgroups page
      router.push(ROUTES.GROUP_DETAIL(groupId));
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
        <div>
          <h1 className="text-3xl font-bold">Alt Grup Oluştur</h1>
          {groupName && <p className="text-gray-600 dark:text-gray-300">{groupName} grubu içinde</p>}
        </div>
        <Link href={ROUTES.GROUP_DETAIL(groupId)} className="btn btn-outline">
          İptal
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
              placeholder="Alt grup adı"
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
              placeholder="Alt grup açıklaması (isteğe bağlı)"
              disabled={isSubmitting}
            />
          </div>

          <div className="flex justify-end">
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? "Oluşturuluyor..." : "Alt Grup Oluştur"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
