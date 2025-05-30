import { getKisiById, updateKisi, deleteKisi, isEmailUnique, initDB } from "@/lib/db";
import { ApiResponse, Kisi } from "@/types";
import { NextRequest, NextResponse } from "next/server";

// Belirli bir kişiyi al
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Await the params object before accessing its properties
    const resolvedParams = await Promise.resolve(params);
    const id = resolvedParams.id;

    await initDB();
    const kisi = await getKisiById(id);

    if (!kisi) {
      const errorResponse: ApiResponse<null> = {
        success: false,
        message: "Kişi bulunamadı",
        data: null,
      };

      return NextResponse.json(errorResponse, { status: 404 });
    }

    const response: ApiResponse<Kisi> = {
      success: true,
      data: kisi,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Kişi alınırken hata:", error);

    const errorResponse: ApiResponse<null> = {
      success: false,
      message: "Kişi alınırken bir hata oluştu",
      data: null,
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// Kişiyi güncelle
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Await the params object before accessing its properties
    const resolvedParams = await Promise.resolve(params);
    const id = resolvedParams.id;

    const body = await request.json();
    const { ad, soyad, email, telefon, adres, notlar } = body;

    await initDB();

    // Kişinin var olup olmadığını kontrol et
    const existingKisi = await getKisiById(id);
    if (!existingKisi) {
      const errorResponse: ApiResponse<null> = {
        success: false,
        message: "Güncellenecek kişi bulunamadı",
        data: null,
      };

      return NextResponse.json(errorResponse, { status: 404 });
    }

    // E-posta adresinin benzersiz olup olmadığını kontrol et (kendi e-postası hariç)
    const isUnique = await isEmailUnique(email, id);
    if (!isUnique) {
      const errorResponse: ApiResponse<null> = {
        success: false,
        message: "Bu e-posta adresi başka bir kişi tarafından kullanılıyor",
        data: null,
      };

      return NextResponse.json(errorResponse, { status: 400 });
    }

    const updatedKisiData: Kisi = {
      ad,
      soyad,
      email,
      telefon,
      adres,
      notlar,
    };

    const updatedKisi = await updateKisi(id, updatedKisiData);

    const response: ApiResponse<Kisi | null> = {
      success: true,
      data: updatedKisi,
      message: "Kişi başarıyla güncellendi",
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Kişi güncellenirken hata:", error);

    const errorResponse: ApiResponse<null> = {
      success: false,
      message: "Kişi güncellenirken bir hata oluştu",
      data: null,
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// Kişiyi sil
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Await the params object before accessing its properties
    const resolvedParams = await Promise.resolve(params);
    const id = resolvedParams.id;

    await initDB();

    // Kişinin var olup olmadığını kontrol et
    const existingKisi = await getKisiById(id);
    if (!existingKisi) {
      const errorResponse: ApiResponse<null> = {
        success: false,
        message: "Silinecek kişi bulunamadı",
      };

      return NextResponse.json(errorResponse, { status: 404 });
    }

    await deleteKisi(id);

    const response: ApiResponse<null> = {
      success: true,
      message: "Kişi başarıyla silindi",
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Kişi silinirken hata:", error);

    const errorResponse: ApiResponse<null> = {
      success: false,
      message: "Kişi silinirken bir hata oluştu",
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}
