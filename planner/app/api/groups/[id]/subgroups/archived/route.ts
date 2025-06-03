import { getArchivedSubgroups, getGroupById, getUserById, initDB, isGroupMember } from "@/lib/db";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

// GET - Fetch archived subgroups for a group
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

    // Get the group ID from params
    const resolvedParams = await params;
    const groupId = resolvedParams.id;

    // Check if the group exists
    const group = await getGroupById(groupId);
    if (!group) {
      return NextResponse.json({ success: false, message: "Grup bulunamadı", data: null }, { status: 404 });
    }

    // Check if the user is a member of the group
    const isMember = await isGroupMember(groupId, userId.value);
    if (!isMember) {
      return NextResponse.json({ success: false, message: "Bu gruba erişim izniniz yok", data: null }, { status: 403 });
    }

    // Get archived subgroups for the group
    const archivedSubgroups = await getArchivedSubgroups(groupId);

    return NextResponse.json({
      success: true,
      data: archivedSubgroups,
    });
  } catch (error) {
    console.error("Arşivlenmiş alt gruplar alınırken hata:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Arşivlenmiş alt gruplar alınırken bir hata oluştu",
        data: null,
      },
      { status: 500 }
    );
  }
}
