"use client"; // This must be the first line of the file with no blank lines before it

import { useEffect, useState } from "react";
import Link from "next/link";
import { ROUTES } from "@/types/constants";
import { Group } from "@/types";
import { Archive, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import UnarchiveButton from "@/components/groups/UnarchiveButton";

export default function ArchivedGroupsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await fetch("/api/groups/archived");

        if (!res.ok) {
          throw new Error(`Arşivlenmiş gruplar alınamadı: ${res.status}`);
        }

        const data = await res.json();

        if (!data.success) {
          throw new Error(data.message || "Arşivlenmiş gruplar alınamadı");
        }

        setGroups(data.groups || []);
      } catch (error: any) {
        console.error("Fetch error:", error);
        setError(error.message || "Arşivlenmiş gruplar alınamadı");
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchGroups();
    } else {
      setLoading(false);
    }
  }, [user]);

  // Replace the handleUnarchiveGroup function with a method to remove a group from the state
  const removeGroupFromList = (groupId: number) => {
    setGroups(groups.filter((group) => group.id !== groupId));
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mx-auto"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mx-auto"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
        <p className="mt-4 text-gray-500 dark:text-gray-400">Arşivlenmiş gruplar yükleniyor...</p>
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Arşivlenmiş Gruplar</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">Arşivlediğiniz gruplar burada listelenir</p>
        </div>
        <Link href={ROUTES.GROUPS} className="btn btn-outline flex items-center gap-2">
          <ArrowLeft className="h-5 w-5" />
          Gruplara Dön
        </Link>
      </div>

      {groups.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mb-4">
            <Archive className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-2">Henüz arşivlenmiş grup bulunmuyor</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">Grupları arşivlediğinizde buradan erişebilirsiniz.</p>
          <Link href={ROUTES.GROUPS} className="btn btn-primary">
            Gruplara Dön
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {groups.map((group: Group) => (
            <div key={group.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden relative">
              <div className="absolute top-2 right-2 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200 px-2 py-1 rounded text-xs font-medium">
                Arşivlenmiş
              </div>

              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{group.name}</h2>
                {group.description && (
                  <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">{group.description}</p>
                )}
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Oluşturulma Tarihi:{" "}
                  {new Date(group.created_at).toLocaleDateString("tr-TR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>

                <div className="mt-4 flex gap-2">
                  <Link href={ROUTES.GROUP_DETAIL(group.id)} className="btn btn-sm btn-outline">
                    Görüntüle
                  </Link>
                  <UnarchiveButton id={group.id} type="group" onSuccess={() => removeGroupFromList(group.id)} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
