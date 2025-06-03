import { getSubgroupById, updateSubgroup, isGroupMember, getUserById, initDB, isGroupAdmin } from "@/lib/db";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

// POST - Archive or unarchive a subgroup
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

    // Get the subgroup ID from params
    const resolvedParams = await params;
    const subgroupId = resolvedParams.id;

    // Get current subgroup details
    const subgroup = await getSubgroupById(subgroupId);

    if (!subgroup) {
      return NextResponse.json({ success: false, message: "Alt grup bulunamadı" }, { status: 404 });
    }

    // Check if user is admin of the parent group or creator of the subgroup
    const isAdmin = await isGroupAdmin(subgroup.group_id, userId.value);
    const isCreator = subgroup.creator_id === Number(userId.value);

    if (!isAdmin && !isCreator) {
      return NextResponse.json(
        { success: false, message: "Bu işlemi gerçekleştirmek için yönetici olmanız gerekiyor" },
        { status: 403 }
      );
    }

    // Get request body to determine if we're archiving or unarchiving
    const body = await request.json();
    const archiveAction = body.archive; // true for archive, false for unarchive

    // Update the subgroup's archive status
    const updatedSubgroup = await updateSubgroup(subgroupId, {
      is_archived: archiveAction,
    });

    if (!updatedSubgroup) {
      return NextResponse.json({ success: false, message: "Alt grup güncellenirken bir hata oluştu" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: archiveAction ? "Alt grup başarıyla arşivlendi" : "Alt grup arşivden çıkarıldı",
      data: updatedSubgroup,
    });
  } catch (error) {
    console.error("Alt grup arşivleme işleminde hata:", error);
    return NextResponse.json(
      { success: false, message: "Alt grup arşivleme işlemi sırasında bir hata oluştu" },
      { status: 500 }
    );
  }
}
