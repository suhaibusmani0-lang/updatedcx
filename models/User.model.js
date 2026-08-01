import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
    role: {
        type: String,
        required: true,
        enum: ['user', 'admin'],
        default: 'user'
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        // required: true hataya gaya hai mobile login ke liye
        trim: true,
        lowercase: true,
        unique: true,
        sparse: true // Taaki bina email wale mobile users me duplicate error na aaye
    },
    authProvider: {
        type: String,
        enum: ['email', 'google', 'mobile'], // 'mobile' add kiya gaya hai
        default: 'email'
    },
    googleId: {
        type: String,
        default: undefined,
        unique: true,
        sparse: true
    },
    password: {
        type: String,
        trim: true,
        select: false
    },
    avatar: {
        url: {
            type: String,
            default: ""
        },
        public_id: {
            type: String,
            default: ""
        }
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    phone: {
        type: String,
        trim: true,
        unique: true, // Phone number unique hona chahiye
        sparse: true  // Taaki bina phone wale email users ko error na aaye
    }, 
    addresses: [{
        type: {
            type: String,
            enum: ['Home', 'Office', 'Shipping', 'Billing', 'Other'],
            default: 'Home'
        },
        name: { type: String, required: true },
        phone: { type: String, required: true },
        address: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        pincode: { type: String, required: true },
        isDefault: { type: Boolean, default: false }
    }],
    notifications: [{
        type: { type: String, default: 'general' },
        message: { type: String, required: true },
        meta: { type: mongoose.Schema.Types.Mixed, default: {} },
        read: { type: Boolean, default: false },
    }],
    deletedAt: {
        type: Date,
        default: null,
        index: true
    },
    emailVerificationToken: {
        type: String,
        default: null
    },
    emailVerificationExpires: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

userSchema.methods.comparePassword = async function (password) {
    const bcrypt = await import('bcryptjs');
    return bcrypt.compare(password, this.password);
};

const UserModel = mongoose.models.User || mongoose.model('User', userSchema, 'users');
export default UserModel;