import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/databaseConnection";
import UserModel from "@/models/User.model";

function jsonResponse(status, message, data = null) {
  return Response.json({ ok: status < 400, message, data }, { status });
}

export async function GET() {
  try {
    const session = await getSession();

    if (!session?.userId) {
      return jsonResponse(401, "Not authenticated");
    }

    await connectDB();

    const user = await UserModel.findById(session.userId)
      .select("name email role avatar isEmailVerified phone addresses authProvider +password");

    if (!user) {
      return jsonResponse(404, "User not found");
    }

    const safeEmail =
      user.email && !user.email.endsWith("@firebase.local")
        ? user.email
        : null;

    return jsonResponse(200, "User fetched", {
      _id: user._id,
      name: user.name,
      email: safeEmail,
      role: user.role,
      avatar: user.avatar,
      isEmailVerified: user.isEmailVerified,
      phone: user.phone || null,
      authProvider: user.authProvider || "email",
      hasPassword: Boolean(user.password),
      addresses: user.addresses || [],
    });
  } catch (error) {
    console.error("Get session error:", error);
    return jsonResponse(500, error instanceof Error ? error.message : "Internal Server Error");
  }
}
