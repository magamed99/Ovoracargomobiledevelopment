import { useState, useRef } from 'react';
import { uploadAviaAvatar } from '../api/aviaApi';
import type { AviaUser } from '../api/aviaApi';
import { compressImage } from '../utils/imageCompression';

export function useAvatarUpload(
  phone: string,
  updateUserLocal: (updates: Partial<AviaUser>) => void,
) {
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  const isAvatarUploadingRef = useRef(false);

  const handleAvatarUpload = async (file: File) => {
    if (isAvatarUploadingRef.current) return;
    if (file.size > 10 * 1024 * 1024) {
      setAvatarError('Файл слишком большой (макс 10 МБ)');
      return;
    }
    isAvatarUploadingRef.current = true;
    setAvatarUploading(true);
    setAvatarError('');
    try {
      const compressed = await compressImage(file, 350);
      const { avatarUrl } = await uploadAviaAvatar(phone, compressed);
      updateUserLocal({ avatarUrl });
    } catch (err: any) {
      setAvatarError(err.message || 'Ошибка загрузки аватара');
    } finally {
      setAvatarUploading(false);
      isAvatarUploadingRef.current = false;
    }
  };

  return { avatarUploading, avatarError, setAvatarError, handleAvatarUpload };
}
