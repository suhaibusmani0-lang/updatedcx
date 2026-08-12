import { connectDB } from "@/lib/databaseConnection";
import OtpModel from "@/models/Otp.model";
import UserModel from "@/models/User.model";
import { signToken, setSessionCookie } from "@/lib/auth";

function jsonResponse(status, message, data = null) {
  return Response.json({ ok: status < 400, message, data }, { status });
}

export async function POST(request) {
  try {
    await connectDB();

    const { email, otp } = await request.json();

    if (!email || !otp) {
      return jsonResponse(400, "Email and OTP are required");
    }

    const normalizedEmail = email.toLowerCase().trim();

    const record = await OtpModel.findOne({
      email: normalizedEmail,
      otp,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!record) {
      return jsonResponse(400, "Invalid or expired OTP");
    }

    // Delete used OTPs
    await OtpModel.deleteMany({ email: normalizedEmail });

    // Fetch user data for JWT payload
    const user = await UserModel.findOne({ email: normalizedEmail }).select("name email role avatar isEmailVerified");

    if (!user) {
      return jsonResponse(404, "User not found");
    }

    // Sign JWT token
    const token = await signToken({
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
    });

    // Set httpOnly cookie
    await setSessionCookie(token);

    return jsonResponse(200, "OTP verified successfully", {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (error) {
    console.error("OTP verification error:", error);
    return jsonResponse(500, error instanceof Error ? error.message : "Internal Server Error");
  }
}
