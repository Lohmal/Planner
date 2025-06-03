"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import { API_ENDPOINTS, ROUTES } from "@/types/constants";
import Link from "next/link";
import { Edit, ArrowLeft, ListTodo, Info, Archive } from "lucide-react";

export default function SubgroupDetailPage() {
  const router = useRouter();
  const params = useParams();

  // Parse params properly
  const groupId = (Array.isArray(params.id) ? params.id[0] : params.id) as string;
  const subgroupId = (Array.isArray(params.subgroupId) ? params.subgroupId[0] : params.subgroupId) as string;

  const { user } = useAuth();
  const [subgroup, setSubgroup] = useState<any>(null);
  const [groupName, setGroupName] = useState("");
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);

  // Define fetchData function first
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch group data
      const groupResponse = await fetch(API_ENDPOINTS.GROUP_DETAIL(groupId));
      if (groupResponse.ok) {
        const groupData = await groupResponse.json();
        if (groupData.success && groupData.data) {
          setGroupName(groupData.data.name);
        }
      }

      // Fetch subgroup data
      const subgroupResponse = await fetch(`/api/subgroups/${subgroupId}`);
      if (!subgroupResponse.ok) {
        throw new Error("Alt grup bilgileri alınamadı");
      }

      const subgroupData = await subgroupResponse.json();
      if (!subgroupData.success || !subgroupData.data) {
        throw new Error(subgroupData.message || "Alt grup bulunamadı");
      }

      const fetchedSubgroup = subgroupData.data;
      setSubgroup(fetchedSubgroup);

      // Check if user is creator or admin - Fix null check for user
      if (user) {
        setIsCreator(fetchedSubgroup.creator_id === Number(user.id));
      }

      // Fetch tasks for this subgroup
      try {
        const tasksResponse = await fetch(`/api/tasks?subgroupId=${subgroupId}`);
        if (tasksResponse.ok) {
          const tasksData = await tasksResponse.json();
          if (tasksData.success) {
            setTasks(tasksData.data || []);
          }
        }
      } catch (taskError) {
        console.error("Görevler alınırken hata:", taskError);
        setTasks([]);
      }

      // Check if user is admin - Fix null check for user
      try {
        const membersResponse = await fetch(API_ENDPOINTS.GROUP_MEMBERS(groupId));
        if (membersResponse.ok) {
          const membersData = await membersResponse.json();
          if (membersData.success && user) {
            const currentMember = membersData.data.find((m: any) => m.user_id === Number(user.id));
            setIsAdmin(currentMember?.role === "admin");
          }
        }
      } catch (memberError) {
        console.error("Üye bilgileri alınırken hata:", memberError);
      }
    } catch (error) {
      console.error("Alt grup bilgileri alınırken hata:", error);
      setError(error instanceof Error ? error.message : "Alt grup bilgileri alınırken bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  // Use fetchData in useEffect
  useEffect(() => {
    if (!groupId || !subgroupId || !user) return;
    fetchData();
  }, [groupId, subgroupId, user]);

  const handleArchiveSubgroup = async () => {
    if (
      !confirm(
        subgroup?.is_archived
          ? "Bu alt grubu arşivden çıkarmak istediğinizden emin misiniz?"
          : "Bu alt grubu arşivlemek istediğinizden emin misiniz?"
      )
    ) {
      return;
    }

    setIsArchiving(true);

    try {
      const response = await fetch(`/api/subgroups/${subgroupId}/archive`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ archive: !subgroup?.is_archived }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Alt grup arşivleme işlemi sırasında bir hata oluştu");
      }

      // Refresh the data
      fetchData();
    } catch (error) {
      console.error("Alt grup arşivleme hatası:", error);
      alert(error instanceof Error ? error.message : "Alt grup arşivleme işlemi sırasında bir hata oluştu");
    } finally {
      setIsArchiving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mx-auto"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mx-auto"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
        <p className="mt-4 text-gray-500 dark:text-gray-400">Alt grup yükleniyor...</p>
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
        <Link href={`/groups/${groupId}/subgroups`} className="btn btn-primary">
          Alt Gruplara Dön
        </Link>
      </div>
    );
  }

  if (!subgroup) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <p className="text-gray-600 dark:text-gray-300">Alt grup bulunamadı.</p>
        <Link href={`/groups/${groupId}/subgroups`} className="btn btn-primary mt-4">
          Alt Gruplara Dön
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-3xl font-bold">{subgroup.name}</h1>
            {subgroup.is_archived && (
              <span className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200 px-2 py-1 rounded text-xs font-medium">
                Arşivlenmiş
              </span>
            )}
          </div>
          {groupName && <p className="text-gray-600 dark:text-gray-300">{groupName} grubu içinde</p>}
        </div>
        <div className="flex gap-2">
          {(isAdmin || isCreator) && (
            <>
              <button
                onClick={handleArchiveSubgroup}
                disabled={isArchiving}
                className="btn btn-outline flex items-center"
              >
                <Archive className="h-4 w-4 mr-2" />
                {isArchiving ? "İşleniyor..." : subgroup.is_archived ? "Arşivden Çıkar" : "Arşivle"}
              </button>
              <Link
                href={`/groups/${groupId}/subgroups/${subgroupId}/edit`}
                className="btn btn-primary flex items-center"
              >
                <Edit className="h-4 w-4 mr-2" />
                Düzenle
              </Link>
            </>
          )}
          <Link href={`/groups/${groupId}/subgroups`} className="btn btn-outline flex items-center">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Geri Dön
          </Link>
        </div>
      </div>

      {/* Subgroup Info */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Info className="h-5 w-5 mr-2" />
          Alt Grup Bilgileri
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium">Alt Grup Adı</h3>
            <p className="text-gray-700 dark:text-gray-300">{subgroup.name}</p>
          </div>
          <div>
            <h3 className="font-medium">Açıklama</h3>
            <p className="text-gray-700 dark:text-gray-300">
              {subgroup.description || "Bu alt grup için bir açıklama yok."}
            </p>
          </div>
          <div>
            <h3 className="font-medium">Oluşturan</h3>
            <p className="text-gray-700 dark:text-gray-300">
              {subgroup.creator_full_name || subgroup.creator_username}
            </p>
          </div>
          <div>
            <h3 className="font-medium">Oluşturulma Tarihi</h3>
            <p className="text-gray-700 dark:text-gray-300">
              {new Date(subgroup.created_at).toLocaleDateString("tr-TR")}
            </p>
          </div>
        </div>
      </div>

      {/* Tasks Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold flex items-center">
            <ListTodo className="h-5 w-5 mr-2" />
            Görevler
          </h2>
          <Link href={`/groups/${groupId}/tasks/create?subgroupId=${subgroupId}`} className="btn btn-sm btn-primary">
            Yeni Görev
          </Link>
        </div>

        {tasks.length === 0 ? (
          <div className="py-6 text-center text-gray-500 dark:text-gray-400">Bu alt grupta henüz görev bulunmuyor.</div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {tasks.map((task) => (
              <li key={task.id} className="py-4">
                <Link
                  href={ROUTES.TASK_DETAIL(task.id)}
                  className="block hover:bg-gray-50 dark:hover:bg-gray-700 -mx-4 px-4 py-2 rounded-lg"
                >
                  <div className="flex justify-between">
                    <div>
                      <h3 className="font-medium">{task.title}</h3>
                      {task.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">{task.description}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          task.status === "completed"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200"
                            : task.status === "in_progress"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200"
                            : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200"
                        }`}
                      >
                        {task.status === "completed"
                          ? "Tamamlandı"
                          : task.status === "in_progress"
                          ? "Devam Ediyor"
                          : "Beklemede"}
                      </span>
                      {task.due_date && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Son Tarih: {new Date(task.due_date).toLocaleDateString("tr-TR")}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {tasks.length > 0 && (
          <div className="mt-4 text-center">
            <Link href={`/groups/${groupId}/tasks?subgroupId=${subgroupId}`} className="text-blue-600 hover:underline">
              Tüm Görevleri Görüntüle
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
