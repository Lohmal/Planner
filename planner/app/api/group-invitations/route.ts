import { getGroupInvitations, initDB } from "@/lib/db";
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

    // Get pending invitations for the user
    const invitations = await getGroupInvitations(userId.value);

    return NextResponse.json({
      success: true,
      data: invitations,
    });
  } catch (error) {
    console.error("Grup davetleri alınırken hata:", error);
    return NextResponse.json(
      { success: false, message: "Grup davetleri alınırken bir hata oluştu", data: null },
      { status: 500 }
    );
  }
}
