import { connectDB } from "@/lib/databaseConnection";
import UserModel from "@/models/User.model";
import OtpModel from "@/models/Otp.model";
import { sendEmail } from "@/lib/sentMail";
import { forgotPasswordOtpEmail } from "@/email/forgetpassword";

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

    if (!user) {
      return jsonResponse(404, "No account found with this email");
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await OtpModel.deleteMany({ email: normalizedEmail });
    await OtpModel.create({ email: normalizedEmail, otp });

   await sendEmail(
  normalizedEmail,
  "Password Reset OTP",
  forgotPasswordOtpEmail(otp)
);

    return jsonResponse(200, "OTP sent successfully");
  } catch (error) {
    console.error("Forgot password sendotp error:", error);
    return jsonResponse(500, error instanceof Error ? error.message : "Internal Server Error");
  }
}
