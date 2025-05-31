import { respondToGroupInvitation, initDB } from "@/lib/db";
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

    // Get invitation ID from URL params - Await params first
    const resolvedParams = await params;
    const invitationId = resolvedParams.id;

    // Get response (accepted/rejected) from request body
    const body = await request.json();
    const { response } = body;

    if (response !== "accepted" && response !== "rejected") {
      return NextResponse.json(
        { success: false, message: "Geçersiz yanıt. 'accepted' veya 'rejected' olmalıdır." },
        { status: 400 }
      );
    }

    // Respond to the invitation
    const success = await respondToGroupInvitation(invitationId, response);

    if (!success) {
      return NextResponse.json({ success: false, message: "Davet yanıtı işlenirken bir hata oluştu" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: response === "accepted" ? "Grup davetini kabul ettiniz" : "Grup davetini reddettiniz",
    });
  } catch (error) {
    console.error("Davet yanıtı işlenirken hata:", error);
    return NextResponse.json({ success: false, message: "Davet yanıtı işlenirken bir hata oluştu" }, { status: 500 });
  }
}
