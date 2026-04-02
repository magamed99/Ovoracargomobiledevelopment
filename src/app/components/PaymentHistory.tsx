import { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import { getUserPayments } from '../api/dataApi';
import {
  DollarSign, TrendingUp, TrendingDown, Calendar,
  ArrowLeft, Package, Users, RefreshCw,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router';

type PaymentType = 'all' | 'income' | 'expense';

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch { return dateStr; }
}

export function PaymentHistory() {
  const [filter, setFilter] = useState<PaymentType>('all');
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { user: currentUser } = useUser();
  const isDark = theme === 'dark';
  const userRole = (sessionStorage.getItem('userRole') || 'sender') as 'driver' | 'sender';
  const isDriver = userRole === 'driver';

  // Роль-специфичные метки — вынесены для ясности
  const subtitleLabel = isDriver ? 'Доходы и расходы' : 'Расходы на перевозки';
  const incomeLabel   = isDriver ? 'Доход'    : 'Возвраты';
  const expenseLabel  = isDriver ? 'Расходы'  : 'Оплаты';

  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!currentUser?.email) return;
    setLoading(true);
    try {
      const data = await getUserPayments(currentUser.email, userRole);
      setPayments(data);
    } catch { setPayments([]); } finally { setLoading(false); }
  };

  useEffect(() => {
    load();
    const iv = setInterval(load, 10000);
    return () => clearInterval(iv);
  }, [currentUser?.email, userRole]);

  const filteredPayments = filter === 'all' ? payments : payments.filter(p => p.type === filter);
  const totalIncome  = payments.filter(p => p.type === 'income').reduce((s, p) => s + Math.abs(p.amount), 0);
  const totalExpense = payments.filter(p => p.type === 'expense').reduce((s, p) => s + Math.abs(p.amount), 0);
  const balance      = totalIncome - totalExpense;

  const bg      = 'bg-[#0E1621]';
  const txt     = isDark ? 'text-white' : 'text-[#0f172a]';
  const sub     = isDark ? 'text-[#64748b]' : 'text-slate-500';
  const divider = isDark ? 'border-white/[0.06]' : 'border-black/[0.06]';
  const hover   = isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-black/[0.02]';

  return (
    <div className={`min-h-screen flex flex-col font-['Sora'] ${bg} ${txt} md:max-w-2xl md:mx-auto`}>

      {/* Header */}
      <header className={`sticky top-0 z-20 flex items-center gap-3 px-4 py-3 border-b backdrop-blur-xl ${
        'bg-[#0E1621]/95 border-white/[0.06]'
      }`}>
        <button
          onClick={() => navigate(-1)}
          className={`w-9 h-9 flex items-center justify-center transition-all active:scale-90 ${isDark ? 'text-white' : 'text-[#0f172a]'}`}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className={`text-[18px] font-bold ${txt}`}>История платежей</h1>
          <p className={`text-[11px] ${sub}`}>{subtitleLabel}</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className={`w-9 h-9 flex items-center justify-center transition-all active:scale-90 ${isDark ? 'text-[#1978e5]' : 'text-[#1978e5]'}`}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </header>

      {/* Stats */}
      <div className={`border-b ${divider}`}>
        <div className="flex">
          {[
            { label: incomeLabel, value: totalIncome,  icon: TrendingUp,  color: 'text-emerald-500' },
            { label: expenseLabel, value: totalExpense, icon: TrendingDown, color: 'text-rose-500' },
            { label: balance >= 0 ? 'Чистый доход' : 'Итого',      value: Math.abs(balance), icon: DollarSign, color: 'text-[#1978e5]' },
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className={`flex-1 px-4 py-4 text-center ${i < 2 ? `border-r ${divider}` : ''}`}>
                <Icon className={`w-4 h-4 mx-auto mb-1 ${stat.color}`} />
                <div className={`text-[17px] font-extrabold ${txt}`}>{stat.value.toLocaleString()}</div>
                <div className={`text-[11px] ${sub}`}>{stat.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter tabs */}
      <div className={`flex px-4 py-2.5 gap-2 border-b ${divider}`}>
        {[
          { value: 'all',     label: 'Все' },
          { value: 'income',  label: incomeLabel },
          { value: 'expense', label: expenseLabel },
        ].map(tab => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value as PaymentType)}
            className={`px-4 py-1.5 text-[13px] font-semibold transition-all ${
              filter === tab.value
                ? 'text-[#1978e5] border-b-2 border-[#1978e5]'
                : sub
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 pb-28">
        {loading && payments.length === 0 ? (
          [1, 2, 3].map(i => (
            <div key={i} className={`flex items-center gap-3 px-4 py-4 border-b animate-pulse ${divider}`}>
              <div className={`w-10 h-10 rounded-full ${isDark ? 'bg-white/10' : 'bg-black/10'}`} />
              <div className="flex-1 space-y-2">
                <div className={`h-3.5 w-40 ${isDark ? 'bg-white/10' : 'bg-black/10'}`} />
                <div className={`h-2.5 w-28 ${isDark ? 'bg-white/[0.07]' : 'bg-black/[0.07]'}`} />
              </div>
              <div className={`w-16 h-4 ${isDark ? 'bg-white/10' : 'bg-black/10'}`} />
            </div>
          ))
        ) : filteredPayments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <DollarSign className={`w-12 h-12 ${sub}`} strokeWidth={1.5} />
            <p className={`text-[15px] font-bold ${txt}`}>Нет транзакций</p>
            <p className={`text-[13px] text-center px-8 ${sub}`}>
              {userRole === 'driver'
                ? 'Транзакции появятся когда отправители примут оферту'
                : 'Транзакции появятся после принятия оферты водителем'}
            </p>
          </div>
        ) : (
          filteredPayments.map(payment => (
            <div key={payment.id} className={`flex items-start gap-3 px-4 py-3.5 border-b ${divider} ${hover}`}>
              {/* Icon */}
              <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                payment.type === 'income'
                  ? isDark ? 'bg-emerald-500/15' : 'bg-emerald-50'
                  : isDark ? 'bg-rose-500/15' : 'bg-rose-50'
              }`}>
                {payment.seats > 0 ? (
                  <Users className={`w-4 h-4 ${payment.type === 'income' ? 'text-emerald-500' : 'text-rose-500'}`} />
                ) : payment.cargoKg > 0 ? (
                  <Package className={`w-4 h-4 ${payment.type === 'income' ? 'text-emerald-500' : 'text-rose-500'}`} />
                ) : payment.type === 'income' ? (
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-rose-500" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className={`text-[14px] font-semibold ${txt}`}>{payment.title}</p>
                <p className={`text-[12px] mt-0.5 ${sub}`}>{payment.description}</p>
                {payment.person && (
                  <p className={`text-[12px] ${sub}`}>{payment.personLabel}: {payment.person}</p>
                )}
                <div className={`flex items-center gap-1.5 mt-1 text-[11px] ${sub}`}>
                  <Calendar className="w-3 h-3" />
                  <span>{formatDate(payment.date)}</span>
                  <span>·</span>
                  <span className={`font-semibold ${
                    payment.status === 'completed'
                      ? isDark ? 'text-emerald-400' : 'text-emerald-600'
                      : isDark ? 'text-amber-400' : 'text-amber-600'
                  }`}>
                    {payment.status === 'completed' ? 'Завершено' : 'В обработке'}
                  </span>
                </div>
              </div>

              {/* Amount */}
              <div className={`text-[15px] font-black shrink-0 ${
                payment.amount > 0
                  ? isDark ? 'text-emerald-400' : 'text-emerald-600'
                  : isDark ? 'text-rose-400' : 'text-rose-500'
              }`}>
                {payment.amount > 0 ? '+' : ''}{payment.amount.toLocaleString()} TJS
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}