import { getGroupById, updateGroup, isGroupAdmin, getUserById, initDB } from "@/lib/db";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

// POST - Archive or unarchive a group
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
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

    // Get the group ID from params
    const resolvedParams = await params;
    const groupId = resolvedParams.id;

    // Get current group details
    const group = await getGroupById(groupId);

    if (!group) {
      return NextResponse.json({ success: false, message: "Grup bulunamadı" }, { status: 404 });
    }

    // Check if user is admin of the group
    const isAdmin = await isGroupAdmin(groupId, userId.value);

    if (!isAdmin) {
      return NextResponse.json(
        { success: false, message: "Bu işlemi gerçekleştirmek için yönetici olmanız gerekiyor" },
        { status: 403 }
      );
    }

    // Get request body to determine if we're archiving or unarchiving
    const body = await request.json();
    const archiveAction = body.archive; // true for archive, false for unarchive

    // Update the group's archive status
    const updatedGroup = await updateGroup(groupId, {
      is_archived: archiveAction,
    });

    if (!updatedGroup) {
      return NextResponse.json({ success: false, message: "Grup güncellenirken bir hata oluştu" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: archiveAction ? "Grup başarıyla arşivlendi" : "Grup arşivden çıkarıldı",
      data: updatedGroup,
    });
  } catch (error) {
    console.error("Grup arşivleme işleminde hata:", error);
    return NextResponse.json(
      { success: false, message: "Grup arşivleme işlemi sırasında bir hata oluştu" },
      { status: 500 }
    );
  }
}
