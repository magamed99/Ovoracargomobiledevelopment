import { useState } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Calendar, Filter } from 'lucide-react';

type PaymentType = 'all' | 'income' | 'expense';

export function PaymentHistory() {
  const [filter, setFilter] = useState<PaymentType>('all');

  const userRole = localStorage.getItem('userRole') || 'sender';

  const payments = [
    {
      id: 1,
      type: 'income',
      title: 'Оплата за поездку',
      description: 'Душанбе → Москва',
      amount: 5000,
      date: '15 марта 2026',
      status: 'completed',
      passenger: 'Фарход А.',
    },
    {
      id: 2,
      type: 'expense',
      title: 'Комиссия платформы',
      description: 'За поездку #1234',
      amount: -250,
      date: '15 марта 2026',
      status: 'completed',
    },
    {
      id: 3,
      type: 'income',
      title: 'Оплата за поездку',
      description: 'Худжанд → С.-Петербург',
      amount: 6000,
      date: '10 марта 2026',
      status: 'completed',
      passenger: 'Алишер М.',
    },
    {
      id: 4,
      type: 'expense',
      title: 'Возврат средств',
      description: 'Отмена поездки',
      amount: -4500,
      date: '8 марта 2026',
      status: 'completed',
    },
    {
      id: 5,
      type: 'income',
      title: 'Оплата за поездку',
      description: 'Душанбе → Екатеринбург',
      amount: 4500,
      date: '5 марта 2026',
      status: 'completed',
      passenger: 'Рахим Ш.',
    },
  ];

  const filteredPayments = filter === 'all'
    ? payments
    : payments.filter(p => p.type === filter);

  const totalIncome = payments
    .filter(p => p.type === 'income')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalExpense = Math.abs(
    payments
      .filter(p => p.type === 'expense')
      .reduce((sum, p) => sum + p.amount, 0)
  );

  const balance = totalIncome - totalExpense;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-teal-600 text-white px-4 pt-6 pb-8">
        <h1 className="text-2xl font-bold mb-6">История платежей</h1>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
            <div className="flex items-center gap-1 mb-1 text-white/80">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div className="text-xl font-bold">{totalIncome}</div>
            <div className="text-xs text-blue-100">Доход</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
            <div className="flex items-center gap-1 mb-1 text-white/80">
              <TrendingDown className="w-4 h-4" />
            </div>
            <div className="text-xl font-bold">{totalExpense}</div>
            <div className="text-xs text-blue-100">Расход</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
            <div className="flex items-center gap-1 mb-1 text-white/80">
              <DollarSign className="w-4 h-4" />
            </div>
            <div className="text-xl font-bold">{balance}</div>
            <div className="text-xs text-blue-100">Баланс</div>
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="bg-white px-4 py-4 border-b border-gray-200 sticky top-0 z-10">
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {[
            { value: 'all', label: 'Все' },
            { value: 'income', label: 'Доход' },
            { value: 'expense', label: 'Расход' },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value as PaymentType)}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                filter === tab.value
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Payments list */}
      <div className="px-4 py-6 space-y-3">
        {filteredPayments.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center">
            <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Нет транзакций</p>
          </div>
        ) : (
          filteredPayments.map((payment) => (
            <div
              key={payment.id}
              className="bg-white rounded-xl p-4 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                  payment.type === 'income'
                    ? 'bg-green-100'
                    : 'bg-red-100'
                }`}>
                  {payment.type === 'income' ? (
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  ) : (
                    <TrendingDown className="w-6 h-6 text-red-600" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {payment.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-1">
                    {payment.description}
                  </p>
                  {payment.passenger && (
                    <p className="text-xs text-gray-500">
                      Пассажир: {payment.passenger}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                    <Calendar className="w-3 h-3" />
                    <span>{payment.date}</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className={`text-lg font-bold ${
                    payment.amount > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {payment.amount > 0 ? '+' : ''}{payment.amount} TJS
                  </div>
                  <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                    {payment.status === 'completed' ? 'Завершено' : 'В обработке'}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
