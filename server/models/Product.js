import mongoose from 'mongoose'

const personaliseSchema = new mongoose.Schema(
  {
    label: String,
    placeholder: String,
    maxLength: Number,
  },
  { _id: false },
)

const productSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true }, // slug/id used by frontend
    name: { type: String, required: true },
    variant: { type: String, default: '' },
    tag: { type: String, default: '' },
    isNew: { type: Boolean, default: false },
    price: { type: Number, required: true },
    priceNote: { type: String, default: '' },
    stock: { type: Number, default: 50, min: 0 },
    desc: { type: String, default: '' },
    longDesc: { type: String, default: '' },
    note: { type: String, default: '' },
    personalise: { type: personaliseSchema, default: undefined },
    img: { type: String, default: '' },
    thumb: { type: String, default: '' },
    alt: { type: String, default: '' },
    tint: { type: String, default: '' },
    width: { type: Number },
    height: { type: Number },
    photo: { type: Boolean, default: false },
  },
  { timestamps: true, suppressReservedKeysWarning: true },
)

export default mongoose.model('Product', productSchema)
