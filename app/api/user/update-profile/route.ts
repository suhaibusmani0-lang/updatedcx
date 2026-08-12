import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/databaseConnection";
import UserModel from "@/models/User.model";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 });
    }

    const { name, phone } = await req.json();
    const normalizedName = typeof name === "string" ? name.trim() : "";
    const normalizedPhone = typeof phone === "string" ? phone.trim() : "";

    if (normalizedName.length < 2) {
      return NextResponse.json({ success: false, message: "Name must be at least 2 characters" }, { status: 400 });
    }

    await connectDB();
    const user = await UserModel.findById(session.userId);
    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    if (normalizedPhone && normalizedPhone !== user.phone) {
      const phoneOwner = await UserModel.findOne({
        phone: normalizedPhone,
        _id: { $ne: user._id },
      }).select("_id").lean();

      if (phoneOwner) {
        return NextResponse.json({ success: false, message: "This phone number is already linked to another account" }, { status: 409 });
      }
    }

    user.name = normalizedName;
    user.phone = normalizedPhone || undefined;
    await user.save();

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      user: {
        name: user.name,
        phone: user.phone || null,
        email: user.email || null,
        role: user.role,
        authProvider: user.authProvider,
        isEmailVerified: user.isEmailVerified,
      },
    }, { status: 200 });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
