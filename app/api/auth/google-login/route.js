import { connectDB } from "@/lib/databaseConnection";
import UserModel from "@/models/User.model";
import { signToken, setSessionCookie } from "@/lib/auth";

function jsonResponse(status, message, data = null) {
  return Response.json({ ok: status < 400, message, data }, { status });
}

export async function POST(request) {
  try {
    await connectDB();
    const { uid, name, email, avatar } = await request.json();

    if (!uid || !email) {
      return jsonResponse(400, "Google account details are required");
    }

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedName = name?.trim() || "Customer";

    let user = await UserModel.findOne({ email: normalizedEmail });

    if (!user) {
      user = await UserModel.create({
        name: normalizedName,
        email: normalizedEmail,
        password: uid,
        role: "user",
        authProvider: "google",
        googleId: uid,
        avatar: avatar ? { url: avatar, public_id: "" } : undefined,
        isEmailVerified: true,
      });
    } else {
      user.authProvider = user.authProvider || "google";
      user.googleId = user.googleId || uid;
      user.name = user.name || normalizedName;
      user.isEmailVerified = true;
      if (avatar && !user.avatar?.url) {
        user.avatar = { url: avatar, public_id: "" };
      }
      await user.save();
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
        role: user.role,
        avatar: user.avatar,
        authProvider: user.authProvider,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (error) {
    console.error("Google login error:", error);
    return jsonResponse(500, error instanceof Error ? error.message : "Internal server error");
  }
}
