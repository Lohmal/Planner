import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <h1 className="text-4xl font-bold mb-4">404 - Sayfa Bulunamadı</h1>
      <p className="mb-6 text-lg">Aradığınız sayfa mevcut değil veya taşınmış olabilir.</p>
      <Link href="/" className="btn btn-primary">
        Ana Sayfaya Dön
      </Link>
    </div>
  );
}
