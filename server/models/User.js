import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const addressSchema = new mongoose.Schema(
  {
    label: { type: String, trim: true, default: 'Home' },
    name: { type: String, trim: true, default: '' },
    phone: { type: String, trim: true, default: '' },
    address: { type: String, trim: true, default: '' },
    city: { type: String, trim: true, default: '' },
    state: { type: String, trim: true, default: '' },
    pincode: { type: String, trim: true, default: '' },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true },
)

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    // Customers log in with this number, so it must be unique when present.
    // Admins/legacy accounts may leave it empty.
    phone: { type: String, trim: true, default: '' },
    phoneVerified: { type: Boolean, default: false },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    verified: { type: Boolean, default: false },
    birthday: { type: String, trim: true, default: '' },
    whatsappUpdates: { type: Boolean, default: true },
    addresses: { type: [addressSchema], default: [] },
  },
  { timestamps: true },
)

userSchema.index(
  { phone: 1 },
  { unique: true, partialFilterExpression: { phone: { $gt: '' } } },
)

userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return
  const salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password, salt)
})

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password)
}

userSchema.methods.toSafeJSON = function toSafeJSON() {
  // Mobile-first accounts get a private placeholder email so the required
  // unique email field stays intact. Never show it to the customer.
  const email = this.email && !this.email.endsWith('@mobile.sabun.local') ? this.email : ''
  return {
    id: this._id.toString(),
    name: this.name,
    email,
    phone: this.phone,
    phoneVerified: Boolean(this.phoneVerified),
    role: this.role,
    verified: this.verified,
    birthday: this.birthday || '',
    whatsappUpdates: this.whatsappUpdates !== false,
    addresses: (this.addresses || []).map((a) => ({
      id: a._id.toString(),
      label: a.label,
      name: a.name,
      phone: a.phone,
      address: a.address,
      city: a.city,
      state: a.state,
      pincode: a.pincode,
      isDefault: Boolean(a.isDefault),
    })),
    createdAt: this.createdAt,
  }
}

export default mongoose.model('User', userSchema)
