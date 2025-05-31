"use client";

import Link from "next/link";
import { useAuth } from "@/lib/authContext";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { ROUTES } from "@/types/constants";
import { Bell, Check, LogOut } from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [invitations, setInvitations] = useState<any[]>([]);
  const pathname = usePathname();
  const notificationRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Kullanıcı girişi yapıldığında bildirimleri al
  useEffect(() => {
    if (user) {
      fetchNotifications();
      fetchInvitations();

      // Her 30 saniyede bir bildirimleri güncelle
      const interval = setInterval(() => {
        fetchNotifications();
        fetchInvitations();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [user]);

  // Bildirim dışı bir yere tıklandığında bildirim menüsünü kapat
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Bildirimleri getir
  const fetchNotifications = async () => {
    try {
      const response = await fetch("/api/notifications");
      const data = await response.json();

      if (data.success) {
        setNotifications(data.data.notifications);
        setUnreadCount(data.data.unreadCount);
      }
    } catch (error) {
      console.error("Bildirimler alınırken hata:", error);
    }
  };

  // Grup davetlerini getir
  const fetchInvitations = async () => {
    try {
      const response = await fetch("/api/group-invitations");
      const data = await response.json();

      if (data.success) {
        setInvitations(data.data);
      }
    } catch (error) {
      console.error("Davetler alınırken hata:", error);
    }
  };

  // Tüm bildirimleri okundu olarak işaretle
  const markAllAsRead = async () => {
    try {
      const response = await fetch("/api/notifications/mark-all-read", {
        method: "POST",
      });

      if (response.ok) {
        setUnreadCount(0);
        setNotifications(notifications.map((n) => ({ ...n, is_read: 1 })));
      }
    } catch (error) {
      console.error("Bildirimler okundu olarak işaretlenirken hata:", error);
    }
  };

  // Davet yanıtı gönder
  const respondToInvitation = async (id: number, response: "accepted" | "rejected") => {
    try {
      const res = await fetch(`/api/group-invitations/${id}/respond`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ response }),
      });

      if (res.ok) {
        // Davetleri güncelle
        setInvitations(invitations.filter((inv) => inv.id !== id));
        // Bildirimleri de güncelle
        fetchNotifications();
      }
    } catch (error) {
      console.error("Davet yanıtı gönderilirken hata:", error);
    }
  };

  // Bildirim tipine göre renk sınıfı döndür
  const getNotificationColorClass = (type: string) => {
    switch (type) {
      case "task_assigned":
        return "bg-blue-100 border-blue-500 text-blue-800";
      case "task_due_soon":
        return "bg-yellow-100 border-yellow-500 text-yellow-800";
      case "group_invitation":
        return "bg-purple-100 border-purple-500 text-purple-800";
      case "group_member_joined":
        return "bg-green-100 border-green-500 text-green-800";
      default:
        return "bg-gray-100 border-gray-500 text-gray-800";
    }
  };

  // Bildirim tipine göre hedef sayfa URL'i döndür
  const getNotificationTarget = (notification: any) => {
    switch (notification.type) {
      case "task_assigned":
      case "task_due_soon":
        return ROUTES.TASK_DETAIL(notification.related_id);
      case "group_invitation":
        return "#"; // Bu bildirim için bildirim menüsünde işlem yapılacak
      case "group_member_joined":
        return ROUTES.GROUP_DETAIL(notification.related_id);
      default:
        return "#";
    }
  };

  // Bildirim menüsünde grup davetlerini göster
  const renderInvitations = () => {
    if (invitations.length === 0) {
      return <div className="py-2 px-3 text-gray-500 italic text-center text-sm">Bekleyen davet bulunmuyor</div>;
    }

    return invitations.map((inv) => (
      <div key={inv.id} className="p-3 border-b border-gray-100 dark:border-gray-700">
        <div className="text-sm font-medium">{inv.group_name} Grubuna Davet</div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
          {inv.inviter_full_name || inv.inviter_username} tarafından davet edildiniz
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => respondToInvitation(inv.id, "accepted")}
            className="px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200 text-xs rounded-full hover:bg-green-200 dark:hover:bg-green-900/50"
          >
            Kabul Et
          </button>
          <button
            onClick={() => respondToInvitation(inv.id, "rejected")}
            className="px-3 py-1 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200 text-xs rounded-full hover:bg-red-200 dark:hover:bg-red-900/50"
          >
            Reddet
          </button>
        </div>
      </div>
    ));
  };

  return (
    <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link className="flex-shrink-0 flex items-center" href={user ? ROUTES.DASHBOARD : ROUTES.HOME}>
              <span className="text-xl font-bold text-blue-600 dark:text-blue-400">Planner</span>
            </Link>

            {user && (
              <div className="hidden md:ml-6 md:flex md:space-x-4">
                <Link
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    pathname === ROUTES.DASHBOARD
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200"
                      : "text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700"
                  }`}
                  href={ROUTES.DASHBOARD}
                >
                  Ana Sayfa
                </Link>
                <Link
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    pathname.startsWith("/groups")
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200"
                      : "text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700"
                  }`}
                  href={ROUTES.GROUPS}
                >
                  Gruplar
                </Link>
                <Link
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    pathname.startsWith("/tasks")
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200"
                      : "text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700"
                  }`}
                  href={ROUTES.TASKS}
                >
                  Görevler
                </Link>
              </div>
            )}
          </div>

          {user && (
            <div className="hidden md:flex md:items-center">
              {/* Bildirim Butonu */}
              <div className="relative mr-4" ref={notificationRef}>
                <button
                  className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 relative"
                  onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center w-4 h-4 text-xs font-bold text-white bg-red-500 rounded-full">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>

                {/* Bildirim Menüsü */}
                {isNotificationOpen && (
                  <div className="absolute right-0 mt-2 w-80 max-h-[500px] overflow-y-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
                    <div className="flex justify-between items-center p-3 border-b border-gray-200 dark:border-gray-700">
                      <h3 className="text-sm font-semibold">Bildirimler</h3>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center"
                        >
                          <Check className="w-3 h-3 mr-1" />
                          Tümünü Okundu İşaretle
                        </button>
                      )}
                    </div>

                    {/* Grup Davetleri Bölümü */}
                    {invitations.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wider px-3 py-2 bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                          Grup Davetleri
                        </h4>
                        {renderInvitations()}
                      </div>
                    )}

                    {/* Bildirimler Bölümü */}
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider px-3 py-2 bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                        Bildirimler
                      </h4>
                      {notifications.length === 0 ? (
                        <div className="py-6 text-center text-gray-500 dark:text-gray-400 italic">
                          Henüz bildirim bulunmuyor
                        </div>
                      ) : (
                        notifications.map((notification) => {
                          const target = getNotificationTarget(notification);
                          const isRead = notification.is_read === 1;

                          return (
                            <div
                              key={notification.id}
                              className={`p-3 border-b border-gray-100 dark:border-gray-700 ${
                                !isRead ? "bg-blue-50 dark:bg-blue-900/10" : ""
                              } hover:bg-gray-50 dark:hover:bg-gray-700`}
                            >
                              {target === "#" ? (
                                <div>
                                  <h4 className="text-sm font-medium">{notification.title}</h4>
                                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                                    {notification.message}
                                  </p>
                                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                    {new Date(notification.created_at).toLocaleString("tr-TR", {
                                      day: "numeric",
                                      month: "short",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </p>
                                </div>
                              ) : (
                                <Link href={target} className="block">
                                  <h4 className="text-sm font-medium">{notification.title}</h4>
                                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                                    {notification.message}
                                  </p>
                                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                    {new Date(notification.created_at).toLocaleString("tr-TR", {
                                      day: "numeric",
                                      month: "short",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </p>
                                </Link>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Kullanıcı Menüsü */}
              <div className="relative" ref={menuRef}>
                <button
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                  <span className="mr-2">{user.full_name || user.username}</span>
                  <svg
                    className={`w-4 h-4 transition-transform ${isMenuOpen ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </button>

                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
                    <Link
                      href="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Profil
                    </Link>
                    <button
                      className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center"
                      onClick={() => {
                        logout();
                        setIsMenuOpen(false);
                      }}
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Çıkış Yap
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ...existing code for not logged in state... */}

          {/* ...existing code for mobile menu button... */}
        </div>
      </div>

      {/* ...existing code for mobile menu... */}
    </nav>
  );
}
