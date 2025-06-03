import { getGroupById, getUserById, initDB, isGroupMember, updateGroup, deleteGroup, isGroupAdmin } from "@/lib/db";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { ApiResponse, Group } from "@/types";

// Get group details
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await initDB();

    // Get the logged-in user ID from cookies
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId");

    if (!userId?.value) {
      return NextResponse.json({ success: false, message: "Yetkilendirme başarısız", data: null }, { status: 401 });
    }

    // Resolve params
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

    const response: ApiResponse<Group> = {
      success: true,
      data: group,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Grup bilgileri alınırken hata:", error);
    return NextResponse.json(
      { success: false, message: "Grup bilgileri alınırken bir hata oluştu", data: null },
      { status: 500 }
    );
  }
}

// Update group
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await initDB();

    // Get the logged-in user ID from cookies
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId");

    if (!userId?.value) {
      return NextResponse.json({ success: false, message: "Yetkilendirme başarısız", data: null }, { status: 401 });
    }

    // Resolve params
    const resolvedParams = await params;
    const groupId = resolvedParams.id;

    // Check if user is an admin of the group
    const isAdmin = await isGroupAdmin(groupId, userId.value);

    if (!isAdmin) {
      return NextResponse.json(
        { success: false, message: "Bu grubu düzenlemek için yönetici olmanız gerekiyor", data: null },
        { status: 403 }
      );
    }

    // Get request body
    const body = await request.json();
    const { name, description, members_can_create_tasks } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json({ success: false, message: "Grup adı gereklidir", data: null }, { status: 400 });
    }

    // Update the group
    const updatedGroup = await updateGroup(groupId, {
      name,
      description,
      members_can_create_tasks,
    });

    if (!updatedGroup) {
      return NextResponse.json(
        { success: false, message: "Grup güncellenirken bir hata oluştu", data: null },
        { status: 400 }
      );
    }

    const response: ApiResponse<Group> = {
      success: true,
      message: "Grup başarıyla güncellendi",
      data: updatedGroup,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Grup güncellenirken hata:", error);
    return NextResponse.json(
      { success: false, message: "Grup güncellenirken bir hata oluştu", data: null },
      { status: 500 }
    );
  }
}

// Delete group
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await initDB();

    // Get the logged-in user ID from cookies
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId");

    if (!userId?.value) {
      return NextResponse.json({ success: false, message: "Yetkilendirme başarısız" }, { status: 401 });
    }

    // Resolve params
    const resolvedParams = await params;
    const groupId = resolvedParams.id;

    // Check if user is an admin of the group
    const isAdmin = await isGroupAdmin(groupId, userId.value);

    if (!isAdmin) {
      return NextResponse.json(
        { success: false, message: "Bu grubu silmek için yönetici olmanız gerekiyor" },
        { status: 403 }
      );
    }

    // Delete the group
    const success = await deleteGroup(groupId);

    if (!success) {
      return NextResponse.json({ success: false, message: "Grup silinirken bir hata oluştu" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "Grup başarıyla silindi",
    });
  } catch (error) {
    console.error("Grup silinirken hata:", error);
    return NextResponse.json({ success: false, message: "Grup silinirken bir hata oluştu" }, { status: 500 });
  }
}
