import {
  getSubgroupById,
  updateSubgroup,
  deleteSubgroup,
  isGroupMember,
  getUserById,
  initDB,
  isGroupAdmin,
} from "@/lib/db";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

// GET - Fetch a subgroup by ID
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

// PUT - Update a subgroup
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
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

    // Get the subgroup ID from params
    const resolvedParams = await params;
    const subgroupId = resolvedParams.id;

    // Get current subgroup details
    const subgroup = await getSubgroupById(subgroupId);

    if (!subgroup) {
      return NextResponse.json({ success: false, message: "Alt grup bulunamadı", data: null }, { status: 404 });
    }

    // Check if user is a member of the parent group and is admin or creator
    const isMember = await isGroupMember(subgroup.group_id, userId.value);
    const isAdmin = await isGroupAdmin(subgroup.group_id, userId.value);
    const isCreator = subgroup.creator_id === Number(userId.value);

    if (!isMember) {
      return NextResponse.json(
        { success: false, message: "Bu alt gruba erişim izniniz yok", data: null },
        { status: 403 }
      );
    }

    if (!isAdmin && !isCreator) {
      return NextResponse.json(
        { success: false, message: "Bu alt grubu düzenleme yetkiniz yok", data: null },
        { status: 403 }
      );
    }

    // Get request body
    const body = await request.json();
    const { name, description } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json({ success: false, message: "Alt grup adı gereklidir", data: null }, { status: 400 });
    }

    // Update the subgroup
    const updatedSubgroup = await updateSubgroup(subgroupId, { name, description });

    if (!updatedSubgroup) {
      return NextResponse.json(
        { success: false, message: "Alt grup güncellenirken bir hata oluştu", data: null },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Alt grup başarıyla güncellendi",
      data: updatedSubgroup,
    });
  } catch (error) {
    console.error("Alt grup güncellenirken hata:", error);
    return NextResponse.json(
      { success: false, message: "Alt grup güncellenirken bir hata oluştu", data: null },
      { status: 500 }
    );
  }
}

// DELETE - Delete a subgroup
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await initDB();

    // Get the user ID from cookies
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId");

    if (!userId?.value) {
      return NextResponse.json({ success: false, message: "Yetkilendirme başarısız" }, { status: 401 });
    }

    // Get the subgroup ID from params
    const resolvedParams = await params;
    const subgroupId = resolvedParams.id;

    // Get current subgroup details
    const subgroup = await getSubgroupById(subgroupId);

    if (!subgroup) {
      return NextResponse.json({ success: false, message: "Alt grup bulunamadı" }, { status: 404 });
    }

    // Check if user is admin of the parent group or creator of the subgroup
    const isAdmin = await isGroupAdmin(subgroup.group_id, userId.value);
    const isCreator = subgroup.creator_id === Number(userId.value);

    if (!isAdmin && !isCreator) {
      return NextResponse.json({ success: false, message: "Bu alt grubu silme yetkiniz yok" }, { status: 403 });
    }

    // Delete the subgroup
    const success = await deleteSubgroup(subgroupId);

    if (!success) {
      return NextResponse.json({ success: false, message: "Alt grup silinirken bir hata oluştu" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Alt grup başarıyla silindi",
    });
  } catch (error) {
    console.error("Alt grup silinirken hata:", error);
    return NextResponse.json({ success: false, message: "Alt grup silinirken bir hata oluştu" }, { status: 500 });
  }
}
