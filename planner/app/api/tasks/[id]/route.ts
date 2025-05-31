import { getTaskById, updateTask, deleteTask, getUserById, initDB, isGroupMember } from "@/lib/db";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { ApiResponse, Task } from "@/types";

// Get a specific task by ID
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await initDB();

    // Resolve the params
    const resolvedParams = await Promise.resolve(params);
    const taskId = resolvedParams.id;

    // Check authentication
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId");

    if (!userId?.value) {
      return NextResponse.json({ success: false, message: "Yetkilendirme başarısız", data: null }, { status: 401 });
    }

    const user = await getUserById(userId.value);

    if (!user) {
      return NextResponse.json({ success: false, message: "Kullanıcı bulunamadı", data: null }, { status: 401 });
    }

    // Get the task
    const task = await getTaskById(taskId);

    if (!task) {
      return NextResponse.json({ success: false, message: "Görev bulunamadı", data: null }, { status: 404 });
    }

    // Check if the user is a member of the task's group
    const isMember = await isGroupMember(task.group_id, userId.value);

    if (!isMember) {
      return NextResponse.json(
        { success: false, message: "Bu göreve erişim izniniz yok", data: null },
        { status: 403 }
      );
    }

    const response: ApiResponse<Task> = {
      success: true,
      data: task,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Görev alınırken hata:", error);

    return NextResponse.json(
      { success: false, message: "Görev alınırken bir hata oluştu", data: null },
      { status: 500 }
    );
  }
}

// Update a task
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await initDB();

    // Resolve the params
    const resolvedParams = await Promise.resolve(params);
    const taskId = resolvedParams.id;

    // Check authentication
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId");

    if (!userId?.value) {
      return NextResponse.json({ success: false, message: "Yetkilendirme başarısız", data: null }, { status: 401 });
    }

    const user = await getUserById(userId.value);

    if (!user) {
      return NextResponse.json({ success: false, message: "Kullanıcı bulunamadı", data: null }, { status: 401 });
    }

    // Get the task
    const task = await getTaskById(taskId);

    if (!task) {
      return NextResponse.json({ success: false, message: "Görev bulunamadı", data: null }, { status: 404 });
    }

    // Check if the user is a member of the task's group
    const isMember = await isGroupMember(task.group_id, userId.value);

    if (!isMember) {
      return NextResponse.json(
        { success: false, message: "Bu görevi düzenleme izniniz yok", data: null },
        { status: 403 }
      );
    }

    // Get request body
    const body = await request.json();
    const { title, description, status, priority, due_date, assigned_users } = body;

    // Validate required fields
    if (!title) {
      return NextResponse.json({ success: false, message: "Görev başlığı gereklidir", data: null }, { status: 400 });
    }

    // Update the task
    const updatedTask = await updateTask(taskId, {
      title,
      description,
      status,
      priority,
      due_date,
      assigned_users,
    });

    const response: ApiResponse<Task | null> = {
      success: true,
      message: "Görev başarıyla güncellendi",
      data: updatedTask,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Görev güncellenirken hata:", error);

    return NextResponse.json(
      { success: false, message: "Görev güncellenirken bir hata oluştu", data: null },
      { status: 500 }
    );
  }
}

// Delete a task
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await initDB();

    // Resolve the params
    const resolvedParams = await Promise.resolve(params);
    const taskId = resolvedParams.id;

    // Check authentication
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId");

    if (!userId?.value) {
      return NextResponse.json({ success: false, message: "Yetkilendirme başarısız", data: null }, { status: 401 });
    }

    const user = await getUserById(userId.value);

    if (!user) {
      return NextResponse.json({ success: false, message: "Kullanıcı bulunamadı", data: null }, { status: 401 });
    }

    // Get the task
    const task = await getTaskById(taskId);

    if (!task) {
      return NextResponse.json({ success: false, message: "Görev bulunamadı", data: null }, { status: 404 });
    }

    // Check if the user is a member of the task's group
    const isMember = await isGroupMember(task.group_id, userId.value);

    if (!isMember) {
      return NextResponse.json({ success: false, message: "Bu görevi silme izniniz yok", data: null }, { status: 403 });
    }

    // Delete the task
    const deleted = await deleteTask(taskId);

    if (!deleted) {
      return NextResponse.json(
        { success: false, message: "Görev silinirken bir hata oluştu", data: null },
        { status: 500 }
      );
    }

    const response: ApiResponse<null> = {
      success: true,
      message: "Görev başarıyla silindi",
      data: null,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Görev silinirken hata:", error);

    return NextResponse.json(
      { success: false, message: "Görev silinirken bir hata oluştu", data: null },
      { status: 500 }
    );
  }
}
