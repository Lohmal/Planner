import { removeGroupMemberAndCleanup, isGroupAdmin, getUserById, initDB } from "@/lib/db";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(request: NextRequest, { params }: { params: { id: string; userId: string } }) {
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

    // Check if the current user is the same as the target user (leaving group)
    const isSelfRemoval = currentUserId.value === targetUserId;

    // If not self-removal, check if the current user is an admin
    if (!isSelfRemoval) {
      const isAdmin = await isGroupAdmin(groupId, currentUserId.value);

      if (!isAdmin) {
        return NextResponse.json(
          { success: false, message: "Grup üyelerini çıkarmak için yönetici olmanız gerekiyor." },
          { status: 403 }
        );
      }
    }

    // Remove the member and their task assignments
    // Fix: Pass undefined instead of null when it's self-removal
    const removedBy = isSelfRemoval ? undefined : currentUserId.value;
    const success = await removeGroupMemberAndCleanup(groupId, targetUserId, removedBy);

    if (!success) {
      return NextResponse.json(
        {
          success: false,
          message: isSelfRemoval
            ? "Gruptan ayrılırken bir hata oluştu."
            : "Kullanıcı gruptan çıkarılırken bir hata oluştu.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: isSelfRemoval ? "Gruptan başarıyla ayrıldınız." : "Kullanıcı gruptan başarıyla çıkarıldı.",
    });
  } catch (error) {
    console.error("Grup üyesi çıkarılırken hata:", error);
    return NextResponse.json({ success: false, message: "Grup üyesi çıkarılırken bir hata oluştu." }, { status: 500 });
  }
}
