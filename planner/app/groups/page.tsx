import { getGroupsByUserId, getUserById, initDB } from "@/lib/db";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ROUTES } from "@/types/constants";
import Link from "next/link";
import { Group } from "@/types";

export const dynamic = "force-dynamic";

async function getData() {
  await initDB();

  const cookieStore = await cookies();
  const userId = cookieStore.get("userId");

  if (!userId?.value) {
    redirect(ROUTES.LOGIN);
  }

  const user = await getUserById(userId.value);

  if (!user) {
    redirect(ROUTES.LOGIN);
  }

  const userGroups = await getGroupsByUserId(userId.value);

  return {
    user,
    groups: userGroups,
  };
}

function formatDate(dateString?: string) {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("tr-TR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function GroupsPage() {
  const { user, groups } = await getData();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Gruplarım</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">Üyesi olduğunuz gruplar ve içeriklerini yönetin</p>
        </div>
        <Link href={ROUTES.GROUP_CREATE} className="btn btn-primary flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
              clipRule="evenodd"
            />
          </svg>
          Yeni Grup Oluştur
        </Link>
      </div>

      {groups.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-2">Henüz bir gruba dahil değilsiniz</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">Yeni bir grup oluşturarak başlayabilirsiniz.</p>
          <Link href={ROUTES.GROUP_CREATE} className="btn btn-primary">
            Grup Oluştur
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {groups.map((group: Group) => (
            <Link
              key={group.id}
              href={ROUTES.GROUP_DETAIL(group.id)}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:bg-gray-100 hover:dark:bg-gray-700 transition-shadow"
            >
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{group.name}</h2>
                {group.description && (
                  <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">{group.description}</p>
                )}
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Oluşturulma Tarihi: {formatDate(group.created_at)}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
