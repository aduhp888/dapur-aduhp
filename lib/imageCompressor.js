import { supabase } from './supabase';

/**
 * Client-Side Image Compressor using HTML5 Canvas
 * Mengompres foto berukuran besar (kamera HP 5MB - 12MB) menjadi ~150KB - 300KB
 * dengan kualitas visual tajam untuk detail fisik gadget.
 */
export async function compressImage(file, options = {}) {
  const {
    maxWidth = 1400,
    maxHeight = 1400,
    quality = 0.8,
    outputType = 'image/jpeg'
  } = options;

  const startTime = performance.now();

  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      return reject(new Error('File yang diupload bukan gambar'));
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca file gambar'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Gagal memuat gambar ke memori'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Hitung skala proporsional
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        // Siapkan Canvas
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Gagal menginisialisasi 2D Canvas'));
        }

        // Kualitas rendering tinggi
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Latar putih untuk transparansi jika jpeg
        if (outputType === 'image/jpeg') {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return reject(new Error('Gagal mengompres gambar ke Blob'));
            }

            const endTime = performance.now();
            const durationMs = Math.round(endTime - startTime);

            const originalSize = file.size;
            const compressedSize = blob.size;
            const savedBytes = Math.max(0, originalSize - compressedSize);
            const savedPercent = Math.max(0, Math.round((savedBytes / originalSize) * 100));

            // Buat File object baru yang terkompresi
            const cleanName = file.name.replace(/\.[^/.]+$/, '') + '.jpg';
            const compressedFile = new File([blob], cleanName, {
              type: outputType,
              lastModified: Date.now(),
            });

            const previewUrl = URL.createObjectURL(blob);

            // Juga siapkan base64 preview jika diperlukan
            const dataUrl = canvas.toDataURL(outputType, quality);

            resolve({
              blob,
              file: compressedFile,
              previewUrl,
              dataUrl,
              width,
              height,
              originalSize,
              compressedSize,
              originalSizeFormatted: formatBytes(originalSize),
              compressedSizeFormatted: formatBytes(compressedSize),
              savedBytes,
              savedPercent,
              durationMs,
            });
          },
          outputType,
          quality
        );
      };

      img.src = e.target.result;
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Format bytes to readable KB/MB
 */
export function formatBytes(bytes, decimals = 1) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Upload single compressed image to Supabase Storage bucket 'products'.
 * JANGAN pakai fallback dataUrl/base64 agar database PostgreSQL tidak bengkak.
 * Jika upload storage gagal, lempar error langsung.
 */
export async function uploadCompressedImageToStorage(compressedResult) {
  const { file } = compressedResult || {};

  if (!file) {
    throw new Error('File gambar tidak valid atau belum dipilih');
  }

  const timestamp = Date.now();
  const rand = Math.random().toString(36).substring(2, 8);
  const fileName = `phone-${timestamp}-${rand}.jpg`;
  const filePath = `uploads/${fileName}`;

  const { data, error } = await supabase.storage
    .from('products')
    .upload(filePath, file, {
      cacheControl: '31536000',
      upsert: false,
      contentType: 'image/jpeg',
    });

  if (error) {
    console.error('Supabase storage upload error:', error);
    throw new Error(`Gagal upload foto ke Supabase Storage (bucket 'products'): ${error.message}. Pastikan bucket 'products' sudah dibuat dan policy upload aktif.`);
  }

  const { data: publicUrlData } = supabase.storage
    .from('products')
    .getPublicUrl(filePath);

  if (!publicUrlData || !publicUrlData.publicUrl) {
    throw new Error('Gagal mendapatkan public URL foto dari Supabase Storage.');
  }

  return {
    url: publicUrlData.publicUrl,
    fileName,
    filePath
  };
}

