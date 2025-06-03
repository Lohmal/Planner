import { getGroupsByUserId, getTasksByUserId, getUserById, initDB } from "@/lib/db";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ROUTES } from "@/types/constants";
import DashboardGroups from "@/components/dashboard/DashboardGroups";
import DashboardTasks from "@/components/dashboard/DashboardTasks";
import Link from "next/link";

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
  const userTasks = await getTasksByUserId(userId.value);

  return {
    user,
    groups: userGroups,
    tasks: userTasks,
  };
}

export default async function Dashboard() {
  const { user, groups, tasks } = await getData();

  return (
    <div className="space-y-8">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-2">Hoşgeldiniz, {user.full_name || user.username}!</h1>
        <p className="text-gray-600 dark:text-gray-300">Gruplarınızı ve görevlerinizi bu ekrandan yönetebilirsiniz.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Gruplarım</h2>
            <Link
              href={ROUTES.GROUP_CREATE}
              className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 flex items-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Yeni Grup
            </Link>
          </div>
          <DashboardGroups groups={groups} />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Görevlerim</h2>
          </div>
          <DashboardTasks tasks={tasks} />
        </div>
      </div>
    </div>
  );
}
