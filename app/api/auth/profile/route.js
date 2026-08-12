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

    const nextName = typeof body.name === "string" ? body.name.trim() : undefined;
    const nextPhone = typeof body.phone === "string" ? body.phone.trim() : body.phone;

    if (nextName !== undefined) {
      if (nextName.length < 2) return jsonResponse(400, "Name must be at least 2 characters");
      user.name = nextName;
    }

    if (nextPhone !== undefined) {
      if (nextPhone && !/^[+0-9\s()-]{10,18}$/.test(nextPhone)) {
        return jsonResponse(400, "Please enter a valid phone number");
      }

      if (nextPhone && nextPhone !== user.phone) {
        const phoneOwner = await UserModel.findOne({
          phone: nextPhone,
          _id: { $ne: user._id },
        }).select("_id").lean();

        if (phoneOwner) return jsonResponse(409, "This phone number is already linked to another account");
      }

      user.phone = nextPhone || undefined;
    }

    if (body.currentPassword || body.newPassword) {
      if (!body.currentPassword || !body.newPassword) {
        return jsonResponse(400, "Current password and new password are required");
      }

      if (!user.password) {
        return jsonResponse(400, "This account does not use a password");
      }

      if (String(body.newPassword).length < 6) {
        return jsonResponse(400, "New password must be at least 6 characters long");
      }

      const valid = await user.comparePassword(body.currentPassword);
      if (!valid) return jsonResponse(400, "Current password is incorrect");

      user.password = await bcrypt.hash(body.newPassword, 10);
    }

    await user.save();

    return jsonResponse(200, "Profile updated", {
      _id: user._id,
      name: user.name,
      email: user.email || null,
      phone: user.phone || null,
      role: user.role,
      authProvider: user.authProvider,
      isEmailVerified: user.isEmailVerified,
      hasPassword: Boolean(user.password),
    });
  } catch (error) {
    return jsonResponse(500, error instanceof Error ? error.message : "Internal Server Error");
  }
}
