import { NextRequest, NextResponse } from "next/server";
import { getUserByEmail, getDB, initDB } from "@/lib/db";
import bcrypt from "bcryptjs";
import { sendPasswordResetEmail } from "@/lib/email";
import { ApiResponse } from "@/types";

// Rastgele geçici şifre oluşturma fonksiyonu
function generateTempPassword(length = 8): string {
  const charset = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let password = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  return password;
}

export async function POST(request: NextRequest) {
  try {
    await initDB();

    // E-posta adresini al
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          message: "E-posta adresi gereklidir",
          data: null,
        },
        { status: 400 }
      );
    }

    // Kullanıcıyı kontrol et
    const user = await getUserByEmail(email);

    if (!user) {
      // Güvenlik nedeniyle başarılı yanıt verelim ama aslında e-posta göndermeyeceğiz
      return NextResponse.json({
        success: true,
        message: "Şifre sıfırlama talimatları e-posta adresinize gönderilmiştir",
        data: null,
      });
    }

    // Geçici şifre oluştur
    const tempPassword = generateTempPassword(10);

    // Geçici şifreyi hashle
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Veritabanında şifreyi güncelle
    const db = await getDB();
    await db.run("UPDATE users SET password = ? WHERE email = ?", [hashedPassword, email]);

    // E-posta gönder
    const emailSent = await sendPasswordResetEmail(email, tempPassword);

    if (!emailSent) {
      return NextResponse.json(
        {
          success: false,
          message: "E-posta gönderilirken bir hata oluştu",
          data: null,
        },
        { status: 500 }
      );
    }

    const response: ApiResponse<null> = {
      success: true,
      message: "Şifre sıfırlama talimatları e-posta adresinize gönderilmiştir",
      data: null,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Şifre sıfırlama hatası:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Şifre sıfırlama işlemi sırasında bir hata oluştu",
        data: null,
      },
      { status: 500 }
    );
  }
}
