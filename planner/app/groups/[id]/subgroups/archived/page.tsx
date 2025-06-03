"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ROUTES } from "@/types/constants";
import Link from "next/link";
import { Archive, ArrowLeft } from "lucide-react";
import { useAuth } from "@/lib/authContext";
import UnarchiveButton from "@/components/groups/UnarchiveButton";

export default function ArchivedSubgroupsPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = (Array.isArray(params.id) ? params.id[0] : params.id) as string;

  const { user } = useAuth();
  const [group, setGroup] = useState<any>(null);
  const [subgroups, setSubgroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!groupId || !user) {
      router.push(ROUTES.GROUPS);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch group data
        const groupResponse = await fetch(`/api/groups/${groupId}`);
        if (!groupResponse.ok) {
          throw new Error("Grup bilgileri alınamadı");
        }

        const groupData = await groupResponse.json();
        if (!groupData.success || !groupData.data) {
          throw new Error(groupData.message || "Grup bulunamadı");
        }

        setGroup(groupData.data);

        // Fetch archived subgroups
        const subgroupsResponse = await fetch(`/api/groups/${groupId}/subgroups/archived`);
        if (!subgroupsResponse.ok) {
          throw new Error("Arşivlenmiş alt gruplar alınamadı");
        }

        const subgroupsData = await subgroupsResponse.json();
        if (!subgroupsData.success) {
          throw new Error(subgroupsData.message || "Arşivlenmiş alt gruplar alınamadı");
        }

        // Update to use the correct field name - data instead of groups
        setSubgroups(subgroupsData.data || []);
      } catch (error) {
        console.error("Veri yüklenirken hata:", error);
        setError(error instanceof Error ? error.message : "Bir hata oluştu");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [groupId, user, router]);

  // Function to remove a subgroup from the list after unarchiving
  const removeSubgroupFromList = (subgroupId: number) => {
    setSubgroups(subgroups.filter((subgroup) => subgroup.id !== subgroupId));
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mx-auto"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mx-auto"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
        <p className="mt-4 text-gray-500 dark:text-gray-400">Arşivlenmiş alt gruplar yükleniyor...</p>
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

  if (!group) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <p className="text-gray-600 dark:text-gray-300">Grup bulunamadı.</p>
        <Link href={ROUTES.GROUPS} className="btn btn-primary mt-4">
          Gruplara Dön
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Arşivlenmiş Alt Gruplar</h1>
          <p className="text-gray-600 dark:text-gray-300">{group.name} grubundaki arşivlenmiş alt gruplar</p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/groups/${groupId}/subgroups`}
            className="btn bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Alt Gruplara Dön
          </Link>
        </div>
      </div>

      {subgroups.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mb-4">
            <Archive className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
            Bu grupta arşivlenmiş alt grup bulunmuyor
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Alt grupları arşivlediğinizde buradan erişebilirsiniz.
          </p>
          <Link href={`/groups/${groupId}/subgroups`} className="btn btn-primary">
            Alt Gruplara Dön
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {subgroups.map((subgroup) => (
            <div key={subgroup.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 relative">
              <div className="absolute top-2 right-2 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200 px-2 py-1 rounded text-xs font-medium">
                Arşivlenmiş
              </div>

              <h3 className="text-xl font-bold mb-2">{subgroup.name}</h3>
              {subgroup.description && (
                <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">{subgroup.description}</p>
              )}
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Oluşturan: {subgroup.creator_full_name || subgroup.creator_username}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {new Date(subgroup.created_at).toLocaleDateString("tr-TR")}
                </span>
              </div>

              <div className="mt-4 flex gap-2">
                <Link href={`/groups/${groupId}/subgroups/${subgroup.id}`} className="btn btn-sm btn-outline">
                  Görüntüle
                </Link>
                <UnarchiveButton
                  id={subgroup.id}
                  type="subgroup"
                  onSuccess={() => removeSubgroupFromList(subgroup.id)}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
