"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import { API_ENDPOINTS, ROUTES, TASK_STATUS_OPTIONS } from "@/types/constants";
import Link from "next/link";
import { Task } from "@/types";

type SortOption = "due_date" | "priority" | "status" | "subgroup";
type SortDirection = "asc" | "desc";

export default function GroupTasksPage() {
  const router = useRouter();
  const params = useParams();
  // Add a default value and type assertion to ensure groupId is a string
  const groupId = (Array.isArray(params.id) ? params.id[0] : params.id) as string;

  const { user } = useAuth();
  const [groupName, setGroupName] = useState<string>("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [subgroups, setSubgroups] = useState<any[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sort states
  const [sortBy, setSortBy] = useState<SortOption>("due_date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [subgroupFilter, setSubgroupFilter] = useState<number | null>(null);

  // Fetch group data, tasks and subgroups
  useEffect(() => {
    async function fetchData() {
      if (!groupId || !user) return;

      try {
        setLoading(true);
        setError(null);

        // Simpler approach: Skip the initial group fetch and just get tasks directly
        try {
          // Let's directly try to get tasks first
          await fetchTasksData(groupId);
        } catch (taskError) {
          console.error("Task fetch error:", taskError);
          // Try fallback with direct task fetch
          await fetchDirectTasksData(groupId);
        }
      } catch (err) {
        console.error("Veri yüklenirken hata:", err);
        setError(err instanceof Error ? err.message : "Bir hata oluştu");
      } finally {
        setLoading(false);
      }
    }

    // Fetch tasks through API
    async function fetchTasksData(gid: string) {
      try {
        // First try to get group name if we don't have it
        if (!groupName) {
          try {
            const groupResponse = await fetch(`/api/groups/${gid}`);
            if (groupResponse.ok) {
              const groupData = await groupResponse.json();
              if (groupData.success && groupData.data) {
                setGroupName(groupData.data.name);
              } else {
                setGroupName(`Grup #${gid}`);
              }
            } else {
              setGroupName(`Grup #${gid}`);
            }
          } catch (groupError) {
            console.error("Group name fetch error:", groupError);
            setGroupName(`Grup #${gid}`);
          }
        }

        // Now get tasks
        const tasksResponse = await fetch(`/api/tasks?groupId=${gid}`);

        if (!tasksResponse.ok) {
          throw new Error("Görevler alınırken hata oluştu");
        }

        const tasksData = await tasksResponse.json();

        if (!tasksData.success) {
          throw new Error(tasksData.message || "Görevler alınamadı");
        }

        setTasks(tasksData.data || []);
        setFilteredTasks(tasksData.data || []);

        // Try to fetch subgroups
        try {
          await fetchSubgroupsData(gid);
        } catch (subgroupError) {
          console.error("Subgroups fetch error:", subgroupError);
          // Just silently fail for subgroups
        }
      } catch (error) {
        console.error("Tasks fetch error:", error);
        throw error; // Re-throw so we can try the fallback
      }
    }

    // Fetch tasks directly without relying on the API (fallback)
    async function fetchDirectTasksData(gid: string) {
      try {
        // This will make a direct database call using fetch to our backend
        const directResponse = await fetch(`/api/tasks?groupId=${gid}`);

        if (!directResponse.ok) {
          throw new Error("Görevler alınırken hata oluştu");
        }

        const directData = await directResponse.json();

        if (!directData.success) {
          throw new Error(directData.message || "Görevler alınamadı");
        }

        // If we got tasks but no group name, try to extract it
        if (directData.data && directData.data.length > 0 && !groupName) {
          const firstTask = directData.data[0];
          if (firstTask.group_name) {
            setGroupName(firstTask.group_name);
          } else {
            setGroupName(`Grup #${gid}`);
          }
        } else if (!groupName) {
          setGroupName(`Grup #${gid}`);
        }

        setTasks(directData.data || []);
        setFilteredTasks(directData.data || []);

        // Try to fetch subgroups as well
        await fetchSubgroupsData(gid);
      } catch (error) {
        console.error("Direct tasks fetch error:", error);
        setError("Görevler yüklenirken bir hata oluştu");
        // If all else fails, at least show an empty list
        setTasks([]);
        setFilteredTasks([]);
      }
    }

    // Fetch subgroups data
    async function fetchSubgroupsData(gid: string) {
      try {
        const subgroupsResponse = await fetch(`/api/groups/${gid}/subgroups`);

        if (!subgroupsResponse.ok) {
          throw new Error("Alt gruplar alınırken hata oluştu");
        }

        const subgroupsData = await subgroupsResponse.json();

        if (!subgroupsData.success) {
          throw new Error(subgroupsData.message || "Alt gruplar alınamadı");
        }

        setSubgroups(subgroupsData.data || []);
      } catch (error) {
        console.error("Subgroups fetch error:", error);
        // Don't set error for subgroups, just use empty array
        setSubgroups([]);
      }
    }

    fetchData();
  }, [groupId, user, groupName]);

  // Apply filters and sorting
  useEffect(() => {
    if (!tasks.length) return;

    let result = [...tasks];

    // Apply status filter
    if (statusFilter) {
      result = result.filter((task) => task.status === statusFilter);
    }

    // Apply subgroup filter
    if (subgroupFilter) {
      result = result.filter((task) => task.subgroup_id === subgroupFilter);
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case "due_date":
          if (!a.due_date && !b.due_date) return 0;
          if (!a.due_date) return sortDirection === "asc" ? 1 : -1;
          if (!b.due_date) return sortDirection === "asc" ? -1 : 1;
          return sortDirection === "asc"
            ? new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
            : new Date(b.due_date).getTime() - new Date(a.due_date).getTime();

        case "priority":
          const priorityValues = { high: 3, medium: 2, low: 1 };
          const aPriority = priorityValues[a.priority as keyof typeof priorityValues] || 0;
          const bPriority = priorityValues[b.priority as keyof typeof priorityValues] || 0;
          return sortDirection === "asc" ? aPriority - bPriority : bPriority - aPriority;

        case "status":
          const statusValues = { pending: 1, in_progress: 2, completed: 3 };
          const aStatus = statusValues[a.status as keyof typeof statusValues] || 0;
          const bStatus = statusValues[b.status as keyof typeof statusValues] || 0;
          return sortDirection === "asc" ? aStatus - bStatus : bStatus - aStatus;

        case "subgroup":
          if (!a.subgroup_id && !b.subgroup_id) return 0;
          if (!a.subgroup_id) return sortDirection === "asc" ? -1 : 1;
          if (!b.subgroup_id) return sortDirection === "asc" ? 1 : -1;
          return sortDirection === "asc" ? a.subgroup_id - b.subgroup_id : b.subgroup_id - a.subgroup_id;

        default:
          return 0;
      }
    });

    setFilteredTasks(result);
  }, [tasks, sortBy, sortDirection, statusFilter, subgroupFilter]);

  const toggleSortDirection = () => {
    setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  const changeSortBy = (option: SortOption) => {
    if (sortBy === option) {
      toggleSortDirection();
    } else {
      setSortBy(option);
      setSortDirection("asc");
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
        <p className="mt-4 text-gray-500 dark:text-gray-400">Görevler yükleniyor...</p>
      </div>
    );
  }

  if (error) {
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
        <p className="text-gray-600 dark:text-gray-300 mb-6">{error}</p>
        <Link href={ROUTES.GROUPS} className="btn btn-primary">
          Gruplara Dön
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Görevler</h1>
          <p className="text-gray-600 dark:text-gray-300">{groupName} grubundaki tüm görevler</p>
        </div>
        <div className="flex gap-2">
          <Link
            href={groupId ? ROUTES.GROUP_DETAIL(groupId) : ROUTES.GROUPS}
            className="btn bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200"
          >
            Gruba Dön
          </Link>
          <Link href={ROUTES.TASK_CREATE} className="btn btn-primary">
            Görev Oluştur
          </Link>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden mb-8">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="grid gap-4 md:grid-cols-4 mb-4">
            <div>
              <label htmlFor="status-filter" className="block text-sm font-medium mb-1">
                Durum Filtresi
              </label>
              <select
                id="status-filter"
                className="input w-full"
                value={statusFilter || ""}
                onChange={(e) => setStatusFilter(e.target.value || null)}
              >
                <option value="">Tümü</option>
                {TASK_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="subgroup-filter" className="block text-sm font-medium mb-1">
                Alt Grup Filtresi
              </label>
              <select
                id="subgroup-filter"
                className="input w-full"
                value={subgroupFilter || ""}
                onChange={(e) => setSubgroupFilter(e.target.value ? parseInt(e.target.value) : null)}
              >
                <option value="">Tümü</option>
                {subgroups.map((subgroup) => (
                  <option key={subgroup.id} value={subgroup.id}>
                    {subgroup.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="sort-by" className="block text-sm font-medium mb-1">
                Sıralama Kriteri
              </label>
              <select
                id="sort-by"
                className="input w-full"
                value={sortBy}
                onChange={(e) => changeSortBy(e.target.value as SortOption)}
              >
                <option value="due_date">Bitiş Tarihi</option>
                <option value="priority">Öncelik</option>
                <option value="status">Durum</option>
                <option value="subgroup">Alt Grup</option>
              </select>
            </div>

            <div>
              <label htmlFor="sort-direction" className="block text-sm font-medium mb-1">
                Sıralama Yönü
              </label>
              <button
                id="sort-direction"
                className="input w-full flex justify-between items-center"
                onClick={toggleSortDirection}
              >
                <span>{sortDirection === "asc" ? "Artan" : "Azalan"}</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-5 w-5 transition-transform ${sortDirection === "desc" ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </button>
            </div>
          </div>

          <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">{filteredTasks.length} görev bulundu</div>
        </div>

        {filteredTasks.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">Seçilen kriterlere uygun görev bulunamadı.</p>
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
                    Alt Grup
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
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredTasks.map((task) => (
                  <tr
                    key={task.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                    onClick={() => router.push(ROUTES.TASK_DETAIL(task.id))}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium">{task.title}</div>
                      {task.assignees && task.assignees.length > 0 && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Atanmış:{" "}
                          {task.assignees.length > 1
                            ? `${task.assignees.length} kişi`
                            : task.assignees[0].full_name || task.assignees[0].username}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-gray-100">{task.subgroup_name || "Ana Grup"}</div>
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(task.due_date)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
