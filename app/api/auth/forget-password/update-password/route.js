import { connectDB } from "@/lib/databaseConnection";
import UserModel from "@/models/User.model";
import bcrypt from "bcrypt";

function jsonResponse(status, message, data = null) {
  return Response.json({ ok: status < 400, message, data }, { status });
}

export async function PUT(request) {
  try {
    await connectDB();

    const { email, password } = await request.json();

    if (!email || !password) {
      return jsonResponse(400, "Email and password are required");
    }

    if (password.length < 6) {
      return jsonResponse(400, "Password must be at least 6 characters");
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await UserModel.findOne({ email: normalizedEmail }).select("+password");

    if (!user) {
      return jsonResponse(404, "User not found");
    }

    user.password = await bcrypt.hash(password, 10);
    await user.save();

    return jsonResponse(200, "Password updated successfully");
  } catch (error) {
    console.error("Update password error:", error);
    return jsonResponse(500, error instanceof Error ? error.message : "Internal Server Error");
  }
}
