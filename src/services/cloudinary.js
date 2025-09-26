// src/services/cloudinary.js
import { Cloudinary } from '@cloudinary/url-gen';
import { auto } from '@cloudinary/url-gen/actions/resize';

// Initialize Cloudinary (only needs cloud name for client-side work)
export const cloudinary = new Cloudinary({
  cloud: {
    cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "dwbuqswz2"
  }
});

// 🔑 Unsigned upload function
export const uploadImage = async (file, folder = 'properties') => {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "dwbuqswz2";
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "househunt_unsigned";

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);
  formData.append("folder", folder);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: "POST", body: formData }
  );

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`);
  }

  return response.json();
};

// Upload with compression (uses browser-image-compression)
export const compressImage = async (file, options = {}) => {
  const { default: imageCompression } = await import('browser-image-compression');

  const defaultOptions = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    ...options
  };

  try {
    const compressedFile = await imageCompression(file, defaultOptions);
    console.log(
      `Image compressed: ${(file.size / 1024 / 1024).toFixed(2)}MB → ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`
    );
    return compressedFile;
  } catch (error) {
    console.error('Error compressing image:', error);
    return file; // fallback
  }
};

export const uploadCompressedImage = async (file, folder = 'properties', compressionOptions = {}) => {
  const compressedFile = await compressImage(file, compressionOptions);
  return uploadImage(compressedFile, folder);
};

// ✅ Utilities for image URLs
export const getOptimizedImageUrl = (publicId, options = {}) => {
  const { width = 800, height = 600 } = options;
  try {
    return cloudinary
      .image(publicId)
      .resize(auto().width(width).height(height))
      .quality('auto')
      .format('auto')
      .toURL();
  } catch {
    return `https://res.cloudinary.com/${cloudinary.getConfig().cloud.cloudName}/image/upload/w_${width},h_${height},c_fill,q_auto,f_auto/${publicId}`;
  }
};

export const getThumbnailUrl = (publicId, size = 150) => {
  return getOptimizedImageUrl(publicId, { width: size, height: size });
};

// Basic URL generator (fallback)
export const getBasicImageUrl = (publicId, transformations = '') =>
  `https://res.cloudinary.com/${cloudinary.getConfig().cloud.cloudName}/image/upload/${transformations}${publicId}`;

export const getBasicThumbnailUrl = (publicId, size = 150) =>
  getBasicImageUrl(publicId, `w_${size},h_${size},c_fill,q_auto,f_auto/`);

// Simple validation
export const validateImageFile = (file) => {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (!validTypes.includes(file.type)) {
    throw new Error('Please select a valid image file (JPEG, PNG, or WebP)');
  }
  if (file.size > maxSize) {
    throw new Error('File size must be less than 10MB');
  }
  return true;
};

// ❌ Delete requires backend signed requests (keep placeholder)
export const deleteImage = async (publicId) => {
  console.warn('Delete image requires backend API. Not implemented on client.');
};

export async function deleteImageFromCloudinary(publicId) {
  const response = await fetch('http://localhost:4000/delete-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ publicId }),
  });
  if (!response.ok) {
    throw new Error('Failed to delete image from Cloudinary');
  }
  return response.json();
}
