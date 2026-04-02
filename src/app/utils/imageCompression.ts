/**
 * Compress an image file via canvas.
 * Resizes to `maxDimension` and iteratively lowers JPEG quality
 * until the blob is ≤ `maxKB` kilobytes (or quality floor 0.4).
 */
export function compressImage(file: File, maxKB = 700, maxDimension = 1800): Promise<File> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        if (width > height && width > maxDimension) {
          height = Math.round(height * maxDimension / width);
          width = maxDimension;
        } else if (height > width && height > maxDimension) {
          width = Math.round(width * maxDimension / height);
          height = maxDimension;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(file); return; }
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        let quality = 0.85;
        const tryCompress = () => {
          canvas.toBlob(
            (blob) => {
              if (!blob) { resolve(file); return; }
              if (blob.size / 1024 <= maxKB || quality <= 0.4) {
                resolve(
                  new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
                    type: 'image/jpeg',
                    lastModified: Date.now(),
                  }),
                );
              } else {
                quality -= 0.1;
                tryCompress();
              }
            },
            'image/jpeg',
            quality,
          );
        };
        tryCompress();
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
}
