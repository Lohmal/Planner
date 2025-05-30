import { getTaskById, getUserById, initDB, isGroupMember } from "@/lib/db";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { ROUTES, TASK_STATUS_OPTIONS, TASK_PRIORITY_OPTIONS } from "@/types/constants";
import Link from "next/link";

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

  const task = await getTaskById(id);

  if (!task) {
    notFound();
  }

  // Kullanıcının görevin ait olduğu gruba üye olup olmadığını kontrol et
  const isMember = await isGroupMember(task.group_id, userId.value);

  if (!isMember) {
    // Eğer üye değilse görevler sayfasına yönlendir
    redirect(ROUTES.TASKS);
  }

  return {
    user,
    task,
  };
}

function getStatusLabel(status: string) {
  const option = TASK_STATUS_OPTIONS.find((opt) => opt.value === status);
  return option ? option.label : status;
}

function getStatusClass(status: string) {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200";
    case "in_progress":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200";
    case "completed":
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
  }
}

function getPriorityLabel(priority: string) {
  const option = TASK_PRIORITY_OPTIONS.find((opt) => opt.value === priority);
  return option ? option.label : priority;
}

function getPriorityClass(priority: string) {
  switch (priority) {
    case "high":
      return "text-red-600 dark:text-red-400";
    case "medium":
      return "text-orange-600 dark:text-orange-400";
    case "low":
      return "text-green-600 dark:text-green-400";
    default:
      return "text-gray-600 dark:text-gray-400";
  }
}

function formatDate(dateString?: string) {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("tr-TR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function TaskDetailPage({ params }: { params: { id: string } }) {
  const resolvedParams = await Promise.resolve(params);
  const { user, task } = await getData(resolvedParams.id);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold">Görev Detayı</h1>
        <div className="flex gap-2">
          <Link
            href={ROUTES.TASKS}
            className="btn bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200"
          >
            Görevlere Dön
          </Link>
          <Link href={`${ROUTES.TASK_EDIT(task.id)}`} className="btn btn-primary">
            Düzenle
          </Link>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold">{task.title}</h2>
              <div className="mt-2">
                <Link href={ROUTES.GROUP_DETAIL(task.group_id)} className="text-blue-600 hover:underline">
                  {task.group_name}
                </Link>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusClass(task.status)}`}>
                {getStatusLabel(task.status)}
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityClass(task.priority)}`}>
                {getPriorityLabel(task.priority)} Öncelik
              </span>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">Açıklama</h3>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                {task.description ? (
                  <p className="whitespace-pre-line">{task.description}</p>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 italic">Açıklama bulunmamaktadır.</p>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Görev Bilgileri</h3>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-3">
                <div className="grid grid-cols-2">
                  <span className="text-gray-600 dark:text-gray-400">Oluşturan:</span>
                  <span>{task.creator_full_name || task.creator_username || "Bilinmiyor"}</span>
                </div>
                <div className="grid grid-cols-2">
                  <span className="text-gray-600 dark:text-gray-400">Atanan:</span>
                  <span>{task.assigned_full_name || task.assigned_username || "Atanmamış"}</span>
                </div>
                {task.due_date && (
                  <div className="grid grid-cols-2">
                    <span className="text-gray-600 dark:text-gray-400">Son Tarih:</span>
                    <span>{formatDate(task.due_date)}</span>
                  </div>
                )}
                <div className="grid grid-cols-2">
                  <span className="text-gray-600 dark:text-gray-400">Oluşturulma:</span>
                  <span>{formatDate(task.created_at)}</span>
                </div>
                {task.updated_at && task.updated_at !== task.created_at && (
                  <div className="grid grid-cols-2">
                    <span className="text-gray-600 dark:text-gray-400">Güncellenme:</span>
                    <span>{formatDate(task.updated_at)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 bg-gray-50 dark:bg-gray-700/30 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <Link
            href={ROUTES.GROUP_DETAIL(task.group_id)}
            className="text-blue-600 hover:underline flex items-center gap-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            Gruba Dön
          </Link>
          <Link href={ROUTES.TASK_EDIT(task.id)} className="text-blue-600 hover:underline">
            Görevi Düzenle
          </Link>
        </div>
      </div>
    </div>
  );
}
