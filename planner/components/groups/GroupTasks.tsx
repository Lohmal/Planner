import { Task } from "@/types";
import Link from "next/link";
import { ROUTES } from "@/types/constants";

// Durum ve öncelik renklerini belirle
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

function getPriorityBadge(priority: string) {
  switch (priority) {
    case "high":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    case "medium":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
    case "low":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
  }
}

function getPriorityLabel(priority: string) {
  switch (priority) {
    case "high":
      return "Yüksek";
    case "medium":
      return "Orta";
    case "low":
      return "Düşük";
    default:
      return priority;
  }
}

export default function GroupTasks({ tasks }: { tasks: Task[] }) {
  if (tasks.length === 0) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400 py-8">
        <p className="mb-4">Bu grupta henüz görev bulunmamaktadır.</p>
        <Link href={`${ROUTES.TASK_CREATE}`} className="btn btn-primary">
          Görev Oluştur
        </Link>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200 dark:divide-gray-700">
      {tasks.map((task) => (
        <Link
          key={task.id}
          href={ROUTES.TASK_DETAIL(task.id)}
          className="block py-4 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          <div className="flex justify-between mb-2">
            <h3 className="font-medium">{task.title}</h3>
            <span className={`text-xs px-2 py-1 rounded ${getStatusBadge(task.status)}`}>
              {getStatusLabel(task.status)}
            </span>
          </div>

          {task.description && <p className="text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">{task.description}</p>}

          <div className="flex flex-wrap gap-2 items-center text-sm">
            <span className={`text-xs px-2 py-1 rounded ${getPriorityBadge(task.priority)}`}>
              {getPriorityLabel(task.priority)}
            </span>

            {task.assignees && task.assignees.length > 0 && (
              <span className="text-gray-600 dark:text-gray-300">
                Atanan:{" "}
                {task.assignees.length > 1
                  ? `${task.assignees.length} kişi`
                  : task.assignees[0].full_name || task.assignees[0].username || "Bilinmiyor"}
              </span>
            )}

            {task.due_date && (
              <span className="text-gray-600 dark:text-gray-300">
                Son Tarih: {new Date(task.due_date).toLocaleDateString()}
              </span>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}
