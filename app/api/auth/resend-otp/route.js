import { connectDB } from "@/lib/databaseConnection";
import UserModel from "@/models/User.model";
import OtpModel from "@/models/Otp.model";
import { sendEmail } from "@/lib/sentMail";
import { otpEmail } from "@/email/otpEmail";

function jsonResponse(status, message, data = null) {
  return Response.json({ ok: status < 400, message, data }, { status });
}

export async function POST(request) {
  try {
    await connectDB();

    const { email } = await request.json();
    if (!email) return jsonResponse(400, "Email is required");

    const normalizedEmail = email.toLowerCase().trim();

    const user = await UserModel.findOne({ email: normalizedEmail });
    if (!user) return jsonResponse(404, "User not found");

    await OtpModel.deleteMany({ email: normalizedEmail });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await OtpModel.create({ email: normalizedEmail, otp });

    await sendEmail(normalizedEmail, "Your Login OTP", otpEmail(otp));

    return jsonResponse(200, "OTP resent successfully");
  } catch (error) {
    return jsonResponse(500, error instanceof Error ? error.message : "Internal Server Error");
  }
}
