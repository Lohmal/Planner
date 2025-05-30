import { getKisiById, initDB } from "@/lib/db";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ApiResponse, Kisi } from "@/types";

export const dynamic = "force-dynamic";

async function getKisi(id: string) {
  await initDB();
  const kisi = await getKisiById(id);

  if (!kisi) {
    notFound();
  }

  return kisi;
}

export default async function KisiDetay({ params }: { params: { id: string } }) {
  // Await the params object before accessing its properties
  const resolvedParams = await Promise.resolve(params);
  const kisi = await getKisi(resolvedParams.id);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold">Kişi Bilgileri</h1>
        <div className="flex gap-3">
          <Link href="/" className="btn bg-gray-500 hover:bg-gray-600 text-white">
            Listeye Dön
          </Link>
          <Link href={`/kisi/${kisi.id}/duzenle`} className="btn btn-primary">
            Düzenle
          </Link>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-blue-50 dark:bg-blue-900 border-b border-blue-100 dark:border-blue-800">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 dark:bg-blue-800 rounded-full">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-8 h-8 text-blue-600 dark:text-blue-300"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {kisi.ad} {kisi.soyad}
              </h2>
              <p className="text-blue-600 dark:text-blue-300">{kisi.email}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                İletişim Bilgileri
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">E-posta</p>
                  <p className="mt-1 font-medium">{kisi.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Telefon</p>
                  <p className="mt-1 font-medium">{kisi.telefon || "—"}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Adres Bilgileri
              </h3>
              <p className="whitespace-pre-line">{kisi.adres || "—"}</p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Notlar
            </h3>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-4">
              <p className="whitespace-pre-line">{kisi.notlar || "Not bulunmamaktadır."}</p>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Oluşturulma Tarihi</p>
                <p className="mt-1 font-medium">{new Date(kisi.olusturma_tarihi || 0).toLocaleString("tr-TR")}</p>
              </div>

              <div className="flex gap-2">
                <Link
                  href={`/kisi/${kisi.id}/duzenle`}
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 px-3 py-2 bg-blue-50 dark:bg-blue-900 rounded-md"
                >
                  Düzenle
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
