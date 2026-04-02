/**
 * 🖼️ ОПТИМИЗАЦИЯ ИЗОБРАЖЕНИЙ
 * Сжатие и конвертация изображений для экономии трафика
 */

interface OptimizeOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
}

/**
 * Оптимизирует изображение перед загрузкой
 * @param file - Исходный файл изображения
 * @param options - Параметры оптимизации
 * @returns Оптимизированный Blob
 */
export async function optimizeImage(
  file: File,
  options: OptimizeOptions = {}
): Promise<Blob> {
  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 0.85,
    format = 'webp',
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        // Вычисляем новые размеры с сохранением пропорций
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          const aspectRatio = width / height;

          if (width > height) {
            width = maxWidth;
            height = width / aspectRatio;
          } else {
            height = maxHeight;
            width = height * aspectRatio;
          }
        }

        // Создаём canvas для ресайза
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        // Рисуем изображение с новыми размерами
        ctx.drawImage(img, 0, 0, width, height);

        // Конвертируем в Blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              console.log(`[ImageOptimization] Оригинал: ${(file.size / 1024).toFixed(1)} KB → Сжато: ${(blob.size / 1024).toFixed(1)} KB (${((1 - blob.size / file.size) * 100).toFixed(0)}% экономии)`);
              resolve(blob);
            } else {
              reject(new Error('Blob conversion failed'));
            }
          },
          `image/${format}`,
          quality
        );
      };

      img.onerror = () => reject(new Error('Image load failed'));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('File read failed'));
    reader.readAsDataURL(file);
  });
}

/**
 * Создаёт миниатюру изображения для списков
 * @param file - Исходный файл
 * @returns Миниатюра (200x200)
 */
export async function createThumbnail(file: File): Promise<Blob> {
  return optimizeImage(file, {
    maxWidth: 200,
    maxHeight: 200,
    quality: 0.7,
    format: 'webp',
  });
}

/**
 * Проверяет размер файла перед загрузкой
 * @param file - Файл для проверки
 * @param maxSizeMB - Максимальный размер в МБ (по умолчанию 10)
 * @returns true если размер допустимый
 */
export function validateImageSize(file: File, maxSizeMB: number = 10): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
}

/**
 * Проверяет тип файла
 * @param file - Файл для проверки
 * @returns true если это изображение
 */
export function validateImageType(file: File): boolean {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  return allowedTypes.includes(file.type);
}

/**
 * Полная валидация и оптимизация изображения
 * @param file - Исходный файл
 * @param options - Параметры оптимизации
 * @returns Оптимизированный Blob или ошибка
 */
export async function processImage(
  file: File,
  options: OptimizeOptions = {}
): Promise<{ success: boolean; blob?: Blob; error?: string }> {
  try {
    // Проверка типа
    if (!validateImageType(file)) {
      return {
        success: false,
        error: 'Неподдерживаемый формат. Используйте JPG, PNG или WebP',
      };
    }

    // Проверка размера
    if (!validateImageSize(file, 10)) {
      return {
        success: false,
        error: 'Файл слишком большой. Максимум 10 МБ',
      };
    }

    // Оптимизация
    const blob = await optimizeImage(file, options);

    return {
      success: true,
      blob,
    };
  } catch (error) {
    return {
      success: false,
      error: 'Ошибка обработки изображения',
    };
  }
}

/**
 * Конвертирует Blob в base64 для отправки на сервер
 * @param blob - Blob для конвертации
 * @returns base64 строка
 */
export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Хук для оптимизации изображений в React компонентах
 */
export function useImageOptimization() {
  const handleImageUpload = async (
    file: File,
    options?: OptimizeOptions
  ): Promise<{ success: boolean; blob?: Blob; base64?: string; error?: string }> => {
    const result = await processImage(file, options);

    if (result.success && result.blob) {
      const base64 = await blobToBase64(result.blob);
      return {
        success: true,
        blob: result.blob,
        base64,
      };
    }

    return result;
  };

  return { handleImageUpload };
}
