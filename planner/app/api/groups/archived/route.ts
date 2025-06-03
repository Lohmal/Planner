import { getArchivedGroupsByUserId, getUserById, initDB } from "@/lib/db";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

// GET - Fetch archived groups for the current user
export async function GET(request: NextRequest) {
  try {
    await initDB();

    // Get the user ID from cookies
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId");

    if (!userId?.value) {
      return NextResponse.json({ success: false, message: "Yetkilendirme başarısız", data: null }, { status: 401 });
    }

    const user = await getUserById(userId.value);
    if (!user) {
      return NextResponse.json({ success: false, message: "Kullanıcı bulunamadı", data: null }, { status: 401 });
    }

    // Get archived groups for the user
    const archivedGroups = await getArchivedGroupsByUserId(userId.value);

    return NextResponse.json({
      success: true,
      groups: archivedGroups, // Return as 'groups' to match the client expectation
    });
  } catch (error) {
    console.error("Arşivlenmiş gruplar alınırken hata:", error);
    return NextResponse.json(
      { success: false, message: "Arşivlenmiş gruplar alınırken bir hata oluştu", data: null },
      { status: 500 }
    );
  }
}
