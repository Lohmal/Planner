import { getTasksByUserId, getUserById, initDB } from "@/lib/db";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ROUTES } from "@/types/constants";
import Link from "next/link";
import TasksList from "@/components/tasks/TasksList";

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

  const tasks = await getTasksByUserId(userId.value);

  return {
    user,
    tasks,
  };
}

export default async function TasksPage() {
  const { user, tasks } = await getData();

  // Görevleri durumlarına göre grupla
  const pendingTasks = tasks.filter((task) => task.status === "pending");
  const inProgressTasks = tasks.filter((task) => task.status === "in_progress");
  const completedTasks = tasks.filter((task) => task.status === "completed");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Görevlerim</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">Size atanan tüm görevleri burada görebilirsiniz</p>
        </div>
        <Link href={ROUTES.TASK_CREATE} className="btn btn-primary flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
              clipRule="evenodd"
            />
          </svg>
          Yeni Görev Oluştur
        </Link>
      </div>

      {tasks.length === 0 ? (
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
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
              />
            </svg>
          </div>
          <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-2">Size atanmış görev bulunmamaktadır</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Yeni bir görev oluşturabilir veya diğer kişiler tarafından atanan görevleri bekleyebilirsiniz.
          </p>
          <Link href={ROUTES.TASK_CREATE} className="btn btn-primary">
            Görev Oluştur
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {pendingTasks.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-yellow-600 dark:text-yellow-400 flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Bekleyen Görevler ({pendingTasks.length})
              </h2>
              <TasksList tasks={pendingTasks} />
            </section>
          )}

          {inProgressTasks.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-blue-600 dark:text-blue-400 flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Devam Eden Görevler ({inProgressTasks.length})
              </h2>
              <TasksList tasks={inProgressTasks} />
            </section>
          )}

          {completedTasks.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-green-600 dark:text-green-400 flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Tamamlanan Görevler ({completedTasks.length})
              </h2>
              <TasksList tasks={completedTasks} />
            </section>
          )}
        </div>
      )}
    </div>
  );
}
