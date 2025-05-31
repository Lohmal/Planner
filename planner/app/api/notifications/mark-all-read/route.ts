import { markAllNotificationsAsRead, initDB } from "@/lib/db";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    await initDB();

    // Get the user ID from cookies
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId");

    if (!userId?.value) {
      return NextResponse.json({ success: false, message: "Yetkilendirme başarısız" }, { status: 401 });
    }

    // Mark all notifications as read
    await markAllNotificationsAsRead(userId.value);

    return NextResponse.json({
      success: true,
      message: "Tüm bildirimler okundu olarak işaretlendi",
    });
  } catch (error) {
    console.error("Bildirimler okundu olarak işaretlenirken hata:", error);
    return NextResponse.json(
      { success: false, message: "Bildirimler işaretlenirken bir hata oluştu" },
      { status: 500 }
    );
  }
}
