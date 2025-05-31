import { getTaskComments, addTaskComment, initDB, isGroupMember, getTaskById } from "@/lib/db";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await initDB();

    // Get the user ID from cookies
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId");

    if (!userId?.value) {
      return NextResponse.json({ success: false, message: "Yetkilendirme başarısız", data: null }, { status: 401 });
    }

    // Get the task ID from params
    const resolvedParams = await params;
    const taskId = resolvedParams.id;

    // Get the task to check permissions
    const task = await getTaskById(taskId);

    if (!task) {
      return NextResponse.json({ success: false, message: "Görev bulunamadı", data: null }, { status: 404 });
    }

    // Check if the user is a member of the group
    const isMember = await isGroupMember(task.group_id, userId.value);

    if (!isMember) {
      return NextResponse.json(
        { success: false, message: "Bu göreve yorum yapma izniniz yok", data: null },
        { status: 403 }
      );
    }

    // Get comments for the task
    const comments = await getTaskComments(taskId);

    return NextResponse.json({
      success: true,
      data: comments,
    });
  } catch (error) {
    console.error("Yorumlar alınırken hata:", error);
    return NextResponse.json(
      { success: false, message: "Yorumlar alınırken bir hata oluştu", data: null },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await initDB();

    // Get the user ID from cookies
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId");

    if (!userId?.value) {
      return NextResponse.json({ success: false, message: "Yetkilendirme başarısız" }, { status: 401 });
    }

    // Get the task ID from params
    const resolvedParams = await params;
    const taskId = resolvedParams.id;

    // Get the task to check permissions
    const task = await getTaskById(taskId);

    if (!task) {
      return NextResponse.json({ success: false, message: "Görev bulunamadı" }, { status: 404 });
    }

    // Check if the user is a member of the group
    const isMember = await isGroupMember(task.group_id, userId.value);

    if (!isMember) {
      return NextResponse.json({ success: false, message: "Bu göreve yorum yapma izniniz yok" }, { status: 403 });
    }

    // Get the comment text from the request body
    const body = await request.json();

    if (!body.comment || typeof body.comment !== "string" || body.comment.trim() === "") {
      return NextResponse.json({ success: false, message: "Yorum metni gereklidir" }, { status: 400 });
    }

    // Add the comment
    const commentId = await addTaskComment({
      task_id: taskId,
      user_id: userId.value,
      comment: body.comment.trim(),
    });

    return NextResponse.json({
      success: true,
      message: "Yorum başarıyla eklendi",
      data: { id: commentId },
    });
  } catch (error) {
    console.error("Yorum eklenirken hata:", error);
    return NextResponse.json({ success: false, message: "Yorum eklenirken bir hata oluştu" }, { status: 500 });
  }
}
