import { getGroupById, getGroupMembers, getUserById, initDB, isGroupAdmin, isGroupMember } from "@/lib/db";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { ROUTES } from "@/types/constants";
import Link from "next/link";
import { UserPlus } from "lucide-react";

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
  const isAdmin = await isGroupAdmin(id, userId.value);

  return {
    user,
    group,
    members,
    isAdmin,
  };
}

export default async function GroupMembersPage({ params }: { params: { id: string } }) {
  const resolvedParams = await Promise.resolve(params);
  const { user, group, members, isAdmin } = await getData(resolvedParams.id);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold">Grup Üyeleri</h1>
        <div className="flex gap-2">
          <Link
            href={ROUTES.GROUP_DETAIL(group.id)}
            className="btn bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200"
          >
            Gruba Dön
          </Link>
          {isAdmin && (
            <Link href={`/groups/${group.id}/invite`} className="btn btn-primary flex items-center">
              <UserPlus className="h-4 w-4 mr-2" />
              Üye Davet Et
            </Link>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold">{group.name}</h2>
          {group.description && <p className="mt-2 text-gray-600 dark:text-gray-300">{group.description}</p>}
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Toplam {members.length} üye bulunuyor</p>
        </div>

        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {members.map((member) => (
            <li key={member.id} className="p-4 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  {member.full_name
                    ? member.full_name.charAt(0).toUpperCase()
                    : member.username?.charAt(0).toUpperCase() || "U"}
                </div>
                <div>
                  <p className="font-medium">{member.full_name || member.username || "Bilinmeyen Kullanıcı"}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {member.role === "admin" ? "Yönetici" : "Üye"}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {member.user_id === user.id && (
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 text-sm rounded">
                    Siz
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
