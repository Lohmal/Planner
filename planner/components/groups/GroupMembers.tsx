import { GroupMember } from "@/types";

export default function GroupMembers({ members, currentUserId }: { members: GroupMember[]; currentUserId: number }) {
  if (members.length === 0) {
    return <p className="text-center text-gray-500 dark:text-gray-400 py-4">Bu grupta henüz üye bulunmamaktadır.</p>;
  }

  return (
    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
      {members.map((member) => (
        <li key={member.id} className="py-3 flex items-center justify-between">
          <div className="flex items-center">
            <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 flex items-center justify-center mr-3">
              {member.full_name
                ? member.full_name.charAt(0).toUpperCase()
                : member.username?.charAt(0).toUpperCase() || "U"}
            </div>
            <div>
              <p className="font-medium">{member.full_name || member.username || "Bilinmeyen Kullanıcı"}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{member.role === "admin" ? "Yönetici" : "Üye"}</p>
            </div>
          </div>
          {currentUserId === member.user_id && (
            <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 px-2 py-1 rounded">
              Siz
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
