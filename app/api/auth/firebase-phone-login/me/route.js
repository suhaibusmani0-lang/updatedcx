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
      .select("name email role avatar isEmailVerified phone addresses");

    if (!user) {
      return jsonResponse(404, "User not found");
    }

    return jsonResponse(200, "User fetched", {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      isEmailVerified: user.isEmailVerified,
      phone: user.phone,
      addresses: user.addresses,
    });
  } catch (error) {
    console.error("Get session error:", error);
    return jsonResponse(500, error instanceof Error ? error.message : "Internal Server Error");
  }
}
