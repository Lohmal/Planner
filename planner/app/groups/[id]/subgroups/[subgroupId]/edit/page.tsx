"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { subgroupSchema, SubgroupForm } from "@/types/validators";
import { API_ENDPOINTS, ROUTES } from "@/types/constants";
import { useAuth } from "@/lib/authContext";
import Link from "next/link";
import { Trash2, AlertTriangle } from "lucide-react";

export default function EditSubgroupPage() {
  const router = useRouter();
  const params = useParams();

  // Parse params properly
  const groupId = (Array.isArray(params.id) ? params.id[0] : params.id) as string;
  const subgroupId = (Array.isArray(params.subgroupId) ? params.subgroupId[0] : params.subgroupId) as string;

  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [groupName, setGroupName] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SubgroupForm>({
    resolver: zodResolver(subgroupSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  // Load subgroup data
  useEffect(() => {
    async function loadSubgroup() {
      if (!groupId || !subgroupId || !user) return;

      try {
        setIsLoading(true);
        setError(null);

        // Fetch group details first for the group name
        const groupResponse = await fetch(API_ENDPOINTS.GROUP_DETAIL(groupId));
        if (groupResponse.ok) {
          const groupData = await groupResponse.json();
          if (groupData.success && groupData.data) {
            setGroupName(groupData.data.name);
          }
        }

        // Fetch subgroup details
        const response = await fetch(`/api/subgroups/${subgroupId}`);

        if (!response.ok) {
          throw new Error("Alt grup bilgileri yüklenirken bir hata oluştu");
        }

        const data = await response.json();

        if (!data.success || !data.data) {
          throw new Error(data.message || "Alt grup bulunamadı");
        }

        const subgroupData = data.data;

        // Set form values
        reset({
          name: subgroupData.name,
          description: subgroupData.description || "",
        });
      } catch (error) {
        console.error("Alt grup yüklenirken hata:", error);
        setError(error instanceof Error ? error.message : "Alt grup yüklenirken bir hata oluştu");
      } finally {
        setIsLoading(false);
      }
    }

    loadSubgroup();
  }, [groupId, subgroupId, user, reset]);

  // Update subgroup info
  const onSubmit = async (data: SubgroupForm) => {
    if (!user) {
      setError("Oturum açmanız gerekiyor");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`/api/subgroups/${subgroupId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || "Alt grup güncellenirken bir hata oluştu");
      }

      setSuccessMessage("Alt grup bilgileri başarıyla güncellendi");

      // Reset form with new values to avoid stale data
      reset({
        name: data.name,
        description: data.description,
      });
    } catch (error) {
      console.error("Alt grup güncellenirken hata:", error);
      setError(error instanceof Error ? error.message : "Alt grup güncellenirken bir hata oluştu");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete subgroup
  const handleDeleteSubgroup = async () => {
    if (!user) {
      setError("Oturum açmanız gerekiyor");
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/subgroups/${subgroupId}`, {
        method: "DELETE",
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || "Alt grup silinirken bir hata oluştu");
      }

      // Navigate back to the subgroups list page
      router.push(`/groups/${groupId}/subgroups`);
      router.refresh();
    } catch (error) {
      console.error("Alt grup silinirken hata:", error);
      setError(error instanceof Error ? error.message : "Alt grup silinirken bir hata oluştu");
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto text-center py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mx-auto"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mx-auto"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
        <p className="mt-4 text-gray-500 dark:text-gray-400">Alt grup yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Alt Grubu Düzenle</h1>
          {groupName && <p className="text-gray-600 dark:text-gray-300">{groupName} grubu içinde</p>}
        </div>
        <div className="flex gap-2">
          <Link href={`/groups/${groupId}/subgroups/${subgroupId}`} className="btn btn-outline">
            İptal
          </Link>
        </div>
      </div>

      {/* Main content */}
      <div className="space-y-6">
        {/* Error and success messages */}
        {error && (
          <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 dark:bg-red-900/30 dark:text-red-400">
            <p>{error}</p>
          </div>
        )}

        {successMessage && (
          <div className="p-4 bg-green-50 border-l-4 border-green-500 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            <p>{successMessage}</p>
          </div>
        )}

        {/* Subgroup Information Form */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Alt Grup Bilgileri</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                placeholder="Alt grup açıklaması"
                disabled={isSubmitting}
              />
            </div>

            <div className="flex justify-end">
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                {isSubmitting ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
              </button>
            </div>
          </form>
        </div>

        {/* Danger Zone */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border-t-4 border-red-500">
          <h2 className="text-xl font-semibold mb-4 text-red-600 dark:text-red-400 flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Tehlikeli Bölge
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Alt grubu sildiğinizde bu alt gruba bağlı tüm görevler de kalıcı olarak silinecektir. Bu işlem geri
            alınamaz.
          </p>

          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="btn btn-danger flex items-center"
              disabled={isDeleting}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Alt Grubu Sil
            </button>
          ) : (
            <div className="border border-red-300 dark:border-red-700 p-4 rounded-lg bg-red-50 dark:bg-red-900/20">
              <p className="text-red-700 dark:text-red-400 font-medium mb-4">
                Bu alt grubu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz!
              </p>
              <div className="flex space-x-3">
                <button onClick={handleDeleteSubgroup} className="btn btn-danger" disabled={isDeleting}>
                  {isDeleting ? "Siliniyor..." : "Evet, Alt Grubu Sil"}
                </button>
                <button onClick={() => setShowDeleteConfirm(false)} className="btn btn-outline" disabled={isDeleting}>
                  İptal
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
