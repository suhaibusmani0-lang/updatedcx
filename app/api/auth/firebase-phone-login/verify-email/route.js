import { connectDB } from "@/lib/databaseConnection";
import UserModel from "@/models/User.model";

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");
    const email = searchParams.get("email");

    if (!token || !email || typeof email !== "string" || typeof token !== "string") {
      return Response.json({ ok: false, message: "Invalid verification link" }, { status: 400 });
    }

    if (email.length > 255 || token.length > 255) {
      return Response.json({ ok: false, message: "Invalid verification link" }, { status: 400 });
    }

    // Check if already verified
    const alreadyVerified = await UserModel.findOne({
      email: email.toLowerCase(),
      isEmailVerified: true,
    });

    if (alreadyVerified) {
      return Response.json({ ok: true, message: "Email already verified" }, { status: 200 });
    }

    const user = await UserModel.findOne({
      email: email.toLowerCase(),
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() },
    });

    if (!user) {
      return Response.json({ ok: false, message: "Invalid or expired verification link" }, { status: 400 });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;

    await user.save();

    return Response.json({ ok: true, message: "Email verified successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error verifying email:", error);
    return Response.json({ ok: false, message: "Internal Server Error" }, { status: 500 });
  }
}