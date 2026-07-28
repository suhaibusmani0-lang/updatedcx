import { connectDB } from "@/lib/databaseConnection";
import { sendEmail } from "@/lib/sentMail";
import { emailVerificationLink } from "@/email/emailVerificationLink";
import { z } from "zod";
import bcrypt from "bcrypt";
import crypto from "node:crypto";

const validatedSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .max(16, "Phone number is too long"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

function jsonResponse(status, message, data = null) {
  return Response.json({ ok: status < 400, message, data }, { status });
}

function getErrorStatus(error) {
  const message = error instanceof Error ? error.message : String(error);

  if (/MongoDB|MONGODB_URI/i.test(message)) {
    return 503;
  }

  return 500;
}

export async function POST(request) {
  try {
    await connectDB();

    const payload = await request.json();
    const validatedData = validatedSchema.safeParse(payload);

    if (!validatedData.success) {
      return jsonResponse(400, validatedData.error.errors[0].message);
    }

    const { name, phone, email, password } = validatedData.data;

    const UserModel = (await import("@/models/User.model")).default;

    const existingUser = await UserModel.findOne({
      $or: [{ email }, { phone: phone.trim() }],
    });

    if (existingUser) {
      return jsonResponse(400, "A user with this email or phone number already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const verificationToken = crypto.randomUUID();
    const verificationUrl = `${process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || "/"}/auth/verify-email?token=${verificationToken}&email=${encodeURIComponent(email)}`;

    const newUser = await UserModel.create({
      name,
      phone: phone.trim(),
      email,
      password: hashedPassword,
      role: "user",
      emailVerificationToken: verificationToken,
      emailVerificationExpires: Date.now() + 60 * 60 * 1000,
    });

    try {
      await sendEmail(
        email,
        "Verify your email address",
        emailVerificationLink(verificationUrl)
      );
    } catch (mailError) {
      console.error("Verification email failed:", mailError);
      return jsonResponse(201, "User registered successfully, but verification email could not be sent. Please try again later.", {
        id: newUser._id,
        email: newUser.email,
        verificationEmailSent: false,
      });
    }

    return jsonResponse(201, "User registered successfully. Please check your email to verify your account.", {
      id: newUser._id,
      email: newUser.email,
    });
  } catch (error) {
    console.error("Registration Error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return jsonResponse(getErrorStatus(error), message);
  }
}