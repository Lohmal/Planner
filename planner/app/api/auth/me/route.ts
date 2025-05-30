import { getUserById, initDB } from "@/lib/db";
import { ApiResponse, User } from "@/types";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  try {
    await initDB();

    const cookieStore = await cookies();
    const userId = cookieStore.get("userId");

    if (!userId?.value) {
      const response: ApiResponse<null> = {
        success: false,
        message: "Oturum açılmamış",
        data: null,
      };
      return NextResponse.json(response, { status: 401 });
    }

    const user = await getUserById(userId.value);

    if (!user) {
      // Çerez var ama kullanıcı bulunamadı, çerezi temizleyelim
      cookieStore.delete("userId");

      const response: ApiResponse<null> = {
        success: false,
        message: "Kullanıcı bulunamadı",
        data: null,
      };
      return NextResponse.json(response, { status: 401 });
    }

    // Şifre bilgisini kaldıralım
    const { password, ...userWithoutPassword } = user;

    const response: ApiResponse<User> = {
      success: true,
      data: userWithoutPassword as User,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Kullanıcı bilgileri alınırken hata:", error);

    const response: ApiResponse<null> = {
      success: false,
      message: "Kullanıcı bilgileri alınırken bir hata oluştu",
      data: null,
    };

    return NextResponse.json(response, { status: 500 });
  }
}
