import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { uploadPassport, getPassportPhoto } from '../api/aviaApi';
import type { AviaUser } from '../api/aviaApi';
import { compressImage } from '../utils/imageCompression';

interface UsePassportUploadOptions {
  phone: string;
  manualExpiry: string;
  updateUserLocal: (updates: Partial<AviaUser>) => void;
  /** Current form values for fallback after OCR */
  formValues: {
    firstName: string;
    lastName: string;
    middleName: string;
    birthDate: string;
    passportNumber: string;
  };
  setFormValues: (updates: Partial<{
    firstName: string;
    lastName: string;
    middleName: string;
    birthDate: string;
    passportNumber: string;
  }>) => void;
}

export function usePassportUpload({
  phone, manualExpiry, updateUserLocal, formValues, setFormValues,
}: UsePassportUploadOptions) {
  const [uploading, setUploading] = useState(false);
  const [passportUrl, setPassportUrl] = useState<string | null>(null);
  const [passportExpiry, setPassportExpiry] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [error, setError] = useState('');
  const passportInputRef = useRef<HTMLInputElement>(null);
  const isUploadingRef = useRef(false);

  const processPassportFile = async (file: File, skipOcr: boolean = false) => {
    if (isUploadingRef.current) return;
    if (file.size > 20 * 1024 * 1024) {
      setError('Файл слишком большой (макс 20 МБ)');
      toast.error('Файл слишком большой', { description: 'Максимальный размер — 20 МБ' });
      return;
    }
    isUploadingRef.current = true;
    setUploading(true); setError(''); setUploadSuccess(null);
    try {
      const compressed = await compressImage(file);
      const result = await uploadPassport(phone, compressed, manualExpiry || undefined, skipOcr);
      updateUserLocal({
        passportPhoto: result.photoUrl,
        passportPhotoPath: result.user.passportPhotoPath,
        passportUploadedAt: result.user.passportUploadedAt,
        passportExpiryDate: result.expiryDate,
        passportVerified: true,
        passportExpired: result.isExpired,
        firstName: result.user.firstName || formValues.firstName,
        lastName: result.user.lastName || formValues.lastName,
        middleName: result.user.middleName || formValues.middleName,
        birthDate: result.user.birthDate || formValues.birthDate,
        passportNumber: result.user.passportNumber || formValues.passportNumber,
      });
      setPassportUrl(result.photoUrl);
      if (result.expiryDate) setPassportExpiry(result.expiryDate);

      const updates: Record<string, string> = {};
      if (result.user.firstName && !formValues.firstName) updates.firstName = result.user.firstName;
      if (result.user.lastName && !formValues.lastName) updates.lastName = result.user.lastName;
      if (result.user.middleName && !formValues.middleName) updates.middleName = result.user.middleName;
      if (result.user.birthDate && !formValues.birthDate) updates.birthDate = result.user.birthDate;
      if (result.user.passportNumber && !formValues.passportNumber) updates.passportNumber = result.user.passportNumber;
      if (Object.keys(updates).length > 0) setFormValues(updates);

      const msg = result.isExpired
        ? 'Паспорт загружен, но просрочен. Создание объявлений недоступно.'
        : skipOcr
          ? 'Фото загружено. Пожалуйста, введите данные ниже.'
          : result.ocrFullName
            ? 'Паспорт загружен! Данные распознаны автоматически.'
            : 'Паспорт загружен! При необходимости заполните данные вручную.';
      setUploadSuccess(msg);
      toast.success(skipOcr ? 'Фото сохранено' : 'Паспорт загружен', {
        description: skipOcr ? 'Заполните данные паспорта вручную' : result.ocrFullName ? 'Данные распознаны через OCR' : 'Заполните данные вручную',
      });
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки паспорта');
      toast.error('Ошибка загрузки паспорта', { description: err.message || 'Попробуйте ещё раз' });
    } finally {
      setUploading(false);
      isUploadingRef.current = false;
      if (passportInputRef.current) passportInputRef.current.value = '';
    }
  };

  const handlePassportUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processPassportFile(file);
  };

  const loadPassportPhoto = (phoneTo: string) => {
    let cancelled = false;
    getPassportPhoto(phoneTo).then(url => {
      if (url && !cancelled) setPassportUrl(url);
    }).catch(() => {});
    return () => { cancelled = true; };
  };

  const resetUploadState = () => {
    setUploadSuccess(null);
    setError('');
    // Optionally update user local state to clear passport info if you want to force re-upload
    // but usually just resetting the local UI state is enough for "update" flow
  };

  return {
    uploading, passportUrl, passportExpiry, uploadSuccess, error,
    passportInputRef, processPassportFile, handlePassportUpload,
    setPassportExpiry, loadPassportPhoto, resetUploadState,
    setManualExpiry: undefined, // managed externally
  };
}
