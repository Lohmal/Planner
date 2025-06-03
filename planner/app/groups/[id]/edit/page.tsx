"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { groupSchema, GroupForm } from "@/types/validators";
import { API_ENDPOINTS, ROUTES } from "@/types/constants";
import { useAuth } from "@/lib/authContext";
import Link from "next/link";
import { Trash2, FolderPlus, AlertTriangle } from "lucide-react";

export default function EditGroupPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = (Array.isArray(params.id) ? params.id[0] : params.id) as string;

  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [subgroups, setSubgroups] = useState<any[]>([]);
  const [membersCanCreateTasks, setMembersCanCreateTasks] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<GroupForm>({
    resolver: zodResolver(groupSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  // Load group data
  useEffect(() => {
    async function loadGroup() {
      if (!groupId || !user) return;

      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(API_ENDPOINTS.GROUP_DETAIL(groupId));

        if (!response.ok) {
          throw new Error("Grup bilgileri yüklenirken bir hata oluştu");
        }

        const data = await response.json();

        if (!data.success || !data.data) {
          throw new Error(data.message || "Grup bulunamadı");
        }

        const groupData = data.data;

        // Set form values
        reset({
          name: groupData.name,
          description: groupData.description || "",
        });

        // Set the members_can_create_tasks state
        setMembersCanCreateTasks(!!groupData.members_can_create_tasks);

        // Load subgroups
        await loadSubgroups();
      } catch (error) {
        console.error("Grup yüklenirken hata:", error);
        setError(error instanceof Error ? error.message : "Grup yüklenirken bir hata oluştu");
      } finally {
        setIsLoading(false);
      }
    }

    loadGroup();
  }, [groupId, user, reset]);

  // Load subgroups
  async function loadSubgroups() {
    try {
      const response = await fetch(`${API_ENDPOINTS.GROUP_DETAIL(groupId)}/subgroups`);

      if (!response.ok) {
        throw new Error("Alt gruplar yüklenemedi");
      }

      const data = await response.json();

      if (data.success && data.data) {
        setSubgroups(data.data);
      }
    } catch (error) {
      console.error("Alt gruplar yüklenirken hata:", error);
    }
  }

  // Update group info
  const onSubmit = async (data: GroupForm) => {
    if (!user) {
      setError("Oturum açmanız gerekiyor");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(API_ENDPOINTS.GROUP_DETAIL(groupId), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          members_can_create_tasks: membersCanCreateTasks,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || "Grup güncellenirken bir hata oluştu");
      }

      setSuccessMessage("Grup bilgileri başarıyla güncellendi");

      // Reset form with new values to avoid stale data
      reset({
        name: data.name,
        description: data.description,
      });
    } catch (error) {
      console.error("Grup güncellenirken hata:", error);
      setError(error instanceof Error ? error.message : "Grup güncellenirken bir hata oluştu");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete group
  const handleDeleteGroup = async () => {
    if (!user) {
      setError("Oturum açmanız gerekiyor");
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(API_ENDPOINTS.GROUP_DETAIL(groupId), {
        method: "DELETE",
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || "Grup silinirken bir hata oluştu");
      }

      router.push(ROUTES.GROUPS);
      router.refresh();
    } catch (error) {
      console.error("Grup silinirken hata:", error);
      setError(error instanceof Error ? error.message : "Grup silinirken bir hata oluştu");
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
        <p className="mt-4 text-gray-500 dark:text-gray-400">Grup yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Grubu Düzenle</h1>
        <Link href={ROUTES.GROUP_DETAIL(groupId)} className="btn btn-outline">
          İptal
        </Link>
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

        {/* Group Information Form */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Grup Bilgileri</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                placeholder="Grup açıklaması"
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

            <div className="flex justify-end">
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                {isSubmitting ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
              </button>
            </div>
          </form>
        </div>

        {/* Subgroups Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Alt Gruplar</h2>
            <Link href={`/groups/${groupId}/subgroups/create`} className="btn btn-sm btn-primary flex items-center">
              <FolderPlus className="h-4 w-4 mr-2" />
              Alt Grup Ekle
            </Link>
          </div>

          {subgroups.length === 0 ? (
            <div className="py-4 text-center text-gray-500 dark:text-gray-400">
              Bu grupta henüz alt grup bulunmuyor.
            </div>
          ) : (
            <div className="space-y-2">
              {subgroups.map((subgroup) => (
                <div
                  key={subgroup.id}
                  className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg flex justify-between items-center"
                >
                  <div>
                    <h3 className="font-medium">{subgroup.name}</h3>
                    {subgroup.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">{subgroup.description}</p>
                    )}
                  </div>
                  <Link
                    href={`/groups/${groupId}/subgroups/${subgroup.id}`}
                    className="text-blue-600 hover:underline text-sm"
                  >
                    Görüntüle
                  </Link>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4">
            <Link
              href={`/groups/${groupId}/subgroups`}
              className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
            >
              Tüm Alt Grupları Yönet
            </Link>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border-t-4 border-red-500">
          <h2 className="text-xl font-semibold mb-4 text-red-600 dark:text-red-400 flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Tehlikeli Bölge
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Grubu sildiğinizde tüm alt gruplar, görevler ve üyelik bilgileri de kalıcı olarak silinecektir. Bu işlem
            geri alınamaz.
          </p>

          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="btn btn-danger flex items-center"
              disabled={isDeleting}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Grubu Sil
            </button>
          ) : (
            <div className="border border-red-300 dark:border-red-700 p-4 rounded-lg bg-red-50 dark:bg-red-900/20">
              <p className="text-red-700 dark:text-red-400 font-medium mb-4">
                Bu grubu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz!
              </p>
              <div className="flex space-x-3">
                <button onClick={handleDeleteGroup} className="btn btn-danger" disabled={isDeleting}>
                  {isDeleting ? "Siliniyor..." : "Evet, Grubu Sil"}
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
