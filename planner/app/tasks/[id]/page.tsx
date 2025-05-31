"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import { API_ENDPOINTS, ROUTES, TASK_STATUS_OPTIONS, TASK_PRIORITY_OPTIONS } from "@/types/constants";
import Link from "next/link";
import { Task } from "@/types";
import { CalendarIcon, Clock, Users, Clipboard, PenSquare, MessageCircle, Trash2 } from "lucide-react";

interface Comment {
  id: number;
  user_id: number;
  comment: string;
  created_at: string;
  username: string;
  full_name: string | null;
  email: string;
}

export default function TaskDetailPage() {
  const router = useRouter();
  const params = useParams();
  const taskId = (Array.isArray(params.id) ? params.id[0] : params.id) as string;
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [task, setTask] = useState<Task | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    async function fetchTask() {
      if (!taskId || !user) return;

      try {
        setLoading(true);
        setError(null);

        const response = await fetch(API_ENDPOINTS.TASK_DETAIL(taskId));

        if (!response.ok) {
          throw new Error("Görev yüklenirken bir hata oluştu");
        }

        const data = await response.json();

        if (!data.success || !data.data) {
          throw new Error(data.message || "Görev bulunamadı");
        }

        // Log the task data to debug
        console.log("Task data:", data.data);

        setTask(data.data);
      } catch (error) {
        console.error("Görev yüklenirken hata:", error);
        setError(error instanceof Error ? error.message : "Görev yüklenirken bir hata oluştu");
      } finally {
        setLoading(false);
      }
    }

    fetchTask();
  }, [taskId, user]);

  // Fetch comments
  useEffect(() => {
    async function fetchComments() {
      if (!taskId || !user) return;

      try {
        setLoadingComments(true);

        const response = await fetch(API_ENDPOINTS.TASK_DETAIL(taskId) + "/comments");

        if (!response.ok) {
          throw new Error("Yorumlar alınırken bir hata oluştu");
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.message || "Yorumlar alınamadı");
        }

        setComments(data.data || []);
      } catch (error) {
        console.error("Yorumlar yüklenirken hata:", error);
        // Silently fail for comments
      } finally {
        setLoadingComments(false);
      }
    }

    if (task) {
      fetchComments();
    }
  }, [taskId, user, task]);

  const handleDelete = async () => {
    if (!confirm("Bu görevi silmek istediğinizden emin misiniz?")) {
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(API_ENDPOINTS.TASK_DETAIL(taskId), {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Görev silinirken bir hata oluştu");
      }

      router.push(task?.group_id ? ROUTES.GROUP_DETAIL(task.group_id) : ROUTES.TASKS);
      router.refresh();
    } catch (error) {
      console.error("Görev silinirken hata:", error);
      setError(error instanceof Error ? error.message : "Görev silinirken bir hata oluştu");
      setIsDeleting(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!commentText.trim() || !taskId || !user) {
      return;
    }

    setIsSubmittingComment(true);

    try {
      const response = await fetch(API_ENDPOINTS.TASK_DETAIL(taskId) + "/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ comment: commentText }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Yorum eklenirken bir hata oluştu");
      }

      // Refresh comments
      const commentsResponse = await fetch(API_ENDPOINTS.TASK_DETAIL(taskId) + "/comments");
      const commentsData = await commentsResponse.json();

      if (commentsData.success) {
        setComments(commentsData.data || []);
      }

      // Clear the input
      setCommentText("");

      // Focus the input again
      if (commentInputRef.current) {
        commentInputRef.current.focus();
      }
    } catch (error) {
      console.error("Yorum eklenirken hata:", error);
      alert("Yorum eklenirken bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!confirm("Bu yorumu silmek istediğinizden emin misiniz?")) {
      return;
    }

    try {
      const response = await fetch(`/api/tasks/comments/${commentId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Yorum silinirken bir hata oluştu");
      }

      // Update the local state
      setComments(comments.filter((comment) => comment.id !== commentId));
    } catch (error) {
      console.error("Yorum silinirken hata:", error);
      alert("Yorum silinirken bir hata oluştu. Lütfen tekrar deneyin.");
    }
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
    const option = TASK_STATUS_OPTIONS.find((opt) => opt.value === status);
    return option ? option.label : status;
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

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Belirtilmemiş";
    return new Date(dateString).toLocaleDateString("tr-TR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatCommentDate = (dateString: string) => {
    const date = new Date(dateString);

    // Format the date to a user-friendly string
    return date.toLocaleString("tr-TR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mx-auto"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mx-auto"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
        <p className="mt-4 text-gray-500 dark:text-gray-400">Görev yükleniyor...</p>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <div className="text-red-500 mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12 mx-auto"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold mb-2">Hata Oluştu</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">{error || "Görev bulunamadı"}</p>
        <Link href={ROUTES.TASKS} className="btn btn-primary">
          Görevlere Dön
        </Link>
      </div>
    );
  }

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
          <Link href={`/tasks/${taskId}/edit`} className="btn btn-primary flex items-center">
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

        {user && (
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
            <button
              onClick={handleDelete}
              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-medium"
              disabled={isDeleting}
            >
              {isDeleting ? "Siliniyor..." : "Görevi Sil"}
            </button>
          </div>
        )}
      </div>

      {/* Comments Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <MessageCircle className="h-5 w-5 mr-2" />
          Yorumlar
        </h2>

        {/* Comment Form */}
        <form onSubmit={handleSubmitComment} className="mb-6">
          <div className="mb-3">
            <textarea
              ref={commentInputRef}
              className="input w-full"
              rows={3}
              placeholder="Yorumunuzu buraya yazın..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              disabled={isSubmittingComment}
              required
            ></textarea>
          </div>
          <div className="flex justify-end">
            <button type="submit" className="btn btn-primary" disabled={isSubmittingComment || !commentText.trim()}>
              {isSubmittingComment ? "Gönderiliyor..." : "Yorum Ekle"}
            </button>
          </div>
        </form>

        {/* Comments List */}
        <div className="space-y-4">
          {loadingComments ? (
            <div className="text-center py-4">
              <div className="animate-spin inline-block w-6 h-6 border-2 border-t-blue-500 border-blue-200 rounded-full"></div>
              <p className="mt-2 text-gray-500 dark:text-gray-400">Yorumlar yükleniyor...</p>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-6 text-gray-500 dark:text-gray-400">
              Henüz yorum yapılmamış. İlk yorumu siz ekleyin!
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="border-b border-gray-100 dark:border-gray-700 pb-4 last:border-0">
                <div className="flex justify-between items-start">
                  <div className="font-medium">
                    {comment.full_name || comment.username}
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                      {formatCommentDate(comment.created_at)}
                    </span>
                  </div>

                  {/* Show delete button if user is the comment author */}
                  {user && user.id === comment.user_id && (
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      title="Yorumu sil"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <div className="mt-1 text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{comment.comment}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
