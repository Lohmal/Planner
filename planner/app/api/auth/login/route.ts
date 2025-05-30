import { authenticateUser } from "@/lib/db";
import { ApiResponse, User } from "@/types";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      const response: ApiResponse<null> = {
        success: false,
        message: "E-posta ve şifre gereklidir",
        data: null,
      };
      return NextResponse.json(response, { status: 400 });
    }

    const user = await authenticateUser(email, password);

    if (!user) {
      const response: ApiResponse<null> = {
        success: false,
        message: "Geçersiz e-posta veya şifre",
        data: null,
      };
      return NextResponse.json(response, { status: 401 });
    }

    // Kullanıcı kimliğini bir çerezde saklayalım
    const cookieStore = await cookies();
    cookieStore.set("userId", user.id.toString(), {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 gün
      sameSite: "strict",
    });

    // Şifre bilgisini kaldıralım
    const { password: _, ...userWithoutPassword } = user;

    const response: ApiResponse<User> = {
      success: true,
      message: "Giriş başarılı",
      data: userWithoutPassword as User,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Giriş sırasında hata:", error);

    const response: ApiResponse<null> = {
      success: false,
      message: "Giriş sırasında bir hata oluştu",
      data: null,
    };

    return NextResponse.json(response, { status: 500 });
  }
}
