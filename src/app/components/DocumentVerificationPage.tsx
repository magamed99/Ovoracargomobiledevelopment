import { useState } from 'react';
import { Upload, FileText, CheckCircle, Clock, XCircle, Camera } from 'lucide-react';
import { useNavigate } from 'react-router';

type DocumentStatus = 'verified' | 'pending' | 'rejected' | 'not_uploaded';

export function DocumentVerificationPage() {
  const navigate = useNavigate();
  const userRole = localStorage.getItem('userRole') || 'sender';

  const [documents, setDocuments] = useState([
    {
      id: 1,
      type: 'passport',
      title: 'Паспорт',
      status: 'verified' as DocumentStatus,
      uploadDate: '10 марта 2026',
      expiryDate: '2030-12-31',
    },
    {
      id: 2,
      type: 'driver_license',
      title: 'Водительские права',
      status: userRole === 'driver' ? ('verified' as DocumentStatus) : ('not_uploaded' as DocumentStatus),
      uploadDate: userRole === 'driver' ? '10 марта 2026' : undefined,
      expiryDate: '2028-05-15',
    },
    {
      id: 3,
      type: 'vehicle_registration',
      title: 'ТехПаспорт автомобиля',
      status: userRole === 'driver' ? ('pending' as DocumentStatus) : ('not_uploaded' as DocumentStatus),
      uploadDate: userRole === 'driver' ? '15 марта 2026' : undefined,
    },
    {
      id: 4,
      type: 'insurance',
      title: 'Страховка',
      status: userRole === 'driver' ? ('verified' as DocumentStatus) : ('not_uploaded' as DocumentStatus),
      uploadDate: userRole === 'driver' ? '10 марта 2026' : undefined,
      expiryDate: '2027-03-20',
    },
  ]);

  const statusConfig = {
    verified: {
      icon: <CheckCircle className="w-5 h-5" />,
      label: 'Подтверждено',
      color: 'bg-green-100 text-green-700',
      iconColor: 'text-green-600',
    },
    pending: {
      icon: <Clock className="w-5 h-5" />,
      label: 'На проверке',
      color: 'bg-yellow-100 text-yellow-700',
      iconColor: 'text-yellow-600',
    },
    rejected: {
      icon: <XCircle className="w-5 h-5" />,
      label: 'Отклонено',
      color: 'bg-red-100 text-red-700',
      iconColor: 'text-red-600',
    },
    not_uploaded: {
      icon: <Upload className="w-5 h-5" />,
      label: 'Не загружено',
      color: 'bg-gray-100 text-gray-700',
      iconColor: 'text-gray-400',
    },
  };

  const verifiedCount = documents.filter(d => d.status === 'verified').length;
  const totalRequired = userRole === 'driver' ? 4 : 1;
  const verificationProgress = (verifiedCount / totalRequired) * 100;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-teal-600 text-white px-4 pt-6 pb-8">
        <button
          onClick={() => navigate('/profile')}
          className="text-white font-medium mb-4"
        >
          ← Назад
        </button>
        
        <h1 className="text-2xl font-bold mb-6">Верификация документов</h1>

        {/* Progress */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Прогресс верификации</span>
            <span className="text-sm font-bold">{verifiedCount}/{totalRequired}</span>
          </div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-500"
              style={{ width: `${verificationProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Documents list */}
      <div className="px-4 py-6 space-y-4">
        {documents
          .filter(doc => userRole === 'driver' || doc.type === 'passport')
          .map((document) => (
            <div
              key={document.id}
              className="bg-white rounded-2xl p-4 shadow-sm"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  statusConfig[document.status].color
                }`}>
                  <FileText className={`w-6 h-6 ${statusConfig[document.status].iconColor}`} />
                </div>

                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {document.title}
                  </h3>
                  {document.uploadDate && (
                    <p className="text-sm text-gray-500 mb-1">
                      Загружено: {document.uploadDate}
                    </p>
                  )}
                  {document.expiryDate && document.status === 'verified' && (
                    <p className="text-sm text-gray-500">
                      Действителен до: {document.expiryDate}
                    </p>
                  )}
                </div>

                <div className="flex flex-col items-end gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    statusConfig[document.status].color
                  }`}>
                    {statusConfig[document.status].label}
                  </span>
                </div>
              </div>

              {/* Actions */}
              {document.status === 'not_uploaded' && (
                <button className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition-colors">
                  <Camera className="w-5 h-5" />
                  <span>Загрузить документ</span>
                </button>
              )}

              {document.status === 'rejected' && (
                <div className="space-y-2">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-800">
                      <strong>Причина отклонения:</strong> Документ нечитаем. Пожалуйста, загрузите более качественное фото.
                    </p>
                  </div>
                  <button className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition-colors">
                    <Upload className="w-5 h-5" />
                    <span>Загрузить заново</span>
                  </button>
                </div>
              )}

              {document.status === 'verified' && (
                <button className="w-full flex items-center justify-center gap-2 border-2 border-gray-200 text-gray-700 font-medium py-3 rounded-xl hover:border-gray-300 transition-colors">
                  <FileText className="w-5 h-5" />
                  <span>Просмотреть</span>
                </button>
              )}

              {document.status === 'pending' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800">
                    Документ на проверке. Обычно это занимает 1-2 рабочих дня.
                  </p>
                </div>
              )}
            </div>
          ))}
      </div>

      {/* Info */}
      <div className="px-4 pb-6">
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
          <h3 className="font-semibold text-blue-900 mb-2">💡 Требования к документам</h3>
          <ul className="space-y-1 text-sm text-blue-800">
            <li>• Фото должно быть четким и читаемым</li>
            <li>• Документ должен быть действительным</li>
            <li>• Все данные должны быть видны</li>
            <li>• Формат: JPG, PNG (макс. 5 МБ)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
