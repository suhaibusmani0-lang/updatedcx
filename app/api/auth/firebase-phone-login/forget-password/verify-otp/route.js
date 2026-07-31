import { connectDB } from "@/lib/databaseConnection";
import OtpModel from "@/models/Otp.model";

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
    });

    if (!record) {
      return jsonResponse(400, "Invalid or expired OTP");
    }

    await OtpModel.deleteMany({ email: normalizedEmail });

    return jsonResponse(200, "OTP verified successfully", { email: normalizedEmail });
  } catch (error) {
    console.error("Forgot password OTP verify error:", error);
    return jsonResponse(500, error instanceof Error ? error.message : "Internal Server Error");
  }
}
