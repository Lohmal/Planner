import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  initDB,
  getTaskById,
  getUserById,
  updateTask,
  isGroupAdmin,
  isGroupMember,
  assignTaskToUsers,
  deleteTask,
  getDB,
} from "@/lib/db";
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

    // Get the user ID from cookies
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId");

    if (!userId?.value) {
      return NextResponse.json({ success: false, message: "Yetkilendirme başarısız" }, { status: 401 });
    }

    const user = await getUserById(userId.value);

    if (!user) {
      return NextResponse.json({ success: false, message: "Kullanıcı bulunamadı" }, { status: 401 });
    }

    // Get the task ID from params
    const taskId = params.id;

    // Get current task to check if user has permission
    const currentTask = await getTaskById(taskId);

    if (!currentTask) {
      return NextResponse.json({ success: false, message: "Görev bulunamadı" }, { status: 404 });
    }

    // Check if user is creator or admin of the group
    const isAdmin = await isGroupAdmin(currentTask.group_id, userId.value);
    const isCreator = currentTask.created_by === Number(userId.value);

    if (!isAdmin && !isCreator) {
      return NextResponse.json({ success: false, message: "Bu görevi düzenleme yetkiniz yok" }, { status: 403 });
    }

    // Get request body
    const body = await request.json();

    // Log the received data
    console.log("Received update data:", body);

    // Update the task
    const updatedTask = await updateTask(taskId, {
      title: body.title,
      description: body.description,
      status: body.status,
      priority: body.priority,
      due_date: body.due_date,
      subgroup_id: body.subgroup_id,
    });

    // Handle assigned users separately
    if (body.assigned_users && Array.isArray(body.assigned_users)) {
      console.log("Updating task assignments for users:", body.assigned_users);

      // Get database connection
      const db = await getDB();

      // First remove all existing assignments
      await db.run("DELETE FROM task_assignments WHERE task_id = ?", [taskId]);

      // Then add the new assignments
      if (body.assigned_users.length > 0) {
        await assignTaskToUsers(taskId, body.assigned_users, Number(userId.value));
      }
    }

    return NextResponse.json({
      success: true,
      message: "Görev başarıyla güncellendi",
      data: updatedTask,
    });
  } catch (error) {
    console.error("Görev güncellenirken hata:", error);
    return NextResponse.json({ success: false, message: "Görev güncellenirken bir hata oluştu" }, { status: 500 });
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
