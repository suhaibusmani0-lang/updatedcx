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
        name: normalizedName === normalizedPhone ? "Customer" : normalizedName,
        phone: normalizedPhone,
        role: "user",
        authProvider: "mobile",
        isEmailVerified: false,
      });
    } else {
      user.authProvider = "mobile";
      // Older phone accounts used a fake Firebase email. Remove it so the
      // account page never presents synthetic contact information.
      if (user.email && user.email.endsWith("@firebase.local")) {
        user.email = undefined;
        user.markModified("email");
      }
      if (!user.name || user.name === "Customer") {
        user.name = normalizedName === normalizedPhone ? "Customer" : normalizedName;
      }
      await user.save();
    }

    const tokenPayload = {
      userId: user._id.toString(),
      name: user.name,
      role: user.role,
      authProvider: "mobile",
    };
    if (user.email) tokenPayload.email = user.email;

    const token = await signToken(tokenPayload);

    await setSessionCookie(token);

    return jsonResponse(200, "Logged in successfully", {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email || null,
        phone: user.phone || null,
        role: user.role,
        authProvider: user.authProvider,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (error) {
    console.error("Firebase phone login error:", error);
    return jsonResponse(500, error instanceof Error ? error.message : "Internal server error");
  }
}
