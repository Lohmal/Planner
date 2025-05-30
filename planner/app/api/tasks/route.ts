import { getUserById, getGroups, getTasks, createTask, initDB, isGroupMember } from "@/lib/db";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { ApiResponse, Task } from "@/types";

// Tüm görevleri veya filtrelenmiş görevleri getir
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

    // Tüm görevleri getir
    const tasks = await getTasks();

    const response: ApiResponse<Task[]> = {
      success: true,
      data: tasks,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Görevler alınırken hata:", error);

    return NextResponse.json(
      { success: false, message: "Görevler alınırken bir hata oluştu", data: null },
      { status: 500 }
    );
  }
}

// Yeni görev oluştur
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
    const { title, description, status, priority, due_date, group_id, assigned_to, created_by } = body;

    // Gerekli alanları kontrol et
    if (!title || !group_id) {
      return NextResponse.json(
        { success: false, message: "Başlık ve grup ID gereklidir", data: null },
        { status: 400 }
      );
    }

    // Güvenlik kontrolü: created_by, giriş yapan kullanıcı ile aynı olmalı
    if (Number(created_by) !== Number(user.id)) {
      return NextResponse.json({ success: false, message: "Yetkilendirme hatası", data: null }, { status: 403 });
    }

    // Kullanıcının grup üyesi olup olmadığını kontrol et
    const isMember = await isGroupMember(group_id, user.id);
    if (!isMember) {
      return NextResponse.json({ success: false, message: "Bu gruba üye değilsiniz", data: null }, { status: 403 });
    }

    const newTask = await createTask({
      title,
      description,
      status,
      priority,
      due_date,
      group_id,
      assigned_to,
      created_by: user.id,
    });

    const response: ApiResponse<Task | null> = {
      success: true,
      message: "Görev başarıyla oluşturuldu",
      data: newTask,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Görev oluşturulurken hata:", error);

    return NextResponse.json(
      { success: false, message: "Görev oluşturulurken bir hata oluştu", data: null },
      { status: 500 }
    );
  }
}
