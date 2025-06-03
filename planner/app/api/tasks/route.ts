import {
  getTasks,
  getTasksByGroupId,
  getTasksBySubgroupId,
  getTasksByUserId,
  getUserById,
  initDB,
  isGroupMember,
  isGroupAdmin,
  canCreateTasksInGroup,
  createTask,
} from "@/lib/db";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { ApiResponse, Task } from "@/types";

// Tüm görevleri veya filtrelenmiş görevleri getir
export async function GET(request: NextRequest) {
  try {
    await initDB();

    // Get the user ID from cookies
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId");

    if (!userId?.value) {
      return NextResponse.json({ success: false, message: "Yetkilendirme başarısız", data: null }, { status: 401 });
    }

    const user = await getUserById(userId.value);
    if (!user) {
      return NextResponse.json({ success: false, message: "Kullanıcı bulunamadı", data: null }, { status: 401 });
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const groupId = searchParams.get("groupId");
    const subgroupId = searchParams.get("subgroupId");
    const userTasks = searchParams.get("userTasks") === "true";

    let tasks = [];

    if (groupId) {
      // Verify the user is a member of the group
      const isMember = await isGroupMember(groupId, userId.value);
      if (!isMember) {
        return NextResponse.json(
          { success: false, message: "Bu gruba erişim izniniz yok", data: null },
          { status: 403 }
        );
      }

      // Get tasks specific to this group
      tasks = await getTasksByGroupId(groupId);
    } else if (subgroupId) {
      // For subgroup tasks, we should check if the user is a member of the parent group
      // This would require a helper function to get the group ID from the subgroup ID
      // For now, we'll just fetch the tasks
      tasks = await getTasksBySubgroupId(subgroupId);
    } else if (userTasks) {
      // Get tasks assigned to the user
      tasks = await getTasksByUserId(userId.value);
    } else {
      // Get all tasks the user has access to (limited to their groups)
      tasks = await getTasks();
    }

    return NextResponse.json({
      success: true,
      data: tasks,
    });
  } catch (error) {
    console.error("Görevler alınırken hata:", error);
    return NextResponse.json(
      { success: false, message: "Görevler alınırken bir hata oluştu", data: null },
      { status: 500 }
    );
  }
}

// Yeni görev oluştur (çoklu kullanıcı ataması ile)
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
    const { title, description, status, priority, due_date, group_id, subgroup_id, assigned_users, created_by } = body;

    // Gerekli alanları kontrol et
    if (!title || !group_id) {
      return NextResponse.json(
        { success: false, message: "Başlık ve grup ID gereklidir", data: null },
        { status: 400 }
      );
    }

    // En az bir kullanıcı atanmış mı kontrol et
    if (!assigned_users || !Array.isArray(assigned_users) || assigned_users.length === 0) {
      return NextResponse.json(
        { success: false, message: "En az bir kullanıcı atanmalıdır", data: null },
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

    // Check if the user has permission to create tasks
    const canCreateTasks = await canCreateTasksInGroup(group_id, user.id);
    if (!canCreateTasks) {
      return NextResponse.json(
        { success: false, message: "Bu grupta görev oluşturma yetkiniz yok", data: null },
        { status: 403 }
      );
    }

    const newTask = await createTask({
      title,
      description,
      status,
      priority,
      due_date,
      group_id,
      subgroup_id,
      created_by: user.id,
      assigned_users,
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
