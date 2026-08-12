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

    const { name, email } = await req.json();
    const normalizedName = typeof name === "string" ? name.trim() : "";
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

    if (normalizedName.length < 2) {
      return NextResponse.json({ success: false, message: "Name must be at least 2 characters" }, { status: 400 });
    }

    if (normalizedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return NextResponse.json({ success: false, message: "Please enter a valid email address" }, { status: 400 });
    }

    await connectDB();
    const user = await UserModel.findById(session.userId);
    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    if (normalizedEmail && normalizedEmail !== user.email) {
      const emailOwner = await UserModel.findOne({
        email: normalizedEmail,
        _id: { $ne: user._id },
      }).select("_id").lean();

      if (emailOwner) {
        return NextResponse.json({ success: false, message: "This email is already linked to another account" }, { status: 409 });
      }

      user.email = normalizedEmail;
      user.isEmailVerified = false;
    }

    user.name = normalizedName;
    user.authProvider = user.authProvider || "mobile";
    await user.save();

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      data: {
        user: {
          id: user._id.toString(),
          phone: user.phone || null,
          name: user.name,
          email: user.email || null,
          role: user.role,
          authProvider: user.authProvider,
          isEmailVerified: user.isEmailVerified,
        },
      },
    });
  } catch (error) {
    console.error("Update Profile Error:", error);
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}
