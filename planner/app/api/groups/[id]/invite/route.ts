import { createGroupInvitation, isGroupAdmin, getUserByEmail, initDB } from "@/lib/db";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await initDB();

    // Get the user ID from cookies
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId");

    if (!userId?.value) {
      return NextResponse.json({ success: false, message: "Yetkilendirme başarısız" }, { status: 401 });
    }

    // Check if user is group admin
    const isAdmin = await isGroupAdmin(params.id, userId.value);

    if (!isAdmin) {
      return NextResponse.json({ success: false, message: "Bu işlem için yetkiniz yok" }, { status: 403 });
    }

    // Get email from request body
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ success: false, message: "E-posta adresi gereklidir" }, { status: 400 });
    }

    // Get user by email
    const invitedUser = await getUserByEmail(email);

    if (!invitedUser) {
      return NextResponse.json(
        { success: false, message: "Bu e-posta adresiyle kayıtlı kullanıcı bulunamadı" },
        { status: 404 }
      );
    }

    // Create invitation
    const invitationId = await createGroupInvitation({
      group_id: params.id,
      user_id: invitedUser.id,
      invited_by: userId.value,
    });

    if (!invitationId) {
      return NextResponse.json({ success: false, message: "Davet oluşturulurken bir hata oluştu" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Davet başarıyla gönderildi",
    });
  } catch (error) {
    console.error("Grup daveti gönderilirken hata:", error);
    return NextResponse.json({ success: false, message: "Grup daveti gönderilirken bir hata oluştu" }, { status: 500 });
  }
}
