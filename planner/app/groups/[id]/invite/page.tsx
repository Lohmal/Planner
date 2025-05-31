"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import { API_ENDPOINTS, ROUTES } from "@/types/constants";
import Link from "next/link";
import { User } from "@/types";
import { useDebounce } from "@/hooks/useDebounce";
import { UserPlus, Search, X, Mail, CheckCircle } from "lucide-react";

export default function InviteMembersPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = (Array.isArray(params.id) ? params.id[0] : params.id) as string;

  const { user } = useAuth();
  const [groupName, setGroupName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");
  const [invitedEmails, setInvitedEmails] = useState<string[]>([]);
  const [members, setMembers] = useState<any[]>([]);

  useEffect(() => {
    if (groupId) {
      fetchGroupDetails();
      fetchGroupMembers();
    }
  }, [groupId]);

  useEffect(() => {
    if (debouncedSearchTerm && debouncedSearchTerm.length >= 2) {
      searchUsers(debouncedSearchTerm);
    } else {
      setSearchResults([]);
    }
  }, [debouncedSearchTerm]);

  const fetchGroupDetails = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.GROUP_DETAIL(groupId));
      const data = await response.json();

      if (data.success) {
        setGroupName(data.data.name);
      } else {
        setError("Grup bilgileri alınamadı");
      }
    } catch (error) {
      console.error("Error fetching group details:", error);
      setError("Grup bilgileri alınırken bir hata oluştu");
    }
  };

  const fetchGroupMembers = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.GROUP_MEMBERS(groupId));
      const data = await response.json();

      if (data.success) {
        setMembers(data.data);
      }
    } catch (error) {
      console.error("Error fetching group members:", error);
    }
  };

  const searchUsers = async (query: string) => {
    setIsSearching(true);

    try {
      // Get member IDs to exclude from search
      const memberIds = members.map((member) => member.user_id).join(",");

      const response = await fetch(`/api/users/search?q=${query}&exclude=${memberIds}`);
      const data = await response.json();

      if (data.success) {
        setSearchResults(data.data);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error("Error searching users:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const inviteUser = async (email: string) => {
    if (!email || invitedEmails.includes(email)) return;

    setIsSubmitting(true);
    setError("");
    setSuccessMessage("");

    try {
      const response = await fetch(`/api/groups/${groupId}/invite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage(`${email} adresine davet gönderildi`);
        setInvitedEmails([...invitedEmails, email]);
        setEmailInput("");
      } else {
        setError(data.message || "Davet gönderilirken bir hata oluştu");
      }
    } catch (error) {
      console.error("Error inviting user:", error);
      setError("Davet gönderilirken bir hata oluştu");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailInput) {
      inviteUser(emailInput);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Üye Davet Et</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">{groupName}</p>
        </div>
        <Link href={ROUTES.GROUP_MEMBERS(groupId)} className="btn btn-outline">
          Üyelere Dön
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">E-posta ile Davet Gönder</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 dark:bg-red-900/30 dark:text-red-400">
            <p>{error}</p>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 bg-green-50 border-l-4 border-green-500 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            <p>{successMessage}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mb-6">
          <div className="flex items-center">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                className="input pl-10 w-full"
                placeholder="E-posta adresi"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>
            <button
              type="submit"
              className="ml-2 btn btn-primary flex items-center"
              disabled={isSubmitting || !emailInput}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              {isSubmitting ? "Gönderiliyor..." : "Davet Et"}
            </button>
          </div>
        </form>

        {invitedEmails.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Davet Edilenler</h3>
            <div className="flex flex-wrap gap-2">
              {invitedEmails.map((email) => (
                <div
                  key={email}
                  className="flex items-center bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-200 text-sm rounded-full px-3 py-1"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  {email}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Kullanıcı Ara</h2>

        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="input pl-10 w-full"
            placeholder="İsim, kullanıcı adı veya e-posta ile ara"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="absolute inset-y-0 right-0 pr-3 flex items-center" onClick={() => setSearchTerm("")}>
              <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>

        <div className="space-y-3">
          {isSearching ? (
            <div className="text-center py-4">
              <div className="animate-spin inline-block w-6 h-6 border-2 border-t-blue-500 border-blue-200 rounded-full"></div>
              <p className="mt-2 text-gray-500 dark:text-gray-400">Kullanıcılar aranıyor...</p>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="space-y-2">
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <div>
                    <div className="font-medium">{user.full_name || user.username}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                  </div>
                  <button
                    className="btn btn-sm btn-primary flex items-center"
                    onClick={() => inviteUser(user.email)}
                    disabled={isSubmitting || invitedEmails.includes(user.email)}
                  >
                    {invitedEmails.includes(user.email) ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Davet Edildi
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4 mr-1" />
                        Davet Et
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          ) : debouncedSearchTerm.length >= 2 ? (
            <div className="text-center py-6">
              <p className="text-gray-500 dark:text-gray-400">"{debouncedSearchTerm}" için sonuç bulunamadı</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
