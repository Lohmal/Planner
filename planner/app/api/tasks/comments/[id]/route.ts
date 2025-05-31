import { deleteTaskComment, initDB } from "@/lib/db";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await initDB();

    // Get the user ID from cookies
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId");

    if (!userId?.value) {
      return NextResponse.json({ success: false, message: "Yetkilendirme başarısız" }, { status: 401 });
    }

    // Get the comment ID from params
    const resolvedParams = await params;
    const commentId = resolvedParams.id;

    // Delete the comment (this function checks if the user is the author)
    const success = await deleteTaskComment(commentId, userId.value);

    if (!success) {
      return NextResponse.json(
        { success: false, message: "Yorumu silme izniniz yok veya yorum bulunamadı" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Yorum başarıyla silindi",
    });
  } catch (error) {
    console.error("Yorum silinirken hata:", error);
    return NextResponse.json({ success: false, message: "Yorum silinirken bir hata oluştu" }, { status: 500 });
  }
}
