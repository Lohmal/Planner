import { getNotifications, getUnreadNotificationsCount, initDB } from "@/lib/db";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    await initDB();

    // Get the user ID from cookies
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId");

    if (!userId?.value) {
      return NextResponse.json({ success: false, message: "Yetkilendirme başarısız", data: null }, { status: 401 });
    }

    // Get notifications for the user
    const notifications = await getNotifications(userId.value);
    const unreadCount = await getUnreadNotificationsCount(userId.value);

    return NextResponse.json({
      success: true,
      data: {
        notifications,
        unreadCount,
      },
    });
  } catch (error) {
    console.error("Bildirimler alınırken hata:", error);
    return NextResponse.json(
      { success: false, message: "Bildirimler alınırken bir hata oluştu", data: null },
      { status: 500 }
    );
  }
}
