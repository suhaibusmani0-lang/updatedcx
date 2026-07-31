import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/databaseConnection";
import UserModel from "@/models/User.model";
import bcrypt from "bcrypt";

function jsonResponse(status, message, data = null) {
  return Response.json({ ok: status < 400, message, data }, { status });
}

export async function PUT(req) {
  try {
    const session = await getSession();
    if (!session?.userId) return jsonResponse(401, "Not authenticated");

    await connectDB();
    const body = await req.json();
    const user = await UserModel.findById(session.userId).select("+password");
    if (!user) return jsonResponse(404, "User not found");

    if (body.name) user.name = body.name;
    if (body.phone !== undefined) user.phone = body.phone;

    if (body.currentPassword && body.newPassword) {
      const valid = await user.comparePassword(body.currentPassword);
      if (!valid) return jsonResponse(400, "Current password is incorrect");
      user.password = await bcrypt.hash(body.newPassword, 10);
    }

    await user.save();

    return jsonResponse(200, "Profile updated", {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
    });
  } catch (error) {
    return jsonResponse(500, error instanceof Error ? error.message : "Internal Server Error");
  }
}
