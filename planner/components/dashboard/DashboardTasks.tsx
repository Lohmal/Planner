import { Task } from "@/types";
import Link from "next/link";
import { ROUTES } from "@/types/constants";

// Öncelik ve duruma göre renk belirleme
function getPriorityColor(priority: string) {
  switch (priority) {
    case "high":
      return "text-red-600 dark:text-red-400";
    case "medium":
      return "text-yellow-600 dark:text-yellow-400";
    case "low":
      return "text-green-600 dark:text-green-400";
    default:
      return "text-gray-600 dark:text-gray-400";
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    case "in_progress":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    case "completed":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case "pending":
      return "Bekliyor";
    case "in_progress":
      return "Devam Ediyor";
    case "completed":
      return "Tamamlandı";
    default:
      return status;
  }
}

export default function DashboardTasks({ tasks }: { tasks: Task[] }) {
  if (tasks.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md text-center">
        <p className="text-gray-500 dark:text-gray-400 mb-4">Size atanmış görev bulunmamaktadır.</p>
        <Link href={ROUTES.TASKS} className="btn btn-primary text-sm">
          Tüm Görevleri Görüntüle
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      <ul className="divide-y divide-gray-200 dark:divide-gray-700">
        {tasks.map((task) => (
          <li key={task.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <Link href={ROUTES.TASK_DETAIL(task.id)} className="block">
              <div className="flex justify-between">
                <h3 className="font-medium text-gray-900 dark:text-white">{task.title}</h3>
                <span className={`text-xs px-2 py-1 rounded ${getStatusBadge(task.status)}`}>
                  {getStatusLabel(task.status)}
                </span>
              </div>
              {task.description && (
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{task.description}</p>
              )}
              <div className="mt-2 flex justify-between items-center text-sm">
                <span className="text-gray-600 dark:text-gray-300">Grup: {task.group_name}</span>
                <span className={`font-medium ${getPriorityColor(task.priority)}`}>
                  {task.priority === "high" ? "Yüksek" : task.priority === "medium" ? "Orta" : "Düşük"} Öncelik
                </span>
              </div>
              {task.due_date && (
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Son Tarih: {new Date(task.due_date).toLocaleDateString()}
                </div>
              )}
            </Link>
          </li>
        ))}
      </ul>
      <div className="p-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
        <Link
          href={ROUTES.TASKS}
          className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 flex items-center justify-center"
        >
          Tüm Görevleri Görüntüle
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 ml-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
