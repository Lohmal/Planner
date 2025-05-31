"use client";

import { useState, useEffect } from "react";
import { User, X } from "lucide-react";

interface UserSelectorProps {
  selectedUsers: any[];
  onSelectUsers: (users: any[]) => void;
  availableUsers: any[];
  disabled?: boolean;
}

export default function UserSelector({
  selectedUsers,
  onSelectUsers,
  availableUsers,
  disabled = false,
}: UserSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Filter available users that are not already selected
  useEffect(() => {
    const selectedIds = selectedUsers.map((user) => user.id);
    const filtered = availableUsers
      .filter((user) => !selectedIds.includes(user.id))
      .filter(
        (user) =>
          user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email?.toLowerCase().includes(searchQuery.toLowerCase())
      );

    setFilteredUsers(filtered);
  }, [availableUsers, selectedUsers, searchQuery]);

  const handleAddUser = (user: any) => {
    onSelectUsers([...selectedUsers, user]);
    setSearchQuery("");
    setIsDropdownOpen(false);
  };

  const handleRemoveUser = (userId: number) => {
    onSelectUsers(selectedUsers.filter((user) => user.id !== userId));
  };

  return (
    <div className="relative">
      {/* Selected users */}
      <div className="flex flex-wrap gap-2 mb-3">
        {selectedUsers.map((user) => (
          <div
            key={user.id}
            className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full px-3 py-1 text-sm flex items-center"
          >
            <User className="h-3 w-3 mr-1" />
            <span>{user.full_name || user.username}</span>
            <button
              type="button"
              onClick={() => handleRemoveUser(user.id)}
              disabled={disabled}
              className="ml-1 text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-100"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>

      {/* Search input */}
      <div className="relative">
        <input
          type="text"
          placeholder="Kullanıcı ara..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            if (e.target.value.length > 0) {
              setIsDropdownOpen(true);
            }
          }}
          onFocus={() => setIsDropdownOpen(true)}
          className="input w-full"
          disabled={disabled || availableUsers.length === selectedUsers.length}
        />

        {/* Dropdown */}
        {isDropdownOpen && filteredUsers.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 shadow-lg rounded-md border border-gray-200 dark:border-gray-700 max-h-60 overflow-y-auto">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                onClick={() => handleAddUser(user)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
              >
                <div className="font-medium">{user.full_name || user.username}</div>
                {user.email && <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>}
              </div>
            ))}
          </div>
        )}

        {isDropdownOpen && filteredUsers.length === 0 && searchQuery && (
          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 shadow-lg rounded-md border border-gray-200 dark:border-gray-700 p-2 text-center text-gray-500 dark:text-gray-400">
            Kullanıcı bulunamadı
          </div>
        )}
      </div>

      {/* Click outside to close dropdown */}
      {isDropdownOpen && <div className="fixed inset-0 z-0" onClick={() => setIsDropdownOpen(false)}></div>}
    </div>
  );
}
