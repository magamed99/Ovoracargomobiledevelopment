// Утилита для экспорта данных о поездках

interface Trip {
  id: string | number;
  from: string;
  to: string;
  date: string;
  time: string;
  status: string;
  price?: number;
  currency?: string;
  driverName?: string;
  driverPhone?: string;
  carModel?: string;
  carNumber?: string;
  cargoType?: string;
  weight?: number;
  notes?: string;
}

/**
 * Экспорт поездок в Excel формат (CSV)
 */
export const exportToExcel = (trips: Trip[], filename: string = 'ovora-trips') => {
  try {
    // Заголовки таблицы
    const headers = [
      'ID',
      'Откуда',
      'Куда',
      'Дата',
      'Время',
      'Статус',
      'Цена',
      'Валюта',
      'Водитель',
      'Телефон',
      'Автомобиль',
      'Номер',
      'Тип груза',
      'Вес (кг)',
      'Примечания',
    ];

    // Формируем строки данных
    const rows = trips.map((trip) => [
      trip.id,
      trip.from || '-',
      trip.to || '-',
      trip.date || '-',
      trip.time || '-',
      getStatusLabel(trip.status),
      trip.price || '-',
      trip.currency || 'TJS',
      trip.driverName || '-',
      trip.driverPhone || '-',
      trip.carModel || '-',
      trip.carNumber || '-',
      trip.cargoType || '-',
      trip.weight || '-',
      (trip.notes || '-').replace(/,/g, ';'), // Заменяем запятые чтобы не сломать CSV
    ]);

    // Собираем CSV
    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    // Добавляем BOM для корректного отображения кириллицы в Excel
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });

    // Скачиваем файл
    downloadFile(blob, `${filename}_${getDateString()}.csv`);

    console.log('[Export] ✅ Excel export successful:', trips.length, 'trips');
    return true;
  } catch (error) {
    console.error('[Export] ❌ Excel export failed:', error);
    return false;
  }
};

/**
 * Экспорт поездок в PDF формат
 */
export const exportToPDF = (trips: Trip[], filename: string = 'ovora-trips') => {
  try {
    // Генерируем HTML для PDF
    const html = generatePDFHTML(trips);

    // Создаем новое окно для печати
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      throw new Error('Не удалось открыть окно печати');
    }

    printWindow.document.write(html);
    printWindow.document.close();

    // Ждем загрузки и печатаем
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
      // Закрываем окно после печати
      setTimeout(() => printWindow.close(), 100);
    };

    console.log('[Export] ✅ PDF export successful:', trips.length, 'trips');
    return true;
  } catch (error) {
    console.error('[Export] ❌ PDF export failed:', error);
    return false;
  }
};

/**
 * Генерация HTML для PDF
 */
const generatePDFHTML = (trips: Trip[]): string => {
  const date = new Date().toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const tripsHTML = trips
    .map(
      (trip, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${trip.from || '-'}</td>
      <td>${trip.to || '-'}</td>
      <td>${trip.date || '-'}</td>
      <td>${trip.time || '-'}</td>
      <td><span class="status ${trip.status}">${getStatusLabel(trip.status)}</span></td>
      <td>${trip.price ? `${trip.price} ${trip.currency || 'TJS'}` : '-'}</td>
      <td>${trip.driverName || '-'}</td>
    </tr>
  `
    )
    .join('');

  return `
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>История поездок - Ovora Cargo</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      padding: 20px;
      background: #fff;
      color: #333;
    }
    
    .header {
      text-align: center;
      margin-bottom: 30px;
      border-bottom: 3px solid #2563eb;
      padding-bottom: 20px;
    }
    
    .header h1 {
      color: #2563eb;
      font-size: 28px;
      margin-bottom: 5px;
    }
    
    .header .subtitle {
      color: #64748b;
      font-size: 14px;
    }
    
    .info {
      display: flex;
      justify-content: space-between;
      margin-bottom: 20px;
      padding: 15px;
      background: #f8fafc;
      border-radius: 8px;
    }
    
    .info-item {
      display: flex;
      flex-direction: column;
    }
    
    .info-item label {
      font-size: 12px;
      color: #64748b;
      margin-bottom: 3px;
    }
    
    .info-item value {
      font-size: 14px;
      font-weight: 600;
      color: #0f172a;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    
    th, td {
      padding: 12px;
      text-align: left;
      border: 1px solid #e2e8f0;
    }
    
    th {
      background: #2563eb;
      color: white;
      font-weight: 600;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    tr:nth-child(even) {
      background: #f8fafc;
    }
    
    tr:hover {
      background: #f1f5f9;
    }
    
    td {
      font-size: 13px;
      color: #475569;
    }
    
    .status {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
    }
    
    .status.active {
      background: #dbeafe;
      color: #1e40af;
    }
    
    .status.completed {
      background: #d1fae5;
      color: #065f46;
    }
    
    .status.cancelled {
      background: #fee2e2;
      color: #991b1b;
    }
    
    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e2e8f0;
      color: #64748b;
      font-size: 12px;
    }
    
    .footer .logo {
      font-size: 18px;
      font-weight: bold;
      color: #2563eb;
      margin-bottom: 5px;
    }
    
    @media print {
      body {
        padding: 0;
      }
      
      .header, table {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🚚 Ovora Cargo</h1>
    <div class="subtitle">История поездок</div>
  </div>
  
  <div class="info">
    <div class="info-item">
      <label>Дата формирования:</label>
      <value>${date}</value>
    </div>
    <div class="info-item">
      <label>Всего поездок:</label>
      <value>${trips.length}</value>
    </div>
    <div class="info-item">
      <label>Платформа:</label>
      <value>Ovora Cargo Mobile</value>
    </div>
  </div>
  
  <table>
    <thead>
      <tr>
        <th>№</th>
        <th>Откуда</th>
        <th>Куда</th>
        <th>Дата</th>
        <th>Время</th>
        <th>Статус</th>
        <th>Цена</th>
        <th>Водитель</th>
      </tr>
    </thead>
    <tbody>
      ${tripsHTML}
    </tbody>
  </table>
  
  <div class="footer">
    <div class="logo">Ovora Cargo</div>
    <div>Платформа для райдшеринга и грузоперевозок в Таджикистане</div>
    <div style="margin-top: 5px;">📞 +992 (92) 777-00-00 | 📧 support@ovoracargo.tj</div>
  </div>
</body>
</html>
  `;
};

/**
 * Получить метку статуса на русском
 */
const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    active: 'Активная',
    completed: 'Завершена',
    cancelled: 'Отменена',
    pending: 'Ожидание',
    'in-progress': 'В пути',
  };
  return labels[status] || status;
};

/**
 * Получить строку с текущей датой для имени файла
 */
const getDateString = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Скачать файл
 */
const downloadFile = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Экспорт статистики по поездкам
 */
export const exportTripStats = (trips: Trip[]): string => {
  const total = trips.length;
  const active = trips.filter((t) => t.status === 'active').length;
  const completed = trips.filter((t) => t.status === 'completed').length;
  const cancelled = trips.filter((t) => t.status === 'cancelled').length;
  const totalRevenue = trips
    .filter((t) => t.price)
    .reduce((sum, t) => sum + (t.price || 0), 0);

  return `
📊 Статистика поездок Ovora Cargo

📅 Период: ${getDateString()}
🚗 Всего поездок: ${total}

Статусы:
✅ Активные: ${active}
🎉 Завершенные: ${completed}
❌ Отмененные: ${cancelled}

💰 Общая выручка: ${totalRevenue.toFixed(2)} TJS
💵 Средний чек: ${total > 0 ? (totalRevenue / total).toFixed(2) : 0} TJS

---
Ovora Cargo - Ваш надежный партнер в грузоперевозках
  `.trim();
};
