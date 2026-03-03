import { useState } from 'react';
import { 
  FileCheck, 
  X, 
  Check,
  Clock,
  AlertTriangle,
  Eye,
  Download,
  User,
  Car,
  FileText,
  Shield,
  Calendar
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';

interface Document {
  id: string;
  driver: {
    name: string;
    phone: string;
    email: string;
    avatar: string;
  };
  documentType: 'license' | 'registration' | 'insurance' | 'id';
  documentNumber: string;
  submittedDate: string;
  status: 'pending' | 'approved' | 'rejected';
  imageUrl: string;
  expiryDate: string;
  notes?: string;
}

const mockDocuments: Document[] = [
  {
    id: 'DOC-001',
    driver: {
      name: 'Рустам Абдуллоев',
      phone: '+992 93 678 9012',
      email: 'rustam.a@mail.tj',
      avatar: 'РА'
    },
    documentType: 'license',
    documentNumber: 'TJ-DL-123456',
    submittedDate: '27.02.2026 14:30',
    status: 'pending',
    imageUrl: 'https://images.unsplash.com/photo-1589395937816-ab5c0fba34f7?w=800',
    expiryDate: '15.12.2028',
  },
  {
    id: 'DOC-002',
    driver: {
      name: 'Шахло Мирзоева',
      phone: '+992 92 555 6666',
      email: 'shakhlo.m@mail.tj',
      avatar: 'ШМ'
    },
    documentType: 'registration',
    documentNumber: '01 TJ 2580',
    submittedDate: '27.02.2026 13:15',
    status: 'pending',
    imageUrl: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=800',
    expiryDate: '22.08.2027',
  },
  {
    id: 'DOC-003',
    driver: {
      name: 'Фаррух Хакимов',
      phone: '+992 92 567 8901',
      email: 'farrukh.h@mail.tj',
      avatar: 'ФХ'
    },
    documentType: 'insurance',
    documentNumber: 'INS-TJ-789012',
    submittedDate: '27.02.2026 11:45',
    status: 'pending',
    imageUrl: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800',
    expiryDate: '10.03.2027',
  },
  {
    id: 'DOC-004',
    driver: {
      name: 'Алишер Рахимов',
      phone: '+992 92 123 4567',
      email: 'alisher.r@mail.tj',
      avatar: 'АР'
    },
    documentType: 'id',
    documentNumber: 'TJ-ID-456789',
    submittedDate: '26.02.2026 16:20',
    status: 'approved',
    imageUrl: 'https://images.unsplash.com/photo-1633409361618-c73427e4e206?w=800',
    expiryDate: '05.06.2030',
  },
  {
    id: 'DOC-005',
    driver: {
      name: 'Мурод Каримов',
      phone: '+992 93 234 5678',
      email: 'murod.k@mail.tj',
      avatar: 'МК'
    },
    documentType: 'license',
    documentNumber: 'TJ-DL-234567',
    submittedDate: '26.02.2026 09:30',
    status: 'rejected',
    imageUrl: 'https://images.unsplash.com/photo-1554224311-beee2aca0c7d?w=800',
    expiryDate: '18.11.2026',
    notes: 'Документ истек или скоро истечет. Требуется обновление.'
  },
  {
    id: 'DOC-006',
    driver: {
      name: 'Джамшед Исмоилов',
      phone: '+992 91 456 7890',
      email: 'jamshed.i@mail.tj',
      avatar: 'ДИ'
    },
    documentType: 'registration',
    documentNumber: '01 TJ 9876',
    submittedDate: '27.02.2026 10:05',
    status: 'pending',
    imageUrl: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800',
    expiryDate: '30.09.2028',
  },
];

const documentTypeNames = {
  license: 'Водительские права',
  registration: 'Техпаспорт',
  insurance: 'Страховка',
  id: 'Удостоверение личности'
};

const documentTypeIcons = {
  license: FileCheck,
  registration: Car,
  insurance: Shield,
  id: User
};

export function DocumentVerification() {
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('pending');

  const filteredDocuments = mockDocuments.filter(doc => 
    statusFilter === 'all' || doc.status === statusFilter
  );

  const handleApprove = (doc: Document) => {
    toast.success(`Документ ${doc.documentNumber} одобрен`);
    setSelectedDocument(null);
  };

  const handleReject = (doc: Document) => {
    toast.error(`Документ ${doc.documentNumber} отклонен`);
    setSelectedDocument(null);
  };

  const getStatusBadge = (status: Document['status']) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">Ожидает проверки</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Одобрено</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Отклонено</Badge>;
    }
  };

  const statusCounts = {
    all: mockDocuments.length,
    pending: mockDocuments.filter(d => d.status === 'pending').length,
    approved: mockDocuments.filter(d => d.status === 'approved').length,
    rejected: mockDocuments.filter(d => d.status === 'rejected').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Верификация документов</h1>
        <p className="text-gray-600 mt-1">Проверка документов водителей</p>
      </div>

      {/* Status cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('all')}>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600 mb-1">Всего</p>
            <p className="text-2xl font-bold text-gray-900">{statusCounts.all}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('pending')}>
          <CardContent className="p-4">
            <p className="text-sm text-orange-600 mb-1">Ожидают</p>
            <p className="text-2xl font-bold text-orange-700">{statusCounts.pending}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('approved')}>
          <CardContent className="p-4">
            <p className="text-sm text-green-600 mb-1">Одобрено</p>
            <p className="text-2xl font-bold text-green-700">{statusCounts.approved}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('rejected')}>
          <CardContent className="p-4">
            <p className="text-sm text-red-600 mb-1">Отклонено</p>
            <p className="text-2xl font-bold text-red-700">{statusCounts.rejected}</p>
          </CardContent>
        </Card>
      </div>

      {/* Documents list */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredDocuments.map((doc) => {
          const Icon = documentTypeIcons[doc.documentType];
          return (
            <Card key={doc.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      doc.status === 'approved' ? 'bg-green-100' :
                      doc.status === 'rejected' ? 'bg-red-100' :
                      'bg-orange-100'
                    }`}>
                      <Icon className={`w-6 h-6 ${
                        doc.status === 'approved' ? 'text-green-600' :
                        doc.status === 'rejected' ? 'text-red-600' :
                        'text-orange-600'
                      }`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{documentTypeNames[doc.documentType]}</h3>
                      <p className="text-sm text-gray-600">{doc.documentNumber}</p>
                    </div>
                  </div>
                  {getStatusBadge(doc.status)}
                </div>

                <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {doc.driver.avatar}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{doc.driver.name}</p>
                    <p className="text-sm text-gray-600">{doc.driver.phone}</p>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Дата подачи:</span>
                    <span className="font-medium text-gray-900">{doc.submittedDate}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Действителен до:</span>
                    <span className="font-medium text-gray-900">{doc.expiryDate}</span>
                  </div>
                </div>

                {doc.notes && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-800">{doc.notes}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedDocument(doc)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    Просмотр
                  </button>
                  {doc.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleReject(doc)}
                        className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleApprove(doc)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredDocuments.length === 0 && (
        <div className="text-center py-12">
          <FileCheck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Документы не найдены</h3>
          <p className="text-gray-600">Нет документов со статусом "{statusFilter}"</p>
        </div>
      )}

      {/* Document viewer modal */}
      {selectedDocument && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedDocument(null)}>
          <Card className="max-w-4xl w-full max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="border-b border-gray-200">
              <div className="flex items-center justify-between">
                <CardTitle>Просмотр документа</CardTitle>
                <button
                  onClick={() => setSelectedDocument(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                {/* Driver info */}
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-xl">
                    {selectedDocument.driver.avatar}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{selectedDocument.driver.name}</h3>
                    <p className="text-gray-600">{selectedDocument.driver.phone}</p>
                    <p className="text-gray-600">{selectedDocument.driver.email}</p>
                  </div>
                </div>

                {/* Document details */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Тип документа</p>
                    <p className="font-medium text-gray-900">{documentTypeNames[selectedDocument.documentType]}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Номер документа</p>
                    <p className="font-medium text-gray-900">{selectedDocument.documentNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Дата подачи</p>
                    <p className="font-medium text-gray-900">{selectedDocument.submittedDate}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Действителен до</p>
                    <p className="font-medium text-gray-900">{selectedDocument.expiryDate}</p>
                  </div>
                </div>

                {/* Document image */}
                <div>
                  <p className="text-sm font-medium text-gray-900 mb-2">Скан документа</p>
                  <img 
                    src={selectedDocument.imageUrl} 
                    alt="Document" 
                    className="w-full rounded-lg border border-gray-200"
                  />
                </div>

                {/* Actions */}
                {selectedDocument.status === 'pending' && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleReject(selectedDocument)}
                      className="flex-1 px-6 py-3 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center gap-2 font-medium"
                    >
                      <X className="w-5 h-5" />
                      Отклонить
                    </button>
                    <button
                      onClick={() => handleApprove(selectedDocument)}
                      className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 font-medium"
                    >
                      <Check className="w-5 h-5" />
                      Одобрить
                    </button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
