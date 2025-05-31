import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { initDB, getUserById, getDB } from "@/lib/db";
import bcrypt from "bcryptjs";
import { ApiResponse, User } from "@/types";

// Get the current user's profile
export async function GET(request: NextRequest) {
  try {
    await initDB();

    // Get user ID from cookies
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId");

    if (!userId?.value) {
      return NextResponse.json({ success: false, message: "Yetkilendirme başarısız", data: null }, { status: 401 });
    }

    const user = await getUserById(userId.value);

    if (!user) {
      return NextResponse.json({ success: false, message: "Kullanıcı bulunamadı", data: null }, { status: 404 });
    }

    // Remove sensitive data before sending
    const { password, ...userWithoutPassword } = user;

    const response: ApiResponse<Omit<User, "password">> = {
      success: true,
      data: userWithoutPassword,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Profil bilgileri alınırken hata:", error);
    return NextResponse.json(
      { success: false, message: "Profil bilgileri alınırken bir hata oluştu", data: null },
      { status: 500 }
    );
  }
}

// Update the current user's profile
export async function PUT(request: NextRequest) {
  try {
    await initDB();

    // Get user ID from cookies
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId");

    if (!userId?.value) {
      return NextResponse.json({ success: false, message: "Yetkilendirme başarısız", data: null }, { status: 401 });
    }

    const user = await getUserById(userId.value);

    if (!user) {
      return NextResponse.json({ success: false, message: "Kullanıcı bulunamadı", data: null }, { status: 404 });
    }

    // Get request body
    const body = await request.json();

    // Validate username
    if (!body.username || body.username.length < 3) {
      return NextResponse.json(
        { success: false, message: "Kullanıcı adı en az 3 karakter olmalıdır", data: null },
        { status: 400 }
      );
    }

    // Check if username is already taken (if changing)
    if (body.username !== user.username) {
      const db = await getDB();
      const existingUser = await db.get("SELECT * FROM users WHERE username = ? AND id != ?", [
        body.username,
        userId.value,
      ]);

      if (existingUser) {
        return NextResponse.json(
          { success: false, message: "Bu kullanıcı adı zaten kullanılıyor", data: null },
          { status: 400 }
        );
      }
    }

    // Update the user in the database
    const db = await getDB();

    // Construct the SQL based on what fields are being updated
    const fieldsToUpdate: string[] = [];
    const params: any[] = [];

    if (body.username !== user.username) {
      fieldsToUpdate.push("username = ?");
      params.push(body.username);
    }

    if (body.full_name !== user.full_name) {
      fieldsToUpdate.push("full_name = ?");
      params.push(body.full_name || null);
    }

    // If changing password, verify current password and hash new password
    if (body.current_password && body.new_password) {
      // Verify current password
      if (!user.password) {
        return NextResponse.json(
          { success: false, message: "Kullanıcı şifresi bulunamadı", data: null },
          { status: 400 }
        );
      }

      const isPasswordValid = await bcrypt.compare(body.current_password, user.password);

      if (!isPasswordValid) {
        return NextResponse.json({ success: false, message: "Mevcut şifre doğru değil", data: null }, { status: 400 });
      }

      // Validate new password
      if (body.new_password.length < 6) {
        return NextResponse.json(
          { success: false, message: "Yeni şifre en az 6 karakter olmalıdır", data: null },
          { status: 400 }
        );
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(body.new_password, 10);
      fieldsToUpdate.push("password = ?");
      params.push(hashedPassword);
    }

    if (fieldsToUpdate.length === 0) {
      // No changes to make
      return NextResponse.json({
        success: true,
        message: "Profil bilgileri güncellendi",
        data: user,
      });
    }

    // Add the user ID to params
    params.push(userId.value);

    // Perform the update
    await db.run(`UPDATE users SET ${fieldsToUpdate.join(", ")} WHERE id = ?`, params);

    // Get the updated user
    const updatedUser = await getUserById(userId.value);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = updatedUser as User;

    return NextResponse.json({
      success: true,
      message: "Profil bilgileri güncellendi",
      data: userWithoutPassword,
    });
  } catch (error) {
    console.error("Profil güncellenirken hata:", error);
    return NextResponse.json(
      { success: false, message: "Profil güncellenirken bir hata oluştu", data: null },
      { status: 500 }
    );
  }
}
