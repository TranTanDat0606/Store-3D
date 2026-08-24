import { v2 as cloudinary } from 'cloudinary';
import { config } from './index';

const { cloudName, apiKey, apiSecret } = config.cloudinary;

if (!cloudName || !apiKey || !apiSecret) {
  const missing = [
    !cloudName && 'CLOUDINARY_CLOUD_NAME',
    !apiKey && 'CLOUDINARY_API_KEY',
    !apiSecret && 'CLOUDINARY_API_SECRET',
  ].filter(Boolean);
  console.error(`[Cloudinary] Missing env vars: ${missing.join(', ')}. Image upload will fail.`);
}

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true,
});

export default cloudinary;
