import { Task } from "@/types";
import Link from "next/link";
import { ROUTES } from "@/types/constants";
import { CalendarIcon, Clock, Users, Clipboard, PenSquare } from "lucide-react";

interface TaskDetailViewProps {
  task: Task;
}

export default function TaskDetailView({ task }: TaskDetailViewProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Belirtilmemiş";
    return new Date(dateString).toLocaleDateString("tr-TR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusBadgeClass = (status: string) => {
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
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "Beklemede";
      case "in_progress":
        return "Devam Ediyor";
      case "completed":
        return "Tamamlandı";
      default:
        return status;
    }
  };

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200";
      case "medium":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200";
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  const getPriorityLabel = (priority: string) => {
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
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">{task.title}</h1>
          <p className="text-gray-600 dark:text-gray-300">
            {task.group_name} {task.subgroup_name ? `/ ${task.subgroup_name}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={ROUTES.GROUP_DETAIL(task.group_id)} className="btn btn-outline">
            Gruba Dön
          </Link>
          <Link href={`/tasks/${task.id}/edit`} className="btn btn-primary flex items-center">
            <PenSquare className="h-4 w-4 mr-2" />
            Düzenle
          </Link>
        </div>
      </div>

      {/* Task Details Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Clipboard className="h-5 w-5 mr-2" />
              Görev Detayları
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Durum</h3>
                <div className="mt-1">
                  <span className={`px-3 py-1 text-sm rounded-full ${getStatusBadgeClass(task.status)}`}>
                    {getStatusLabel(task.status)}
                  </span>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Öncelik</h3>
                <div className="mt-1">
                  <span className={`px-3 py-1 text-sm rounded-full ${getPriorityBadgeClass(task.priority)}`}>
                    {getPriorityLabel(task.priority)}
                  </span>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Son Tarih</h3>
                <div className="mt-1 flex items-center">
                  <CalendarIcon className="h-4 w-4 mr-1 text-gray-400" />
                  <span>{formatDate(task.due_date)}</span>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Oluşturan</h3>
                <div className="mt-1">{task.creator_full_name || task.creator_username}</div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Oluşturulma Tarihi</h3>
                <div className="mt-1 flex items-center">
                  <Clock className="h-4 w-4 mr-1 text-gray-400" />
                  <span>{formatDate(task.created_at)}</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Açıklama</h2>
            <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg min-h-[100px]">
              {task.description ? (
                <p className="whitespace-pre-wrap">{task.description}</p>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 italic">Açıklama bulunmuyor</p>
              )}
            </div>

            <h2 className="text-xl font-semibold mt-6 mb-4 flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Atanan Kişiler
            </h2>
            <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
              {task.assignees && task.assignees.length > 0 ? (
                <ul className="space-y-2">
                  {task.assignees.map((assignee) => (
                    <li key={assignee.id} className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">{assignee.full_name || assignee.username}</span>
                        <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">{assignee.email}</span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {assignee.assigner_full_name || assignee.assigner_username} tarafından atandı
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 italic">Görev henüz kimseye atanmamış</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
