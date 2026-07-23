import { connectDB } from "@/lib/databaseConnection";
import UserModel from "@/models/User.model";
import OtpModel from "@/models/Otp.model";
import bcrypt from "bcrypt";
import z from "zod";
import crypto from "crypto";
import { otpEmail } from "@/email/otpEmail";
import { sendEmail } from "@/lib/sentMail";


const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(100),
});

function jsonResponse(status, message, data = null) {
  return Response.json(
    {
      ok: status < 400,
      message,
      data,
    },
    { status }
  );
}

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request) {
  try {
    await connectDB();

    const payload = await request.json();

    const parsed = loginSchema.safeParse(payload);

    if (!parsed.success) {
      return jsonResponse(
        400,
        "Invalid input data",
        parsed.error.flatten()
      );
    }

    const { password } = parsed.data;
    const email = parsed.data.email.toLowerCase().trim();

    const user = await UserModel.findOne({ email }).select("+password");

    if (!user) {
      return jsonResponse(401, "Invalid email or password");
    }

    // Email Verification Check
    if (!user.isEmailVerified) {
      const token = crypto.randomUUID();

      user.emailVerificationToken = token;
      await user.save();

      const verifyUrl =
        `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify-email?token=${token}&email=${encodeURIComponent(
          user.email
        )}`;

      await sendEmail(
        user.email,
        "Verify Your Email",
        `<h2>Email Verification</h2>
         <p>Hello ${user.name},</p>
         <p>Please click the link below to verify your email:</p>
         <a href="${verifyUrl}">Verify Email</a>
         <br><br>
         <p>If the button doesn't work, copy this URL:</p>
         <p>${verifyUrl}</p>`
      );

      return jsonResponse(
        403,
        "Email not verified. A verification email has been sent."
      );
    }

    // Password Check
    const isPasswordValid = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordValid) {
      return jsonResponse(401, "Invalid email or password");
    }

    // Delete Old OTPs
    await OtpModel.deleteMany({ email: user.email });

    // Generate & Save OTP
    const otp = generateOtp();
    const otpRecord = await OtpModel.create({ email: user.email, otp });

    if (!otpRecord) {
      return jsonResponse(500, "Failed to generate OTP. Please try again.");
    }

    // Fire-and-forget: send OTP email without blocking the response
    sendEmail(user.email, "Your Login OTP", otpEmail(otp)).catch((err) =>
      console.error("Failed to send OTP email:", err)
    );

    // Success Response
    return jsonResponse(200, "OTP sent successfully", {
      email: user.email,
      name: user.name,
      requiresOtpVerification: true,
    });
  } catch (error) {
    console.error("Login Error:", error);

    return jsonResponse(
      500,
      error instanceof Error
        ? error.message
        : "Internal Server Error"
    );
  }
}