import { deleteNotification, getUserById, initDB } from "@/lib/db";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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

    // Get the notification ID from params - FIX: await params before accessing
    const resolvedParams = await params;
    const notificationId = resolvedParams.id;

    // Delete the notification
    const success = await deleteNotification(notificationId, userId.value);

    if (!success) {
      return NextResponse.json({ success: false, message: "Bildirim silinirken bir hata oluştu" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "Bildirim başarıyla silindi",
    });
  } catch (error) {
    console.error("Bildirim silinirken hata:", error);
    return NextResponse.json({ success: false, message: "Bildirim silinirken bir hata oluştu" }, { status: 500 });
  }
}
