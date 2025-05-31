import { getGroupById, getUserById, initDB, isGroupMember } from "@/lib/db";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
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

    // Get the group ID from params - Await params before accessing properties
    const resolvedParams = await params;
    const groupId = resolvedParams.id;

    // Check if the user is a member of the group
    const isMember = await isGroupMember(groupId, userId.value);

    if (!isMember) {
      return NextResponse.json({ success: false, message: "Bu gruba erişim izniniz yok", data: null }, { status: 403 });
    }

    // Get group data
    const group = await getGroupById(groupId);

    if (!group) {
      return NextResponse.json({ success: false, message: "Grup bulunamadı", data: null }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: group });
  } catch (error) {
    console.error("Grup bilgileri alınırken hata:", error);
    return NextResponse.json(
      { success: false, message: "Grup bilgileri alınırken bir hata oluştu", data: null },
      { status: 500 }
    );
  }
}
