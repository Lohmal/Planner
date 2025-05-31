"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { taskSchema, TaskForm } from "@/types/validators";
import { API_ENDPOINTS, ROUTES, TASK_PRIORITY_OPTIONS, TASK_STATUS_OPTIONS } from "@/types/constants";
import { useAuth } from "@/lib/authContext";
import Link from "next/link";
import { Group, User } from "@/types";

export default function CreateTask() {
  const router = useRouter();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [subgroups, setSubgroups] = useState<any[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [selectedSubgroupId, setSelectedSubgroupId] = useState<number | null>(null);
  const [selectedAssignees, setSelectedAssignees] = useState<number[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);
  const [isLoadingSubgroups, setIsLoadingSubgroups] = useState(false);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<TaskForm>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      description: "",
      status: "pending",
      priority: "medium",
      due_date: "",
      group_id: undefined,
      subgroup_id: undefined,
    },
  });

  // İzlenen grup_id değerini al
  const watchedGroupId = watch("group_id");
  const watchedSubgroupId = watch("subgroup_id");

  // Kullanıcının gruplarını yükle
  useEffect(() => {
    async function loadGroups() {
      if (!user) return;

      try {
        setIsLoadingGroups(true);
        const response = await fetch(API_ENDPOINTS.GROUPS);
        if (!response.ok) throw new Error("Gruplar yüklenemedi");

        const data = await response.json();
        if (data.success && data.data) {
          setGroups(data.data);

          // Eğer sadece bir grup varsa, otomatik olarak seç
          if (data.data.length === 1) {
            setValue("group_id", data.data[0].id);
            setSelectedGroupId(data.data[0].id);
          }
        }
      } catch (error) {
        console.error("Gruplar yüklenirken hata:", error);
      } finally {
        setIsLoadingGroups(false);
      }
    }

    loadGroups();
  }, [user, setValue]);

  // Grup değiştiğinde alt grupları yükle
  useEffect(() => {
    async function loadSubgroups() {
      if (!watchedGroupId) {
        setSubgroups([]);
        return;
      }

      try {
        setIsLoadingSubgroups(true);
        setSelectedGroupId(Number(watchedGroupId));
        setValue("subgroup_id", undefined); // Alt grup seçimini sıfırla

        const response = await fetch(`${API_ENDPOINTS.GROUP_DETAIL(watchedGroupId)}/subgroups`);
        if (!response.ok) throw new Error("Alt gruplar yüklenemedi");

        const data = await response.json();
        if (data.success && data.data) {
          setSubgroups(data.data);
        }
      } catch (error) {
        console.error("Alt gruplar yüklenirken hata:", error);
      } finally {
        setIsLoadingSubgroups(false);
      }
    }

    if (watchedGroupId) {
      loadSubgroups();
    }
  }, [watchedGroupId, setValue]);

  // Grup değiştiğinde grup üyelerini yükle
  useEffect(() => {
    async function loadGroupMembers() {
      if (!watchedGroupId) {
        setMembers([]);
        return;
      }

      try {
        setIsLoadingMembers(true);

        const response = await fetch(API_ENDPOINTS.GROUP_MEMBERS(watchedGroupId));
        if (!response.ok) throw new Error("Grup üyeleri yüklenemedi");

        const data = await response.json();
        if (data.success && data.data) {
          // Her bir üyeden User objesi oluştur
          const users = data.data.map((member: any) => ({
            id: member.user_id,
            username: member.username,
            email: member.email,
            full_name: member.full_name,
          }));
          setMembers(users);
        }
      } catch (error) {
        console.error("Grup üyeleri yüklenirken hata:", error);
      } finally {
        setIsLoadingMembers(false);
      }
    }

    if (watchedGroupId) {
      loadGroupMembers();
    }
  }, [watchedGroupId]);

  // Alt grup seçildiğinde state'i güncelle
  useEffect(() => {
    if (watchedSubgroupId) {
      setSelectedSubgroupId(Number(watchedSubgroupId));
    } else {
      setSelectedSubgroupId(null);
    }
  }, [watchedSubgroupId]);

  const toggleAssignee = (userId: number) => {
    if (selectedAssignees.includes(userId)) {
      setSelectedAssignees(selectedAssignees.filter((id) => id !== userId));
    } else {
      setSelectedAssignees([...selectedAssignees, userId]);
    }
  };

  const onSubmit = async (data: TaskForm) => {
    if (!user) {
      setError("Oturum açmanız gerekiyor");
      return;
    }

    if (!data.group_id) {
      setError("Lütfen bir grup seçin");
      return;
    }

    if (selectedAssignees.length === 0) {
      setError("Lütfen en az bir kişi atayın");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const taskData = {
        ...data,
        created_by: user.id,
        // Boş string yerine null gönder
        due_date: data.due_date || null,
        subgroup_id: data.subgroup_id || null,
        assigned_users: selectedAssignees,
      };

      const response = await fetch(API_ENDPOINTS.TASKS, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(taskData),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || "Görev oluşturulurken bir hata oluştu");
      }

      router.push(ROUTES.TASKS);
      router.refresh();
    } catch (error) {
      console.error("Görev oluşturulurken hata:", error);
      setError(error instanceof Error ? error.message : "Görev oluşturulurken bir hata oluştu");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Yeni Görev Oluştur</h1>
        <Link href={ROUTES.TASKS} className="text-blue-600 hover:underline flex items-center gap-1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Görevlere Dön
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 dark:bg-red-900/30 dark:text-red-400">
            <p>{error}</p>
          </div>
        )}

        {isLoadingGroups ? (
          <div className="py-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">Gruplar yükleniyor...</p>
          </div>
        ) : groups.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Görev oluşturmak için önce bir gruba üye olmanız gerekiyor.
            </p>
            <Link href={ROUTES.GROUP_CREATE} className="btn btn-primary">
              Grup Oluştur
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium mb-2">
                Görev Başlığı *
              </label>
              <input
                id="title"
                {...register("title")}
                className="input w-full"
                placeholder="Görev başlığı"
                disabled={isSubmitting}
              />
              {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
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
                placeholder="Görev açıklaması (isteğe bağlı)"
                disabled={isSubmitting}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="group_id" className="block text-sm font-medium mb-2">
                  Grup *
                </label>
                <select
                  id="group_id"
                  {...register("group_id", { valueAsNumber: true })}
                  className="input w-full"
                  disabled={isSubmitting || groups.length === 0}
                >
                  <option value="">Grup Seçin</option>
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
                {errors.group_id && <p className="mt-1 text-sm text-red-600">{errors.group_id.message}</p>}
              </div>

              <div>
                <label htmlFor="subgroup_id" className="block text-sm font-medium mb-2">
                  Alt Grup
                </label>
                <select
                  id="subgroup_id"
                  {...register("subgroup_id", { valueAsNumber: true })}
                  className="input w-full"
                  disabled={isSubmitting || isLoadingSubgroups || !selectedGroupId || subgroups.length === 0}
                >
                  <option value="">Alt Grup Seçin (opsiyonel)</option>
                  {subgroups.map((subgroup) => (
                    <option key={subgroup.id} value={subgroup.id}>
                      {subgroup.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="status" className="block text-sm font-medium mb-2">
                  Durum
                </label>
                <select id="status" {...register("status")} className="input w-full" disabled={isSubmitting}>
                  {TASK_STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="priority" className="block text-sm font-medium mb-2">
                  Öncelik
                </label>
                <select id="priority" {...register("priority")} className="input w-full" disabled={isSubmitting}>
                  {TASK_PRIORITY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="due_date" className="block text-sm font-medium mb-2">
                  Son Tarih
                </label>
                <input
                  id="due_date"
                  type="date"
                  {...register("due_date")}
                  className="input w-full"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Atanacak Kişiler *</label>
              {isLoadingMembers ? (
                <div className="py-4 text-center">
                  <p className="text-gray-500 dark:text-gray-400">Üyeler yükleniyor...</p>
                </div>
              ) : members.length === 0 ? (
                <div className="py-4 text-center">
                  <p className="text-gray-500 dark:text-gray-400">Bu grupta üye bulunmamaktadır.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedAssignees.includes(member.id)
                          ? "bg-blue-50 border-blue-300 dark:bg-blue-900/30 dark:border-blue-700"
                          : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                      }`}
                      onClick={() => toggleAssignee(member.id)}
                    >
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedAssignees.includes(member.id)}
                          onChange={() => toggleAssignee(member.id)}
                          className="h-4 w-4 text-blue-600 rounded"
                        />
                        <div className="ml-3">
                          <p className="font-medium">{member.full_name || member.username}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {selectedAssignees.length > 0 && (
                <p className="mt-2 text-sm text-blue-600">{selectedAssignees.length} kişi seçildi</p>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Link
                href={ROUTES.TASKS}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700"
              >
                İptal
              </Link>
              <button type="submit" className="btn btn-primary" disabled={isSubmitting || isLoadingGroups}>
                {isSubmitting ? "Oluşturuluyor..." : "Görev Oluştur"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
