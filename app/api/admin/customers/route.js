import { connectDB } from '@/lib/databaseConnection';
import { requireAdmin, jsonRes } from '@/lib/adminMiddleware';
import UserModel from '@/models/User.model';
import bcrypt from 'bcryptjs';

export async function GET(request) {
  const deny = await requireAdmin();
  if (deny) return deny;
  try {
    await connectDB();
    const users = await UserModel.find({ role: 'user', deletedAt: null }).sort({ createdAt: -1 }).select('-password');
    return jsonRes(200, 'Customers fetched', users);
  } catch (e) {
    return jsonRes(500, e instanceof Error ? e.message : String(e));
  }
}

export async function POST(request) {
  const deny = await requireAdmin();
  if (deny) return deny;
  try {
    await connectDB();
    const payload = await request.json();
    const { name, email, phone, password } = payload;
    if (!name || !email) return jsonRes(400, 'Name and email are required');

    const exists = await UserModel.findOne({ email: email.toLowerCase().trim() });
    if (exists) return jsonRes(400, 'Email already exists');

    const hashed = password ? await bcrypt.hash(password, 10) : undefined;

    const user = await UserModel.create({
      name,
      email: email.toLowerCase().trim(),
      phone,
      password: hashed,
      role: 'user',
    });
    return jsonRes(201, 'Customer created', { _id: user._id, name: user.name, email: user.email, phone: user.phone });
  } catch (e) {
    return jsonRes(500, e instanceof Error ? e.message : String(e));
  }
}

export async function PUT(request) {
  const deny = await requireAdmin();
  if (deny) return deny;
  try {
    await connectDB();
    const payload = await request.json();
    const { id, name, email, phone, password, isEmailVerified } = payload;
    if (!id) return jsonRes(400, 'Customer id is required');

    const user = await UserModel.findById(id).select('+password');
    if (!user) return jsonRes(404, 'Customer not found');

    if (name) user.name = name;
    if (email) user.email = email.toLowerCase().trim();
    if (phone) user.phone = phone;
    if (typeof isEmailVerified === 'boolean') user.isEmailVerified = isEmailVerified;
    if (password) user.password = await bcrypt.hash(password, 10);

    await user.save();
    return jsonRes(200, 'Customer updated', { _id: user._id, name: user.name, email: user.email, phone: user.phone });
  } catch (e) {
    return jsonRes(500, e instanceof Error ? e.message : String(e));
  }
}

export async function DELETE(request) {
  const deny = await requireAdmin();
  if (deny) return deny;
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return jsonRes(400, 'Customer id is required');

    const user = await UserModel.findById(id);
    if (!user) return jsonRes(404, 'Customer not found');

    // soft delete
    user.deletedAt = new Date();
    await user.save();
    return jsonRes(200, 'Customer deleted');
  } catch (e) {
    return jsonRes(500, e instanceof Error ? e.message : String(e));
  }
}
