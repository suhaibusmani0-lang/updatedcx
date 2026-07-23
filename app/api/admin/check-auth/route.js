import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/databaseConnection";
import UserModel from "@/models/User.model";

export async function GET() {
  try {
    await connectDB();
    const session = await getSession();

    if (!session) {
      return Response.json(
        { ok: false, message: "Not authenticated", session: null },
        { status: 401 }
      );
    }

    const user = await UserModel.findById(session.userId).select("_id name email role");

    return Response.json({
      ok: true,
      message: "Auth check successful",
      session,
      user: user ? { _id: user._id, name: user.name, email: user.email, role: user.role } : null,
    });
  } catch (error) {
    console.error("[Auth Check]", error);
    return Response.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Auth check failed",
      },
      { status: 500 }
    );
  }
}
