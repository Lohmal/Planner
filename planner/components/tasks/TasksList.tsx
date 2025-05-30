import { Task } from "@/types";
import Link from "next/link";
import { ROUTES } from "@/types/constants";

// Öncelik renklerini belirle
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

export default function TasksList({ tasks }: { tasks: Task[] }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md divide-y divide-gray-200 dark:divide-gray-700 overflow-hidden">
      {tasks.map((task) => (
        <Link
          key={task.id}
          href={ROUTES.TASK_DETAIL(task.id)}
          className="block p-4 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">{task.title}</h3>
              {task.description && (
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{task.description}</p>
              )}
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-sm">
                <span className="text-gray-600 dark:text-gray-300">Grup: {task.group_name}</span>

                {task.due_date && (
                  <span className="text-gray-600 dark:text-gray-300">
                    Son Tarih: {new Date(task.due_date).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>

            <span className={`text-xs px-2 py-1 rounded ${getPriorityBadge(task.priority)}`}>
              {getPriorityLabel(task.priority)}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
