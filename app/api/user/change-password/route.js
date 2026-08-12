import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/databaseConnection";
import UserModel from "@/models/User.model";
import bcrypt from "bcryptjs";

export async function POST(req) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
    }

    await connectDB();

    const { currentPassword, newPassword } = await req.json();
    if (!newPassword || String(newPassword).length < 6) {
      return NextResponse.json({ message: "New password must be at least 6 characters" }, { status: 400 });
    }

    const user = await UserModel.findById(session.userId).select("+password");
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    if (!user.password) {
      return NextResponse.json(
        { message: "This account does not use a password" },
        { status: 400 }
      );
    }

    if (!currentPassword) {
      return NextResponse.json({ message: "Current password is required" }, { status: 400 });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return NextResponse.json({ message: "Incorrect current password" }, { status: 400 });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return NextResponse.json({ success: true, message: "Password updated successfully" }, { status: 200 });
  } catch (error) {
    console.error("Password change error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
