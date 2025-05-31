import { searchUsers, initDB } from "@/lib/db";
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

    // Get search query from URL parameters
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q") || "";

    if (!query || query.length < 2) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    // Get exclude list from URL parameters (comma-separated)
    const excludeParam = searchParams.get("exclude") || "";
    const excludeUserIds = excludeParam ? excludeParam.split(",") : [];

    // Exclude current user by default
    if (!excludeUserIds.includes(userId.value)) {
      excludeUserIds.push(userId.value);
    }

    // Search users
    const users = await searchUsers(query, excludeUserIds);

    return NextResponse.json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error("Kullanıcı araması yapılırken hata:", error);
    return NextResponse.json(
      { success: false, message: "Kullanıcı araması yapılırken bir hata oluştu", data: null },
      { status: 500 }
    );
  }
}
