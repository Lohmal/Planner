"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import { API_ENDPOINTS, ROUTES } from "@/types/constants";
import Link from "next/link";
import GroupMembers from "@/components/groups/GroupMembers";
import GroupTasks from "@/components/groups/GroupTasks";
import { Folders, PlusCircle } from "lucide-react";

export default function GroupDetailPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = (Array.isArray(params.id) ? params.id[0] : params.id) as string;

  const { user } = useAuth();
  const [group, setGroup] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [subgroups, setSubgroups] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Fetch data function
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch group details
      const groupResponse = await fetch(API_ENDPOINTS.GROUP_DETAIL(groupId));

      if (!groupResponse.ok) {
        throw new Error("Grup bilgileri alınamadı");
      }

      const groupData = await groupResponse.json();

      if (!groupData.success || !groupData.data) {
        throw new Error(groupData.message || "Grup bulunamadı");
      }

      const fetchedGroup = groupData.data;
      setGroup(fetchedGroup);

      // Check if current user is creator of the group
      setIsAdmin(fetchedGroup && user ? fetchedGroup.creator_id === user.id : false);

      // Fetch group members, tasks, and subgroups
      await Promise.all([fetchGroupMembers(groupId), fetchGroupTasks(groupId), fetchGroupSubgroups(groupId)]);
    } catch (error) {
      console.error("Group data fetch error:", error);
      setError(error instanceof Error ? error.message : "Grup bilgileri yüklenirken bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const fetchGroupMembers = async (gid: string) => {
    try {
      const membersResponse = await fetch(API_ENDPOINTS.GROUP_MEMBERS(gid));

      if (!membersResponse.ok) {
        throw new Error("Grup üyeleri alınamadı");
      }

      const membersData = await membersResponse.json();

      if (!membersData.success) {
        throw new Error(membersData.message || "Grup üyeleri alınamadı");
      }

      setMembers(membersData.data || []);

      // Also check if current user is admin based on group members
      if (user) {
        const currentMember = membersData.data.find((m: any) => m.user_id === Number(user.id));
        if (currentMember && currentMember.role === "admin") {
          setIsAdmin(true);
        }
      }
    } catch (error) {
      console.error("Members fetch error:", error);
    }
  };

  const fetchGroupTasks = async (gid: string) => {
    try {
      // Fix: Use a proper API endpoint for group tasks
      const tasksResponse = await fetch(`/api/tasks?groupId=${gid}`);

      if (!tasksResponse.ok) {
        throw new Error("Görevler alınamadı");
      }

      const tasksData = await tasksResponse.json();

      if (!tasksData.success) {
        throw new Error(tasksData.message || "Görevler alınamadı");
      }

      setTasks(tasksData.data || []);
    } catch (error) {
      console.error("Tasks fetch error:", error);
    }
  };

  const fetchGroupSubgroups = async (gid: string) => {
    try {
      const subgroupsResponse = await fetch(API_ENDPOINTS.GROUP_SUBGROUPS(gid));

      if (!subgroupsResponse.ok) {
        throw new Error("Alt gruplar alınamadı");
      }

      const subgroupsData = await subgroupsResponse.json();

      if (!subgroupsData.success) {
        throw new Error(subgroupsData.message || "Alt gruplar alınamadı");
      }

      setSubgroups(subgroupsData.data || []);
    } catch (error) {
      console.error("Subgroups fetch error:", error);
      // Just use empty array for subgroups if there's an error
      setSubgroups([]);
    }
  };

  useEffect(() => {
    if (!groupId || !user) return;

    fetchData();
  }, [groupId, user]);

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">{group?.name || "Grup Detayları"}</h1>
          {group?.description && <p className="text-gray-600 dark:text-gray-300">{group.description}</p>}
        </div>

        <div className="flex gap-2">
          {isAdmin && (
            <Link href={`/groups/${group.id}/edit`} className="btn btn-primary">
              Grubu Düzenle
            </Link>
          )}
        </div>
      </div>

      {/* Group Info */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Grup Bilgileri</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium">Grup Adı</h3>
            <p className="text-gray-700 dark:text-gray-300">{group?.name}</p>
          </div>
          <div>
            <h3 className="font-medium">Açıklama</h3>
            <p className="text-gray-700 dark:text-gray-300">{group?.description || "Bu grup için bir açıklama yok."}</p>
          </div>
          <div>
            <h3 className="font-medium">Oluşturan</h3>
            <p className="text-gray-700 dark:text-gray-300">{group?.creator_full_name || group?.creator_username}</p>
          </div>
          <div>
            <h3 className="font-medium">Üyeler</h3>
            <p className="text-gray-700 dark:text-gray-300">{members.length} üye</p>
          </div>
          <div>
            <h3 className="font-medium">Alt Gruplar</h3>
            <p className="text-gray-700 dark:text-gray-300">{subgroups.length} alt grup</p>
          </div>
          <div>
            <h3 className="font-medium">Görevler</h3>
            <p className="text-gray-700 dark:text-gray-300">{tasks.length} görev</p>
          </div>
        </div>
      </div>

      {/* Subgroups Section */}
      {subgroups.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Folders className="h-5 w-5 mr-2" />
              Alt Gruplar
            </h2>
            <Link href={`/groups/${groupId}/subgroups`} className="btn btn-sm btn-outline flex items-center">
              Tüm Alt Grupları Gör
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subgroups.map((subgroup: any) => (
              <Link
                key={subgroup.id}
                href={ROUTES.SUBGROUP_DETAIL(groupId, subgroup.id)}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
              >
                <h3 className="font-medium">{subgroup.name}</h3>
                {subgroup.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{subgroup.description}</p>
                )}
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Oluşturan: {subgroup.creator_full_name || subgroup.creator_username}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Add a button for when there are no subgroups */}
      {subgroups.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6 text-center">
          <h2 className="text-xl font-semibold mb-4 flex items-center justify-center">
            <Folders className="h-5 w-5 mr-2" />
            Alt Gruplar
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">Bu grupta henüz alt grup bulunmuyor.</p>
          <div className="flex justify-center space-x-4">
            <Link href={`/groups/${groupId}/subgroups/create`} className="btn btn-primary">
              Alt Grup Oluştur
            </Link>
            <Link href={`/groups/${groupId}/subgroups`} className="btn btn-outline">
              Alt Grupları Yönet
            </Link>
          </div>
        </div>
      )}

      {/* Members Preview */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold flex items-center">
            {/* User icon */}
            Üyeler ({members.length})
          </h2>
          <Link
            href={`/groups/${groupId}/members`}
            className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
          >
            Tümünü Gör
          </Link>
        </div>

        {user ? (
          <GroupMembers members={members.slice(0, 5)} currentUserId={Number(user.id)} />
        ) : (
          <p className="text-gray-500 dark:text-gray-400">Üyeleri görmek için giriş yapmalısınız.</p>
        )}

        {members.length > 5 && (
          <div className="mt-4 text-center">
            <Link href={`/groups/${groupId}/members`} className="text-blue-600 hover:underline">
              +{members.length - 5} üye daha
            </Link>
          </div>
        )}
      </div>

      {/* Tasks Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Görevler</h2>
          <Link href={`/groups/${groupId}/tasks/create`} className="btn btn-sm btn-primary flex items-center">
            <PlusCircle className="h-4 w-4 mr-2" />
            Yeni Görev
          </Link>
        </div>

        <GroupTasks tasks={tasks.slice(0, 5)} />
        {tasks.length > 5 && (
          <div className="mt-4 text-center">
            <Link href={`/groups/${groupId}/tasks`} className="text-blue-600 hover:underline">
              +{tasks.length - 5} görev daha
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
