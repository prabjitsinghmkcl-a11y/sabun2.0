import mongoose from 'mongoose'

const otpSchema = new mongoose.Schema(
  {
    phone: { type: String, required: true, trim: true },
    purpose: { type: String, enum: ['login', 'verify'], required: true, default: 'login' },
    codeHash: { type: String, required: true },
    attempts: { type: Number, default: 0 },
    // When the code stops working (5 minutes after sending)
    codeExpiresAt: { type: Date, required: true },
    // When MongoDB may delete the row (kept for the hourly resend limit)
    expiresAt: { type: Date, required: true },
    consumedAt: { type: Date, default: null },
    sentAt: { type: [Date], default: [] },
  },
  { timestamps: true },
)

// One active OTP per phone + purpose (resending replaces it)
otpSchema.index({ phone: 1, purpose: 1 }, { unique: true })
// MongoDB automatically removes expired documents
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

export default mongoose.model('Otp', otpSchema)
