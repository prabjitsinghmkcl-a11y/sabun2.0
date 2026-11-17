import { v2 as cloudinary } from 'cloudinary'

export function configureCloudinary() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET
  if (!cloudName || !apiKey || !apiSecret) return false

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  })
  return true
}

export function uploadBuffer(buffer, { folder = 'sabun/products' } = {}) {
  if (!configureCloudinary()) {
    return Promise.reject(new Error('Cloudinary is not configured. Add CLOUDINARY_* values to .env.'))
  }
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image', overwrite: false },
      (error, result) => {
        if (error) return reject(new Error(error.message || 'Cloudinary upload failed'))
        resolve({ url: result.secure_url, publicId: result.public_id })
      },
    )
    stream.end(buffer)
  })
}
