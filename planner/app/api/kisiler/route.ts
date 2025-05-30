import { getKisiler, createKisi, isEmailUnique, initDB } from "@/lib/db";
import { Kisi, ApiResponse } from "@/types";
import { NextRequest, NextResponse } from "next/server";

// Kişi listesini al
export async function GET() {
  try {
    await initDB();
    const kisiler = await getKisiler();

    const response: ApiResponse<Kisi[]> = {
      success: true,
      data: kisiler,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Kişiler alınırken hata:", error);

    const errorResponse: ApiResponse<null> = {
      success: false,
      message: "Kişiler alınırken bir hata oluştu",
      data: null,
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// Yeni kişi ekle
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ad, soyad, email, telefon, adres, notlar } = body;

    await initDB();

    // E-posta adresinin benzersiz olup olmadığını kontrol et
    const isUnique = await isEmailUnique(email);
    if (!isUnique) {
      const errorResponse: ApiResponse<null> = {
        success: false,
        message: "Bu e-posta adresi zaten kullanılıyor",
        data: null,
      };

      return NextResponse.json(errorResponse, { status: 400 });
    }

    const yeniKisi: Kisi = {
      ad,
      soyad,
      email,
      telefon,
      adres,
      notlar,
    };

    const createdKisi = await createKisi(yeniKisi);

    const response: ApiResponse<Kisi | null> = {
      success: true,
      data: createdKisi,
      message: "Kişi başarıyla eklendi",
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Kişi eklenirken hata:", error);

    const errorResponse: ApiResponse<null> = {
      success: false,
      message: "Kişi eklenirken bir hata oluştu",
      data: null,
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}
