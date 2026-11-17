import mongoose from 'mongoose'

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true },
    name: String,
    variant: String,
    price: Number,
    qty: { type: Number, required: true, min: 1 },
    custom: { type: String, default: '' },
    lineTotal: Number,
  },
  { _id: false },
)

const customerSchema = new mongoose.Schema(
  {
    name: String,
    phone: String,
    email: String,
    address: String,
    city: String,
    state: String,
    pincode: String,
    gift: Boolean,
    giftNote: String,
    notes: String,
  },
  { _id: false },
)

const orderSchema = new mongoose.Schema(
  {
    ref: { type: String, required: true, unique: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    items: { type: [orderItemSchema], required: true },
    subtotal: { type: Number, required: true },
    deliveryFee: { type: Number, default: 0 },
    deliveryKnown: { type: Boolean, default: false },
    total: { type: Number, required: true },
    customer: { type: customerSchema, required: true },
    status: { type: String, default: 'pending' },
    channel: { type: String, default: 'whatsapp' },
    paymentMethod: { type: String, enum: ['razorpay', 'cod', 'whatsapp'], default: 'whatsapp' },
    paymentRef: { type: String, default: '' },
    stockDeducted: { type: Boolean, default: false },
  },
  { timestamps: true },
)

orderSchema.index({ status: 1, createdAt: -1 })
orderSchema.index({ createdAt: -1 })

export default mongoose.model('Order', orderSchema)
