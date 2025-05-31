"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import { API_ENDPOINTS, ROUTES } from "@/types/constants";
import Link from "next/link";
import { User, UserPlus, Mail, Shield, LogOut, X } from "lucide-react";

export default function GroupMembersPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = (Array.isArray(params.id) ? params.id[0] : params.id) as string;

  const { user } = useAuth();
  const [members, setMembers] = useState<any[]>([]);
  const [groupName, setGroupName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!groupId || !user) return;

    fetchGroupData();
  }, [groupId, user]);

  const fetchGroupData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch group details
      const groupResponse = await fetch(API_ENDPOINTS.GROUP_DETAIL(groupId));
      if (!groupResponse.ok) {
        throw new Error("Grup bilgileri alınamadı");
      }

      const groupData = await groupResponse.json();
      if (!groupData.success) {
        throw new Error(groupData.message || "Grup bulunamadı");
      }

      setGroupName(groupData.data.name);

      // Fetch group members
      const membersResponse = await fetch(API_ENDPOINTS.GROUP_MEMBERS(groupId));
      if (!membersResponse.ok) {
        throw new Error("Grup üyeleri alınamadı");
      }

      const membersData = await membersResponse.json();
      if (!membersData.success) {
        throw new Error(membersData.message || "Grup üyeleri alınamadı");
      }

      setMembers(membersData.data || []);

      // Check if current user is admin
      const currentUserMember = membersData.data.find((member: any) => member.user_id === Number(user!.id));
      setIsAdmin(currentUserMember?.role === "admin");
    } catch (error) {
      console.error("Group data fetch error:", error);
      setError(error instanceof Error ? error.message : "Grup bilgileri yüklenirken bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (userId: number) => {
    if (!confirm("Bu kullanıcıyı gruptan çıkarmak istediğinizden emin misiniz?")) {
      return;
    }

    setRemovingUserId(userId.toString());

    try {
      const response = await fetch(`/api/groups/${groupId}/members/${userId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Kullanıcı çıkarılırken bir hata oluştu");
      }

      // Update the members list
      setMembers(members.filter((member) => member.user_id !== userId));
    } catch (error) {
      console.error("Error removing member:", error);
      alert(error instanceof Error ? error.message : "Kullanıcı çıkarılırken bir hata oluştu");
    } finally {
      setRemovingUserId(null);
    }
  };

  const handleLeaveGroup = async () => {
    // Early return if user doesn't exist
    if (!user?.id) return;

    if (!confirm("Bu gruptan ayrılmak istediğinizden emin misiniz?")) {
      return;
    }

    // Use non-null assertion operator since we already checked above
    setRemovingUserId(user!.id.toString());

    try {
      const response = await fetch(`/api/groups/${groupId}/members/${user!.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Gruptan ayrılırken bir hata oluştu");
      }

      // Redirect to groups page
      router.push(ROUTES.GROUPS);
    } catch (error) {
      console.error("Error leaving group:", error);
      alert(error instanceof Error ? error.message : "Gruptan ayrılırken bir hata oluştu");
    } finally {
      setRemovingUserId(null);
    }
  };

  // ...existing loading and error states...

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Grup Üyeleri</h1>
          <p className="text-gray-600 dark:text-gray-300">{groupName}</p>
        </div>

        <div className="flex gap-2">
          {isAdmin && (
            <Link href={`/groups/${groupId}/invite`} className="btn btn-primary flex items-center">
              <UserPlus className="h-4 w-4 mr-2" />
              Üye Davet Et
            </Link>
          )}

          <Link
            href={ROUTES.GROUP_DETAIL(groupId)}
            className="btn bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200"
          >
            Gruba Dön
          </Link>

          {/* Leave Group Button */}
          {user && (
            <button onClick={handleLeaveGroup} className="btn btn-danger flex items-center" disabled={!!removingUserId}>
              <LogOut className="h-4 w-4 mr-2" />
              Gruptan Ayrıl
            </button>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold flex items-center">
            <User className="h-5 w-5 mr-2" />
            Üyeler ({members.length})
          </h2>
        </div>

        {members.length === 0 ? (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">Bu grupta henüz üye bulunmuyor.</div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {members.map((member) => (
              <li key={member.id} className="p-6 flex items-center justify-between">
                <div className="flex items-start">
                  <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-medium">
                    {(member.full_name || member.username || "").charAt(0).toUpperCase()}
                  </div>
                  <div className="ml-4">
                    <div className="font-medium flex items-center">
                      {member.full_name || member.username}
                      {member.role === "admin" && (
                        <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200 text-xs rounded-full flex items-center">
                          <Shield className="h-3 w-3 mr-1" />
                          Yönetici
                        </span>
                      )}
                      {user && member.user_id === Number(user.id) && (
                        <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 text-xs rounded-full">
                          Siz
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                      <Mail className="h-3 w-3 mr-1" />
                      {member.email}
                    </div>
                  </div>
                </div>

                {/* Remove member button - only for admins and not themselves */}
                {isAdmin && user && member.user_id !== Number(user.id) && (
                  <button
                    onClick={() => handleRemoveMember(member.user_id)}
                    className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                    title="Üyeyi çıkar"
                    disabled={removingUserId === member.user_id.toString()}
                  >
                    {removingUserId === member.user_id.toString() ? (
                      <span className="animate-spin inline-block h-5 w-5 border-2 border-t-red-500 border-red-200 rounded-full"></span>
                    ) : (
                      <X className="h-5 w-5" />
                    )}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
