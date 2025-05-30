import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { ROUTES } from "@/types/constants";

export default async function Home() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId");

  // Kullanıcı giriş yapmışsa dashboard'a, yapmamışsa login sayfasına yönlendir
  if (userId?.value) {
    redirect(ROUTES.DASHBOARD);
  } else {
    redirect(ROUTES.LOGIN);
  }

  // Bu kısım asla çalışmayacak, ama TypeScript için gerekli
  return null;
}
