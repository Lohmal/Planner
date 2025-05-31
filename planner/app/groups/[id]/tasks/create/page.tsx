"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { taskSchema, TaskForm } from "@/types/validators";
import { API_ENDPOINTS, ROUTES } from "@/types/constants";
import { useAuth } from "@/lib/authContext";
import Link from "next/link";
import { Calendar, Users } from "lucide-react";
import UserSelector from "@/components/UserSelector";

export default function CreateTaskPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const subgroupIdParam = searchParams.get("subgroupId");

  const groupId = (Array.isArray(params.id) ? params.id[0] : params.id) as string;

  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [groupMembers, setGroupMembers] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
  const [groupData, setGroupData] = useState<any>(null);
  const [subgroups, setSubgroups] = useState<any[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<TaskForm>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      description: "",
      status: "pending",
      priority: "medium",
      due_date: "",
      subgroup_id: null,
      group_id: Number(groupId), // Set the group_id directly in the form
    },
  });

  // Load group info and members
  useEffect(() => {
    if (!groupId || !user) return;

    async function loadGroupData() {
      try {
        // Load group data
        const groupResponse = await fetch(API_ENDPOINTS.GROUP_DETAIL(groupId));
        if (!groupResponse.ok) throw new Error("Grup bilgileri alınamadı");

        const groupData = await groupResponse.json();
        if (!groupData.success) throw new Error(groupData.message || "Grup bulunamadı");

        setGroupData(groupData.data);

        // Load group members
        const membersResponse = await fetch(API_ENDPOINTS.GROUP_MEMBERS(groupId));
        if (!membersResponse.ok) throw new Error("Grup üyeleri alınamadı");

        const membersData = await membersResponse.json();
        if (membersData.success && membersData.data) {
          setGroupMembers(membersData.data);
        }

        // Load subgroups
        const subgroupsResponse = await fetch(`${API_ENDPOINTS.GROUP_DETAIL(groupId)}/subgroups`);
        if (subgroupsResponse.ok) {
          const subgroupsData = await subgroupsResponse.json();
          if (subgroupsData.success && subgroupsData.data) {
            setSubgroups(subgroupsData.data);
          }
        }
      } catch (error) {
        console.error("Grup verileri yüklenirken hata:", error);
        setError(error instanceof Error ? error.message : "Grup verileri yüklenirken bir hata oluştu");
      }
    }

    loadGroupData();
  }, [groupId, user]);

  // After loading subgroups, set the subgroup_id from URL if present
  useEffect(() => {
    if (subgroupIdParam && subgroups.some((sg) => sg.id.toString() === subgroupIdParam)) {
      setValue("subgroup_id", Number(subgroupIdParam));
    }
  }, [subgroups, subgroupIdParam, setValue]);

  const onSubmit = async (data: TaskForm) => {
    if (!user) {
      setError("Oturum açmanız gerekiyor");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const taskData = {
        ...data,
        group_id: Number(groupId),
        created_by: user.id,
        assigned_users: selectedUsers.map((u) => u.id),
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

      // Redirect to the group detail page after task creation
      router.push(`/groups/${groupId}`);
      router.refresh();
    } catch (error) {
      console.error("Görev oluşturulurken hata:", error);
      setError(error instanceof Error ? error.message : "Görev oluşturulurken bir hata oluştu");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUserSelect = (selectedUsers: any[]) => {
    setSelectedUsers(selectedUsers);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Yeni Görev Oluştur</h1>
          {groupData && <p className="text-gray-600 dark:text-gray-300">{groupData.name} grubu için</p>}
        </div>
        <Link href={ROUTES.GROUP_DETAIL(groupId)} className="btn btn-outline">
          İptal
        </Link>
      </div>

      {error && (
        <div className="p-4 mb-6 bg-red-50 border-l-4 border-red-500 text-red-700 dark:bg-red-900/30 dark:text-red-400">
          <p>{error}</p>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-2">
              Görev Başlığı *
            </label>
            <input
              id="title"
              {...register("title")}
              className="input w-full"
              placeholder="Görev başlığı girin"
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
              <label htmlFor="status" className="block text-sm font-medium mb-2">
                Durum
              </label>
              <select id="status" {...register("status")} className="select w-full" disabled={isSubmitting}>
                <option value="pending">Beklemede</option>
                <option value="in_progress">Devam Ediyor</option>
                <option value="completed">Tamamlandı</option>
              </select>
            </div>

            <div>
              <label htmlFor="priority" className="block text-sm font-medium mb-2">
                Öncelik
              </label>
              <select id="priority" {...register("priority")} className="select w-full" disabled={isSubmitting}>
                <option value="low">Düşük</option>
                <option value="medium">Orta</option>
                <option value="high">Yüksek</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="due_date" className="inline-flex items-center text-sm font-medium mb-2">
              <Calendar className="h-4 w-4 mr-1" />
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

          {subgroups.length > 0 && (
            <div>
              <label htmlFor="subgroup_id" className="block text-sm font-medium mb-2">
                Alt Grup
              </label>
              <select id="subgroup_id" {...register("subgroup_id")} className="select w-full" disabled={isSubmitting}>
                <option value="">Alt grup seçin (isteğe bağlı)</option>
                {subgroups.map((subgroup) => (
                  <option key={subgroup.id} value={subgroup.id}>
                    {subgroup.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="inline-flex items-center text-sm font-medium mb-2">
              <Users className="h-4 w-4 mr-1" />
              Görev Atanacak Kişiler
            </label>
            <UserSelector
              selectedUsers={selectedUsers}
              onSelectUsers={handleUserSelect}
              availableUsers={groupMembers.map((member) => ({
                id: member.user_id,
                username: member.username,
                full_name: member.full_name,
                email: member.email,
              }))}
              disabled={isSubmitting}
            />
          </div>

          <div className="flex justify-end">
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? "Oluşturuluyor..." : "Görevi Oluştur"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
