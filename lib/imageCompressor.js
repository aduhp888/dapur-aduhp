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
 *
 * Format penamaan file terstruktur:
 * uploads/${slug-produk}/${warna}-${kondisi}-${index}.jpg
 * Contoh: uploads/redmi-note-13/biru-mulus-01.jpg
 */
export async function uploadCompressedImageToStorage(compressedResult, metadata = {}) {
  const uploadPayload = compressedResult?.blob || compressedResult?.file;

  if (!uploadPayload) {
    throw new Error('File gambar tidak valid atau belum dipilih');
  }

  // Helper sanitasi string menjadi slug URL yang bersih & aman
  const toSlug = (text, fallback = '') => {
    if (!text || typeof text !== 'string') return fallback;
    const cleaned = text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return cleaned || fallback;
  };

  // 1. Slug Nama Produk
  const rawProduct = metadata.productName || metadata.slug || metadata.name || '';
  const productSlug = toSlug(rawProduct, 'produk');

  // 2. Slug Warna
  const rawColor = metadata.color || metadata.warna || '';
  const colorSlug = toSlug(rawColor, 'default');

  // 3. Slug Kondisi
  const rawCondition = metadata.condition || metadata.kondisi || '';
  const conditionSlug = toSlug(rawCondition, 'mulus');

  // 4. Index urutan foto (01, 02, ...)
  const rawIndex = parseInt(metadata.index, 10);
  const indexStr = !isNaN(rawIndex) && rawIndex > 0 ? String(rawIndex).padStart(2, '0') : '01';

  // 5. Ekstensi file
  const origName = compressedResult?.file?.name || '';
  const ext = origName ? origName.split('.').pop().toLowerCase() : 'jpg';
  const cleanExt = ext === 'jpeg' ? 'jpg' : (ext || 'jpg');

  // 6. Unique timestamp cache-buster agar foto baru tidak tertimpa/terjebak di cache browser lama
  const timestamp = Date.now();

  // Format: uploads/${slug-produk}/${warna}-${kondisi}-${index}-${timestamp}.jpg
  const fileName = `${colorSlug}-${conditionSlug}-${indexStr}-${timestamp}.${cleanExt}`;
  const filePath = `uploads/${productSlug}/${fileName}`;

  // Upload dengan timeout 20 detik agar tidak pernah menggantung (hang)
  const uploadPromise = supabase.storage
    .from('products')
    .upload(filePath, uploadPayload, {
      cacheControl: '3600',
      upsert: false,
      contentType: uploadPayload.type || 'image/jpeg',
    });

  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error('Waktu upload gambar ke storage habis (timeout 20 detik). Periksa koneksi internet Anda.'));
    }, 20000);
  });

  const { data, error } = await Promise.race([uploadPromise, timeoutPromise]);

  if (error) {
    console.error('Supabase storage upload error:', error);
    throw new Error(`Gagal upload foto ke Supabase Storage (bucket 'products'): ${error.message}.`);
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

