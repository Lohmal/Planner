import { getSubgroups, createSubgroup, getUserById, isGroupMember, initDB } from "@/lib/db";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { ApiResponse } from "@/types";

// GET implementation for fetching subgroups
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await initDB();

    // Resolve the params
    const resolvedParams = await Promise.resolve(params);
    const groupId = resolvedParams.id;

    // Check authentication
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId");

    if (!userId?.value) {
      return NextResponse.json({ success: false, message: "Yetkilendirme başarısız", data: null }, { status: 401 });
    }

    const user = await getUserById(userId.value);

    if (!user) {
      return NextResponse.json({ success: false, message: "Kullanıcı bulunamadı", data: null }, { status: 401 });
    }

    // Check if the user is a member of the group
    const isMember = await isGroupMember(groupId, userId.value);

    if (!isMember) {
      return NextResponse.json({ success: false, message: "Bu gruba erişim izniniz yok", data: null }, { status: 403 });
    }

    // Get all subgroups of the group
    const subgroups = await getSubgroups(groupId);

    const response: ApiResponse<any[]> = {
      success: true,
      data: subgroups,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Alt gruplar alınırken hata:", error);

    return NextResponse.json(
      { success: false, message: "Alt gruplar alınırken bir hata oluştu", data: null },
      { status: 500 }
    );
  }
}

// POST implementation for creating a subgroup
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await initDB();

    // Get the logged-in user ID from cookies
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId");

    if (!userId?.value) {
      return NextResponse.json({ success: false, message: "Yetkilendirme başarısız", data: null }, { status: 401 });
    }

    const user = await getUserById(userId.value);

    if (!user) {
      return NextResponse.json({ success: false, message: "Kullanıcı bulunamadı", data: null }, { status: 401 });
    }

    // Resolve params
    const resolvedParams = await Promise.resolve(params);
    const groupId = resolvedParams.id;

    // Check if the user is a member of the group
    const isMember = await isGroupMember(groupId, userId.value);

    if (!isMember) {
      return NextResponse.json({ success: false, message: "Bu gruba erişim izniniz yok", data: null }, { status: 403 });
    }

    // Get request body
    const body = await request.json();
    const { name, description } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json({ success: false, message: "Alt grup adı gereklidir", data: null }, { status: 400 });
    }

    // Create the subgroup
    const newSubgroup = await createSubgroup({
      name,
      description,
      group_id: Number(groupId),
      creator_id: Number(userId.value),
    });

    if (!newSubgroup) {
      return NextResponse.json(
        { success: false, message: "Alt grup oluşturulurken bir hata oluştu", data: null },
        { status: 500 }
      );
    }

    const response: ApiResponse<any> = {
      success: true,
      message: "Alt grup başarıyla oluşturuldu",
      data: newSubgroup,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Alt grup oluşturulurken hata:", error);
    return NextResponse.json(
      { success: false, message: "Alt grup oluşturulurken bir hata oluştu", data: null },
      { status: 500 }
    );
  }
}
