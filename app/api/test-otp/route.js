import { connectDB } from "@/lib/databaseConnection";
import OtpModel from "@/models/Otp.model";

export async function GET() {
  try {
    const conn = await connectDB();
    const dbName = conn.connection.db.databaseName;

    const email = "test@debug.com";
    const otp = "123456";

    await OtpModel.deleteMany({ email });
    const saved = await OtpModel.create({ email, otp });
    const found = await OtpModel.findOne({ email });

    return Response.json({
      ok: true,
      database: dbName,
      collection: OtpModel.collection.name,
      saved: { id: saved._id, email: saved.email, otp: saved.otp, expiresAt: saved.expiresAt },
      found: found ? { email: found.email, otp: found.otp } : null,
    });
  } catch (err) {
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
}
