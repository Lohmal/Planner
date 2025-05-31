import { getSubgroupById, isGroupMember, initDB } from "@/lib/db";
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

    // Get the subgroup ID from params
    const resolvedParams = await params;
    const subgroupId = resolvedParams.id;

    // Get subgroup details
    const subgroup = await getSubgroupById(subgroupId);

    if (!subgroup) {
      return NextResponse.json({ success: false, message: "Alt grup bulunamadı", data: null }, { status: 404 });
    }

    // Check if the user is a member of the parent group
    const isMember = await isGroupMember(subgroup.group_id, userId.value);

    if (!isMember) {
      return NextResponse.json(
        { success: false, message: "Bu alt gruba erişim izniniz yok", data: null },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: subgroup,
    });
  } catch (error) {
    console.error("Alt grup bilgileri alınırken hata:", error);
    return NextResponse.json(
      { success: false, message: "Alt grup bilgileri alınırken bir hata oluştu", data: null },
      { status: 500 }
    );
  }
}
