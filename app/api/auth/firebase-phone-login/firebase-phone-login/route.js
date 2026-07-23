import { connectDB } from "@/lib/databaseConnection";
import UserModel from "@/models/User.model";
import { signToken, setSessionCookie } from "@/lib/auth";

function jsonResponse(status, message, data = null) {
  return Response.json({ ok: status < 400, message, data }, { status });
}

export async function POST(request) {
  try {
    await connectDB();
    const { phone, name, uid } = await request.json();

    if (!phone || !uid) {
      return jsonResponse(400, "Phone number and Firebase UID are required");
    }

    const normalizedPhone = phone.trim();
    const normalizedName = name?.trim() || "Customer";

    let user = await UserModel.findOne({ phone: normalizedPhone });

    if (!user) {
      user = await UserModel.create({
        name: normalizedName,
        email: `${uid}@firebase.local`,
        password: uid,
        phone: normalizedPhone,
        isEmailVerified: true,
      });
    }

    const token = await signToken({
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
    });

    await setSessionCookie(token);

    return jsonResponse(200, "Logged in successfully", {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (error) {
    console.error("Firebase phone login error:", error);
    return jsonResponse(500, error instanceof Error ? error.message : "Internal server error");
  }
}
