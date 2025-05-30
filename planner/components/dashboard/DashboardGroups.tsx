import { Group } from "@/types";
import Link from "next/link";
import { ROUTES } from "@/types/constants";

export default function DashboardGroups({ groups }: { groups: Group[] }) {
  if (groups.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md text-center">
        <p className="text-gray-500 dark:text-gray-400 mb-4">Henüz bir gruba üye değilsiniz.</p>
        <Link href={ROUTES.GROUP_CREATE} className="btn btn-primary text-sm">
          Grup Oluştur
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      <ul className="divide-y divide-gray-200 dark:divide-gray-700">
        {groups.map((group) => (
          <li key={group.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <Link href={ROUTES.GROUP_DETAIL(group.id)} className="block">
              <div className="flex justify-between">
                <h3 className="font-medium text-gray-900 dark:text-white">{group.name}</h3>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {new Date(group.created_at || "").toLocaleDateString()}
                </span>
              </div>
              {group.description && (
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{group.description}</p>
              )}
            </Link>
          </li>
        ))}
      </ul>
      <div className="p-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
        <Link
          href={ROUTES.GROUPS}
          className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 flex items-center justify-center"
        >
          Tüm Grupları Görüntüle
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
