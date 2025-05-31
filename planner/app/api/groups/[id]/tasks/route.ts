import { getTasksByGroupId, getUserById, initDB, isGroupMember } from "@/lib/db";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { ApiResponse, Task } from "@/types";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await initDB();

    // Resolve the params
    const resolvedParams = await Promise.resolve(params);
    const groupId = resolvedParams.id;

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

    // Check if the user is a member of the group
    const isMember = await isGroupMember(groupId, userId.value);

    if (!isMember) {
      return NextResponse.json({ success: false, message: "Bu gruba erişim izniniz yok", data: null }, { status: 403 });
    }

    // Get all tasks of the group
    const tasks = await getTasksByGroupId(groupId);

    const response: ApiResponse<Task[]> = {
      success: true,
      data: tasks,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Grup görevleri alınırken hata:", error);

    return NextResponse.json(
      { success: false, message: "Grup görevleri alınırken bir hata oluştu", data: null },
      { status: 500 }
    );
  }
}
