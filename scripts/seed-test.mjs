import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

const MONGODB_URI = 'mongodb://127.0.0.1:27017/cosmopolitan_shop?tls=false';
await mongoose.connect(MONGODB_URI);

const userSchema = new mongoose.Schema({
  role: String,
  name: String,
  email: { type: String, unique: true },
  password: String,
  authProvider: { type: String, default: 'email' },
  isEmailVerified: { type: Boolean, default: true },
  phone: String,
  addresses: Array,
  createdAt: Date,
  updatedAt: Date,
}, { strict: false });
const User = mongoose.models.User || mongoose.model('User', userSchema, 'users');

const categorySchema = new mongoose.Schema({}, { strict: false });
const Category = mongoose.models.Category || mongoose.model('Category', categorySchema, 'categories');

const productSchema = new mongoose.Schema({}, { strict: false });
const Product = mongoose.models.Product || mongoose.model('Product', productSchema, 'products');

// Seed a customer
const passHash = await bcrypt.hash('User@123', 10);
await User.findOneAndUpdate(
  { email: 'customer@example.com' },
  {
    email: 'customer@example.com',
    name: 'Test Customer',
    password: passHash,
    role: 'user',
    authProvider: 'email',
    isEmailVerified: true,
    phone: '9999999999',
    addresses: [{
      type: 'Home',
      name: 'Test Customer',
      phone: '9999999999',
      address: '123 Main Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      isDefault: true,
    }],
  },
  { upsert: true, new: true }
);

// Seed admin
const adminHash = await bcrypt.hash('Admin@123', 10);
await User.findOneAndUpdate(
  { email: 'admin@example.com' },
  {
    email: 'admin@example.com',
    name: 'Admin User',
    password: adminHash,
    role: 'admin',
    authProvider: 'email',
    isEmailVerified: true,
  },
  { upsert: true, new: true }
);

// Seed a category
const cat = await Category.findOneAndUpdate(
  { slug: 'home-decor' },
  { name: 'Home Decor', slug: 'home-decor', isActive: true, isDeleted: false, description: 'Premium home decor items' },
  { upsert: true, new: true }
);

// Seed a product
await Product.findOneAndUpdate(
  { slug: 'test-bakhoor-burner' },
  {
    name: 'Test Bakhoor Burner',
    slug: 'test-bakhoor-burner',
    sku: 'TST-BAK-001',
    description: 'A premium bakhoor burner for testing',
    price: 2999,
    salePrice: 2499,
    category: cat._id,
    images: [{ url: 'https://res.cloudinary.com/dd62irk0g/image/upload/v1782900519/logo-black1_jyozuq.jpg' }],
    stock: 100,
    isActive: true,
    isDeleted: false,
  },
  { upsert: true, new: true }
);

console.log('Seeded successfully');
console.log('Customer:', 'customer@example.com / User@123');
console.log('Admin:', 'admin@example.com / Admin@123');

const p = await Product.findOne({ slug: 'test-bakhoor-burner' });
console.log('Product ID:', p._id.toString());
await mongoose.connection.close();
