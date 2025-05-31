"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import { API_ENDPOINTS, ROUTES, TASK_STATUS_OPTIONS } from "@/types/constants";
import Link from "next/link";
import { Task } from "@/types";
import { ArrowLeft, ListTodo, Plus, Calendar, Clock } from "lucide-react";

export default function SubgroupDetailPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = (Array.isArray(params.groupId) ? params.groupId[0] : params.groupId) as string;
  const subgroupId = (Array.isArray(params.id) ? params.id[0] : params.id) as string;

  const { user } = useAuth();
  const [subgroup, setSubgroup] = useState<any>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!groupId || !subgroupId || !user) return;

    fetchSubgroupData();
  }, [groupId, subgroupId, user]);

  const fetchSubgroupData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch subgroup details
      const subgroupResponse = await fetch(`/api/subgroups/${subgroupId}`);

      if (!subgroupResponse.ok) {
        throw new Error("Alt grup bilgileri alınamadı");
      }

      const subgroupData = await subgroupResponse.json();

      if (!subgroupData.success || !subgroupData.data) {
        throw new Error(subgroupData.message || "Alt grup bulunamadı");
      }

      setSubgroup(subgroupData.data);

      // Fetch subgroup tasks
      const tasksResponse = await fetch(`/api/subgroups/${subgroupId}/tasks`);

      if (!tasksResponse.ok) {
        throw new Error("Alt grup görevleri alınamadı");
      }

      const tasksData = await tasksResponse.json();

      if (!tasksData.success) {
        throw new Error(tasksData.message || "Alt grup görevleri alınamadı");
      }

      setTasks(tasksData.data || []);
    } catch (error) {
      console.error("Alt grup verileri yüklenirken hata:", error);
      setError(error instanceof Error ? error.message : "Alt grup bilgileri yüklenirken bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200";
      case "in_progress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200";
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  const getStatusLabel = (status: string) => {
    const option = TASK_STATUS_OPTIONS.find((opt) => opt.value === status);
    return option ? option.label : status;
  };

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200";
      case "medium":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200";
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "high":
        return "Yüksek";
      case "medium":
        return "Orta";
      case "low":
        return "Düşük";
      default:
        return priority;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Belirtilmemiş";
    return new Date(dateString).toLocaleDateString("tr-TR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto text-center py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mx-auto"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mx-auto"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
        <p className="mt-4 text-gray-500 dark:text-gray-400">Alt grup yükleniyor...</p>
      </div>
    );
  }

  if (error || !subgroup) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
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
        <p className="text-gray-600 dark:text-gray-300 mb-6">{error || "Alt grup bulunamadı"}</p>
        <Link href={ROUTES.GROUP_DETAIL(groupId)} className="btn btn-primary">
          Gruba Dön
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">{subgroup.name}</h1>
          <p className="text-gray-600 dark:text-gray-300">{subgroup.group_name} içinde alt grup</p>
          {subgroup.description && <p className="mt-2 text-gray-600 dark:text-gray-400">{subgroup.description}</p>}
        </div>
        <div className="flex gap-2">
          <Link
            href={ROUTES.GROUP_DETAIL(groupId)}
            className="btn bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Gruba Dön
          </Link>
          <Link
            href={`/tasks/create?groupId=${groupId}&subgroupId=${subgroupId}`}
            className="btn btn-primary flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Görev Oluştur
          </Link>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <ListTodo className="h-5 w-5 mr-2" />
          Alt Grup Görevleri
        </h2>

        {tasks.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p className="mb-4">Bu alt grupta henüz görev bulunmuyor.</p>
            <Link
              href={`/tasks/create?groupId=${groupId}&subgroupId=${subgroupId}`}
              className="btn btn-primary inline-flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Görev Oluştur
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Görev
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Durum
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Öncelik
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Son Tarih
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Atananlar
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {tasks.map((task) => (
                  <tr
                    key={task.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                    onClick={() => router.push(ROUTES.TASK_DETAIL(task.id))}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium">{task.title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(task.status)}`}>
                        {getStatusLabel(task.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${getPriorityBadgeClass(task.priority)}`}>
                        {getPriorityLabel(task.priority)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 flex items-center">
                      <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                      {formatDate(task.due_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {task.assignees && task.assignees.length > 0 ? (
                        <div className="flex -space-x-2 overflow-hidden">
                          {task.assignees.slice(0, 3).map((assignee: any, index: number) => (
                            <div
                              key={assignee.id}
                              className="h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 text-xs font-medium ring-2 ring-white dark:ring-gray-800"
                              title={assignee.full_name || assignee.username}
                            >
                              {(assignee.full_name || assignee.username || "").charAt(0).toUpperCase()}
                            </div>
                          ))}
                          {task.assignees.length > 3 && (
                            <div className="h-6 w-6 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-400 text-xs font-medium ring-2 ring-white dark:ring-gray-800">
                              +{task.assignees.length - 3}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500 dark:text-gray-400">Atanmamış</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Alt Grup Detayları</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Oluşturan</p>
            <p className="font-medium">{subgroup.creator_full_name || subgroup.creator_username}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Oluşturulma Tarihi</p>
            <p className="font-medium flex items-center">
              <Clock className="h-4 w-4 mr-1 text-gray-400" />
              {formatDate(subgroup.created_at)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
