import { ApiResponse } from "@/types";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("userId");

    const response: ApiResponse<null> = {
      success: true,
      message: "Çıkış başarılı",
      data: null,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Çıkış sırasında hata:", error);

    const response: ApiResponse<null> = {
      success: false,
      message: "Çıkış sırasında bir hata oluştu",
      data: null,
    };

    return NextResponse.json(response, { status: 500 });
  }
}
