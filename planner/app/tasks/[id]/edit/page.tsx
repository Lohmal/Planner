"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { taskSchema, TaskForm } from "@/types/validators";
import { API_ENDPOINTS, ROUTES, TASK_PRIORITY_OPTIONS, TASK_STATUS_OPTIONS } from "@/types/constants";
import { useAuth } from "@/lib/authContext";
import Link from "next/link";
import { Task, User } from "@/types";

export default function EditTask() {
  const router = useRouter();
  const params = useParams();
  // Add a default value and type assertion to ensure taskId is a string
  const taskId = (Array.isArray(params.id) ? params.id[0] : params.id) as string;
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [task, setTask] = useState<Task | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [selectedAssignees, setSelectedAssignees] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [groupName, setGroupName] = useState<string>("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
    watch,
  } = useForm<TaskForm>({
    resolver: zodResolver(taskSchema),
    defaultValues: async () => {
      // Initialize with empty values first
      return {
        title: "",
        description: "",
        status: "pending",
        priority: "medium",
        due_date: "",
        subgroup_id: null,
        // Don't include group_id here as it's not editable
      };
    },
  });

  // Load task data
  useEffect(() => {
    async function loadTask() {
      if (!taskId || !user) return;

      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(API_ENDPOINTS.TASK_DETAIL(taskId));

        if (!response.ok) {
          throw new Error("Görev yüklenirken bir hata oluştu");
        }

        const data = await response.json();

        if (!data.success || !data.data) {
          throw new Error(data.message || "Görev bulunamadı");
        }

        const taskData = data.data;
        setTask(taskData);

        // Set initial assignees
        if (taskData.assignees && taskData.assignees.length > 0) {
          const assigneeIds = taskData.assignees.map((a: any) => a.user_id);
          setSelectedAssignees(assigneeIds);
        }

        // Set form values
        reset({
          title: taskData.title,
          description: taskData.description || "",
          status: taskData.status,
          priority: taskData.priority,
          due_date: taskData.due_date ? new Date(taskData.due_date).toISOString().split("T")[0] : "",
          subgroup_id: taskData.subgroup_id || null,
          group_id: taskData.group_id, // Include group_id here
        });

        // Also set the related data
        setGroupName(taskData.group_name || "");

        // Load group members
        loadGroupMembers(taskData.group_id);
      } catch (error) {
        console.error("Görev yüklenirken hata:", error);
        setError(error instanceof Error ? error.message : "Görev yüklenirken bir hata oluştu");
      } finally {
        setIsLoading(false);
      }
    }

    loadTask();
  }, [taskId, user, reset]);

  // Load group members
  async function loadGroupMembers(groupId: number) {
    if (!groupId) return;

    try {
      setIsLoadingMembers(true);

      const response = await fetch(API_ENDPOINTS.GROUP_MEMBERS(groupId));

      if (!response.ok) {
        throw new Error("Grup üyeleri yüklenemedi");
      }

      const data = await response.json();

      if (data.success && data.data) {
        // Extract user data from members
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

  const toggleAssignee = (userId: number) => {
    if (selectedAssignees.includes(userId)) {
      setSelectedAssignees(selectedAssignees.filter((id) => id !== userId));
    } else {
      setSelectedAssignees([...selectedAssignees, userId]);
    }
  };

  // Make sure the task assignments are being sent correctly in the update request
  const onSubmit = async (data: TaskForm) => {
    if (!user) {
      setError("Oturum açmanız gerekiyor");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Include assigned users in the update data
      const updateData = {
        ...data,
        assigned_users: selectedAssignees, // Make sure this is included
      };

      console.log("Updating task with data:", updateData); // For debugging

      const response = await fetch(API_ENDPOINTS.TASK_DETAIL(taskId), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || "Görev güncellenirken bir hata oluştu");
      }

      router.push(`/tasks/${taskId}`);
      router.refresh();
    } catch (error) {
      console.error("Görev güncellenirken hata:", error);
      setError(error instanceof Error ? error.message : "Görev güncellenirken bir hata oluştu");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Bu görevi silmek istediğinizden emin misiniz?")) {
      return;
    }

    if (!user || !taskId) {
      setError("Oturum açmanız gerekiyor");
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(API_ENDPOINTS.TASK_DETAIL(taskId), {
        method: "DELETE",
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || "Görev silinirken bir hata oluştu");
      }

      router.push(task?.group_id ? ROUTES.GROUP_DETAIL(task.group_id) : ROUTES.TASKS);
      router.refresh();
    } catch (error) {
      console.error("Görev silinirken hata:", error);
      setError(error instanceof Error ? error.message : "Görev silinirken bir hata oluştu");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mx-auto"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mx-auto"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
        <p className="mt-4 text-gray-500 dark:text-gray-400">Görev yükleniyor...</p>
      </div>
    );
  }

  if (error && !task) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="text-red-500 mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12 mx-auto"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold mb-2">Hata Oluştu</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">{error}</p>
        <Link href={ROUTES.TASKS} className="btn btn-primary">
          Görevlere Dön
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Görevi Düzenle</h1>
        <div className="flex gap-2">
          <Link href={taskId ? ROUTES.TASK_DETAIL(taskId) : ROUTES.TASKS} className="text-blue-600 hover:underline">
            Vazgeç
          </Link>
          <button onClick={handleDelete} className="text-red-600 hover:underline" disabled={isDeleting}>
            {isDeleting ? "Siliniyor..." : "Sil"}
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 dark:bg-red-900/30 dark:text-red-400">
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-6">
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

          {/* Hidden group_id field */}
          <input type="hidden" {...register("group_id", { valueAsNumber: true })} />

          {/* Hidden subgroup_id field if it exists */}
          {task?.subgroup_id && <input type="hidden" {...register("subgroup_id", { valueAsNumber: true })} />}

          <div className="flex justify-end space-x-3 pt-4">
            <Link
              href={taskId ? ROUTES.TASK_DETAIL(taskId) : ROUTES.TASKS}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              İptal
            </Link>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
