import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Button } from '../app/components/ui/button';
import { Card } from '../app/components/ui/card';
import { Upload, FileText, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

type DocumentType = 'passport' | 'license' | 'vehicle';

export function UploadDocumentsScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<Record<DocumentType, File | null>>({
    passport: null,
    license: null,
    vehicle: null,
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleFileSelect = (type: DocumentType, file: File | null) => {
    setDocuments(prev => ({ ...prev, [type]: file }));
  };

  const handleSubmit = async () => {
    const allUploaded = Object.values(documents).every(doc => doc !== null);
    
    if (!allUploaded) {
      toast.error('Загрузите все документы');
      return;
    }

    setIsLoading(true);
    try {
      // Simulate document upload
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success('Документы загружены на проверку');
      navigate('/home');
    } catch (error) {
      toast.error('Ошибка загрузки документов');
    } finally {
      setIsLoading(false);
    }
  };

  const DocumentUploadCard = ({ 
    type, 
    title, 
    description 
  }: { 
    type: DocumentType; 
    title: string; 
    description: string;
  }) => (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="font-semibold mb-1">{title}</h3>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
        
        {documents[type] ? (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="w-5 h-5" />
            <span className="text-sm font-medium">Загружено</span>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = 'image/*,.pdf';
              input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) handleFileSelect(type, file);
              };
              input.click();
            }}
          >
            <Upload className="w-4 h-4 mr-2" />
            Загрузить
          </Button>
        )}
      </div>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold mb-2">{t('auth.uploadDocuments')}</h1>
          <p className="text-gray-600">
            Загрузите документы для верификации
          </p>
        </div>

        <div className="space-y-4 mb-8">
          <DocumentUploadCard
            type="passport"
            title="Паспорт"
            description="Скан основной страницы паспорта"
          />
          
          <DocumentUploadCard
            type="license"
            title="Водительское удостоверение"
            description="Обе стороны удостоверения"
          />
          
          <DocumentUploadCard
            type="vehicle"
            title="Техпаспорт"
            description="Регистрационный документ автомобиля"
          />
        </div>

        <Button
          className="w-full"
          size="lg"
          disabled={isLoading || Object.values(documents).some(doc => !doc)}
          onClick={handleSubmit}
        >
          {isLoading ? t('common.loading') : 'Отправить на проверку'}
        </Button>

        <Button
          variant="ghost"
          className="w-full mt-2"
          onClick={() => navigate('/home')}
        >
          Пропустить (загрузить позже)
        </Button>
      </Card>
    </div>
  );
}