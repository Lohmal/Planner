import { createUser, getUserByEmail, initDB } from "@/lib/db";
import { ApiResponse, User } from "@/types";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    await initDB();

    const body = await request.json();
    const { username, email, password, fullName } = body;

    if (!username || !email || !password) {
      const response: ApiResponse<null> = {
        success: false,
        message: "Kullanıcı adı, e-posta ve şifre gereklidir",
        data: null,
      };
      return NextResponse.json(response, { status: 400 });
    }

    // E-posta adresinin kullanılıp kullanılmadığını kontrol edelim
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      const response: ApiResponse<null> = {
        success: false,
        message: "Bu e-posta adresi zaten kullanılıyor",
        data: null,
      };
      return NextResponse.json(response, { status: 400 });
    }

    const newUser = await createUser({
      username,
      email,
      password,
      full_name: fullName,
    });

    if (!newUser) {
      const response: ApiResponse<null> = {
        success: false,
        message: "Kullanıcı oluşturulurken bir hata oluştu",
        data: null,
      };
      return NextResponse.json(response, { status: 500 });
    }

    const response: ApiResponse<User> = {
      success: true,
      message: "Kullanıcı başarıyla oluşturuldu",
      data: newUser,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Kayıt sırasında hata:", error);

    const response: ApiResponse<null> = {
      success: false,
      message: "Kayıt sırasında bir hata oluştu",
      data: null,
    };

    return NextResponse.json(response, { status: 500 });
  }
}
