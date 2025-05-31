import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { initDB, getUserById, getDB } from "@/lib/db";
import { ApiResponse } from "@/types";

export async function GET(request: NextRequest) {
  try {
    await initDB();

    // Get user ID from cookies
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId");

    if (!userId?.value) {
      return NextResponse.json({ success: false, message: "Yetkilendirme başarısız", data: null }, { status: 401 });
    }

    const user = await getUserById(userId.value);

    if (!user) {
      return NextResponse.json({ success: false, message: "Kullanıcı bulunamadı", data: null }, { status: 404 });
    }

    // Get database connection
    const db = await getDB();

    // Get total tasks assigned to user
    const totalTasksQuery = await db.get(`SELECT COUNT(*) as count FROM task_assignments WHERE user_id = ?`, [
      userId.value,
    ]);
    const totalTasks = totalTasksQuery?.count || 0;

    // Get completed tasks
    const completedTasksQuery = await db.get(
      `SELECT COUNT(*) as count 
       FROM task_assignments ta
       JOIN tasks t ON ta.task_id = t.id
       WHERE ta.user_id = ? AND t.status = 'completed'`,
      [userId.value]
    );
    const completedTasks = completedTasksQuery?.count || 0;

    // Get in-progress tasks
    const inProgressTasksQuery = await db.get(
      `SELECT COUNT(*) as count 
       FROM task_assignments ta
       JOIN tasks t ON ta.task_id = t.id
       WHERE ta.user_id = ? AND t.status = 'in_progress'`,
      [userId.value]
    );
    const inProgressTasks = inProgressTasksQuery?.count || 0;

    // Get pending tasks
    const pendingTasksQuery = await db.get(
      `SELECT COUNT(*) as count 
       FROM task_assignments ta
       JOIN tasks t ON ta.task_id = t.id
       WHERE ta.user_id = ? AND t.status = 'pending'`,
      [userId.value]
    );
    const pendingTasks = pendingTasksQuery?.count || 0;

    // Get number of groups user is a member of
    const groupsQuery = await db.get(`SELECT COUNT(*) as count FROM group_members WHERE user_id = ?`, [userId.value]);
    const groups = groupsQuery?.count || 0;

    const stats = {
      totalTasks,
      completedTasks,
      inProgressTasks,
      pendingTasks,
      groups,
    };

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Kullanıcı istatistikleri alınırken hata:", error);
    return NextResponse.json(
      { success: false, message: "İstatistikler alınırken bir hata oluştu", data: null },
      { status: 500 }
    );
  }
}
