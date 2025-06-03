import { getUserById, initDB, isGroupAdmin, updateGroupMemberRole } from "@/lib/db";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(request: NextRequest, { params }: { params: { id: string; userId: string } }) {
  try {
    await initDB();

    // Get the logged-in user ID from cookies
    const cookieStore = await cookies();
    const currentUserId = cookieStore.get("userId");

    if (!currentUserId?.value) {
      return NextResponse.json({ success: false, message: "Yetkilendirme başarısız" }, { status: 401 });
    }

    // Resolve params
    const resolvedParams = await params;
    const groupId = resolvedParams.id;
    const targetUserId = resolvedParams.userId;

    // Check if the current user is an admin
    const isAdmin = await isGroupAdmin(groupId, currentUserId.value);

    if (!isAdmin) {
      return NextResponse.json(
        { success: false, message: "Üye rollerini değiştirmek için yönetici olmanız gerekiyor." },
        { status: 403 }
      );
    }

    // Get request body to determine the new role
    const body = await request.json();
    const { role } = body;

    if (!role || (role !== "admin" && role !== "member")) {
      return NextResponse.json(
        { success: false, message: "Geçerli bir rol belirtilmedi ('admin' veya 'member')." },
        { status: 400 }
      );
    }

    // Prevent self-demotion
    if (currentUserId.value === targetUserId && role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Kendinizi yönetici rolünden çıkaramazsınız." },
        { status: 400 }
      );
    }

    // Update the member's role
    const success = await updateGroupMemberRole(groupId, targetUserId, role);

    if (!success) {
      return NextResponse.json(
        { success: false, message: "Üye rolü güncellenirken bir hata oluştu." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: role === "admin" ? "Kullanıcı başarıyla yönetici yapıldı." : "Kullanıcı başarıyla normal üye yapıldı.",
    });
  } catch (error) {
    console.error("Üye rolü güncellenirken hata:", error);
    return NextResponse.json({ success: false, message: "Üye rolü güncellenirken bir hata oluştu." }, { status: 500 });
  }
}
