import {
  getGroupById,
  getGroupMembers,
  getSubgroups,
  getTasksByGroupId,
  getUserById,
  initDB,
  isGroupAdmin,
  isGroupMember,
} from "@/lib/db";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { ROUTES } from "@/types/constants";
import Link from "next/link";
import GroupMembers from "@/components/groups/GroupMembers";
import GroupTasks from "@/components/groups/GroupTasks";

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

  const isAdmin = await isGroupAdmin(id, userId.value);
  const members = await getGroupMembers(id);
  const tasks = await getTasksByGroupId(id);
  const subgroups = await getSubgroups(id);

  return {
    user,
    group,
    members,
    tasks,
    isAdmin,
    subgroups,
  };
}

export default async function GroupDetailPage({ params }: { params: { id: string } }) {
  const resolvedParams = await Promise.resolve(params);
  const { user, group, members, tasks, isAdmin, subgroups } = await getData(resolvedParams.id);

  return (
    <div className="space-y-8">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">{group.name}</h1>
            {group.description && <p className="mt-2 text-gray-600 dark:text-gray-300">{group.description}</p>}
          </div>
          {isAdmin && (
            <Link href={`/groups/${group.id}/edit`} className="btn btn-primary">
              Grubu Düzenle
            </Link>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          {/* Görevler Bölümü */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Görevler</h2>
              <div className="flex gap-2">
                <Link href={`/groups/${group.id}/tasks`} className="text-blue-600 hover:underline text-sm">
                  Tümünü Gör
                </Link>
                <Link href={ROUTES.TASK_CREATE} className="btn btn-sm btn-primary">
                  Görev Oluştur
                </Link>
              </div>
            </div>
            <GroupTasks tasks={tasks.slice(0, 5)} />
            {tasks.length > 5 && (
              <div className="mt-4 text-center">
                <Link href={`/groups/${group.id}/tasks`} className="text-blue-600 hover:underline">
                  +{tasks.length - 5} görev daha
                </Link>
              </div>
            )}
          </div>

          {/* Alt Gruplar Bölümü */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Alt Gruplar</h2>
              <div className="flex gap-2">
                <Link href={`/groups/${group.id}/subgroups`} className="text-blue-600 hover:underline text-sm">
                  Tümünü Gör
                </Link>
                <Link href={`/groups/${group.id}/subgroups/create`} className="btn btn-sm btn-primary">
                  Alt Grup Oluştur
                </Link>
              </div>
            </div>

            {subgroups.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-gray-500 dark:text-gray-400 mb-4">Bu grupta henüz alt grup bulunmamaktadır.</p>
                <Link href={`/groups/${group.id}/subgroups/create`} className="btn btn-primary">
                  Alt Grup Oluştur
                </Link>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {subgroups.slice(0, 4).map((subgroup) => (
                  <Link
                    key={subgroup.id}
                    href={`/groups/${group.id}/subgroups/${subgroup.id}`}
                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <h3 className="font-semibold mb-1">{subgroup.name}</h3>
                    {subgroup.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{subgroup.description}</p>
                    )}
                  </Link>
                ))}
              </div>
            )}

            {subgroups.length > 4 && (
              <div className="mt-4 text-center">
                <Link href={`/groups/${group.id}/subgroups`} className="text-blue-600 hover:underline">
                  +{subgroups.length - 4} alt grup daha
                </Link>
              </div>
            )}
          </div>
        </div>

        <div>
          {/* Üyeler Bölümü */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Üyeler</h2>
              <Link href={`/groups/${group.id}/members`} className="text-blue-600 hover:underline text-sm">
                Tümünü Gör
              </Link>
            </div>
            <GroupMembers members={members.slice(0, 5)} currentUserId={user.id} />
            {members.length > 5 && (
              <div className="mt-4 text-center">
                <Link href={`/groups/${group.id}/members`} className="text-blue-600 hover:underline">
                  +{members.length - 5} üye daha
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
