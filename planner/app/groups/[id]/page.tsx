import { getGroupById, getGroupMembers, getTasksByGroupId, getUserById, initDB, isGroupMember } from "@/lib/db";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { ROUTES } from "@/types/constants";
import Link from "next/link";
import GroupTasks from "@/components/groups/GroupTasks";
import GroupMembers from "@/components/groups/GroupMembers";

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

  const members = await getGroupMembers(id);
  const tasks = await getTasksByGroupId(id);

  return {
    user,
    group,
    members,
    tasks,
  };
}

export default async function GroupDetailPage({ params }: { params: { id: string } }) {
  const resolvedParams = await Promise.resolve(params);
  const { user, group, members, tasks } = await getData(resolvedParams.id);

  return (
    <div className="space-y-8">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <h1 className="text-2xl font-bold">{group.name}</h1>
          <div className="flex gap-2">
            <Link
              href={ROUTES.GROUPS}
              className="btn bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200"
            >
              Gruplara Dön
            </Link>
            <Link href={`${ROUTES.GROUP_DETAIL(group.id)}/tasks/create`} className="btn btn-primary">
              Görev Ekle
            </Link>
          </div>
        </div>

        {group.description && <p className="text-gray-600 dark:text-gray-300 mb-4">{group.description}</p>}

        <div className="text-sm text-gray-500 dark:text-gray-400">
          Oluşturan: {members.find((m) => m.user_id === group.creator_id)?.full_name || "Bilinmiyor"}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">Görevler</h2>
            <GroupTasks tasks={tasks} />
          </div>
        </div>

        <div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Üyeler</h2>
              <Link href={`${ROUTES.GROUP_DETAIL(group.id)}/members`} className="text-blue-600 text-sm hover:underline">
                Tümünü Gör
              </Link>
            </div>
            <GroupMembers members={members.slice(0, 5)} currentUserId={user.id} />
            {members.length > 5 && (
              <div className="mt-4 text-center">
                <Link
                  href={`${ROUTES.GROUP_DETAIL(group.id)}/members`}
                  className="text-blue-600 hover:underline text-sm"
                >
                  +{members.length - 5} daha
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
