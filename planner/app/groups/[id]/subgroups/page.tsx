import { getGroupById, getSubgroups, getUserById, initDB, isGroupMember } from "@/lib/db";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { ROUTES } from "@/types/constants";
import Link from "next/link";
import { Archive } from "lucide-react";

export const dynamic = "force-dynamic";

async function getData(id: string) {
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

  const group = await getGroupById(id);

  if (!group) {
    notFound();
  }

  // Kullanıcının gruba üye olup olmadığını kontrol et
  const isMember = await isGroupMember(id, userId.value);

  if (!isMember) {
    // Eğer üye değilse gruplara yönlendir
    redirect(ROUTES.GROUPS);
  }

  const subgroups = await getSubgroups(id);

  return {
    user,
    group,
    subgroups,
  };
}

export default async function SubgroupsPage({ params }: { params: { id: string } }) {
  const resolvedParams = await Promise.resolve(params);
  const { user, group, subgroups } = await getData(resolvedParams.id);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold">Alt Gruplar</h1>
        <div className="flex gap-2">
          <Link
            href={`/groups/${group.id}/subgroups/archived`}
            className="btn bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 flex items-center gap-2"
          >
            <Archive className="h-4 w-4" />
            Arşivlenmiş Alt Gruplar
          </Link>
          <Link
            href={ROUTES.GROUP_DETAIL(group.id)}
            className="btn bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200"
          >
            Gruba Dön
          </Link>
          <Link href={`/groups/${group.id}/subgroups/create`} className="btn btn-primary">
            Alt Grup Oluştur
          </Link>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden mb-8">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold">{group.name}</h2>
          {group.description && <p className="mt-2 text-gray-600 dark:text-gray-300">{group.description}</p>}
        </div>
      </div>

      {subgroups.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md text-center">
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
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          </div>
          <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
            Bu grupta henüz alt grup bulunmuyor
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Alt gruplar oluşturarak görevleri daha iyi organize edebilirsiniz.
          </p>
          <Link href={`/groups/${group.id}/subgroups/create`} className="btn btn-primary">
            Alt Grup Oluştur
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {subgroups.map((subgroup) => (
            <Link
              key={subgroup.id}
              href={`/groups/${group.id}/subgroups/${subgroup.id}`}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
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
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
