import { getUserById, getGroups, createGroup, initDB } from "@/lib/db";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { ApiResponse, Group } from "@/types";

// Tüm grupları veya kullanıcının gruplarını getir
export async function GET(request: NextRequest) {
  try {
    await initDB();

    const cookieStore = await cookies();
    const userId = cookieStore.get("userId");

    if (!userId?.value) {
      return NextResponse.json({ success: false, message: "Yetkilendirme başarısız", data: null }, { status: 401 });
    }

    const user = await getUserById(userId.value);

    if (!user) {
      return NextResponse.json({ success: false, message: "Kullanıcı bulunamadı", data: null }, { status: 401 });
    }

    // URL'den user_id parametresini kontrol et
    const url = new URL(request.url);
    const userIdParam = url.searchParams.get("user_id");

    let groups;
    if (userIdParam) {
      // Belirli bir kullanıcının gruplarını getir
      groups = await getGroups();
    } else {
      // Tüm grupları getir
      groups = await getGroups();
    }

    const response: ApiResponse<Group[]> = {
      success: true,
      data: groups,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Gruplar alınırken hata:", error);

    return NextResponse.json(
      { success: false, message: "Gruplar alınırken bir hata oluştu", data: null },
      { status: 500 }
    );
  }
}

// Yeni grup oluştur
export async function POST(request: NextRequest) {
  try {
    await initDB();

    const cookieStore = await cookies();
    const userId = cookieStore.get("userId");

    if (!userId?.value) {
      return NextResponse.json({ success: false, message: "Yetkilendirme başarısız", data: null }, { status: 401 });
    }

    const user = await getUserById(userId.value);

    if (!user) {
      return NextResponse.json({ success: false, message: "Kullanıcı bulunamadı", data: null }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, creator_id } = body;

    // Gerekli alanları kontrol et
    if (!name) {
      return NextResponse.json({ success: false, message: "Grup adı gereklidir", data: null }, { status: 400 });
    }

    // Güvenlik kontrolü: creator_id, giriş yapan kullanıcı ile aynı olmalı
    if (Number(creator_id) !== Number(user.id)) {
      return NextResponse.json({ success: false, message: "Yetkilendirme hatası", data: null }, { status: 403 });
    }

    const newGroup = await createGroup({
      name,
      description,
      creator_id: user.id,
    });

    const response: ApiResponse<Group | null> = {
      success: true,
      message: "Grup başarıyla oluşturuldu",
      data: newGroup,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Grup oluşturulurken hata:", error);

    return NextResponse.json(
      { success: false, message: "Grup oluşturulurken bir hata oluştu", data: null },
      { status: 500 }
    );
  }
}
