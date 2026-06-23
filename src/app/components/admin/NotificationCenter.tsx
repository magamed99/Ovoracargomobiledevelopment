import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router';
import {
  Bell, FileCheck, ClipboardList as RequestIcon, Star, Users as UsersIcon,
  Handshake, Plane, RefreshCw, Loader2, Clock,
} from 'lucide-react';
import { AdminPageHeader, HeaderBtn } from './AdminPageHeader';
import { getAdminUsers, getAdminOffers, getAdminReviews, getAdminDocuments } from '../../api/dataApi';
import { getAviaAdminUsers, getAviaAdminDeals } from '../../api/aviaAdminApi';
import { toast } from 'sonner';

type AdminRole = 'super-admin' | 'cargo-admin' | 'avia-admin';

const DAY_MS = 24 * 60 * 60 * 1000;

interface NotifItem {
  key: string;
  href: string;
  icon: any;
  title: string;
  count: number;
  bg: string;
  color: string;
  urgent?: boolean;
}

export function NotificationCenter() {
  const adminRole = ((typeof sessionStorage !== 'undefined' && sessionStorage.getItem('ovora_admin_role')) || 'super-admin') as AdminRole;
  const showCargo = adminRole !== 'avia-admin';
  const showAvia = adminRole !== 'cargo-admin';

  const [loading, setLoading] = useState(true);
  const [cargoItems, setCargoItems] = useState<NotifItem[]>([]);
  const [aviaItems, setAviaItems] = useState<NotifItem[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const sinceTs = Date.now() - DAY_MS;
      const nextCargo: NotifItem[] = [];
      const nextAvia: NotifItem[] = [];

      if (showCargo) {
        const [users, offers, reviews, docs] = await Promise.all([
          getAdminUsers(), getAdminOffers(), getAdminReviews(), getAdminDocuments(),
        ]);
        const pendingDocs = (docs || []).filter((d: any) => d?.status === 'pending');
        const oldPendingDocs = pendingDocs.filter((d: any) => new Date(d.createdAt || 0).getTime() < sinceTs);
        const pendingOffers = (offers || []).filter((o: any) => o?.status === 'pending');
        const recentReviews = (reviews || []).filter((r: any) => new Date(r?.createdAt || 0).getTime() >= sinceTs);
        const newUsers = (users || []).filter((u: any) => new Date(u?.createdAt || 0).getTime() >= sinceTs);

        if (pendingDocs.length) nextCargo.push({
          key: 'docs', href: '/admin/cargo/verification', icon: FileCheck,
          title: 'Документы на проверке', count: pendingDocs.length,
          bg: '#eff6ff', color: '#2563eb', urgent: oldPendingDocs.length > 0,
        });
        if (pendingOffers.length) nextCargo.push({
          key: 'offers', href: '/admin/cargo/offers', icon: RequestIcon,
          title: 'Новые заявки', count: pendingOffers.length, bg: '#eff6ff', color: '#2563eb',
        });
        if (recentReviews.length) nextCargo.push({
          key: 'reviews', href: '/admin/cargo/reviews', icon: Star,
          title: 'Новые отзывы (24ч)', count: recentReviews.length, bg: '#fffbeb', color: '#d97706',
        });
        if (newUsers.length) nextCargo.push({
          key: 'users', href: '/admin/cargo/users', icon: UsersIcon,
          title: 'Новые пользователи (24ч)', count: newUsers.length, bg: '#f5f3ff', color: '#7c3aed',
        });
      }

      if (showAvia) {
        const [aviaUsers, pendingDeals] = await Promise.all([
          getAviaAdminUsers(), getAviaAdminDeals({ status: 'pending' }),
        ]);
        const oldPendingDeals = (pendingDeals || []).filter((d: any) => new Date(d.createdAt || 0).getTime() < sinceTs);
        const newAviaUsers = (aviaUsers || []).filter((u: any) => new Date(u?.createdAt || 0).getTime() >= sinceTs);

        if ((pendingDeals || []).length) nextAvia.push({
          key: 'deals', href: '/admin/avia/cards', icon: Handshake,
          title: 'Новые сделки AVIA', count: pendingDeals.length,
          bg: '#ecfeff', color: '#0ea5e9', urgent: oldPendingDeals.length > 0,
        });
        if (newAviaUsers.length) nextAvia.push({
          key: 'avia-users', href: '/admin/avia/users', icon: Plane,
          title: 'Новые пользователи AVIA (24ч)', count: newAviaUsers.length, bg: '#ecfeff', color: '#0ea5e9',
        });
      }

      setCargoItems(nextCargo);
      setAviaItems(nextAvia);
    } catch {
      toast.error('Ошибка загрузки уведомлений');
    } finally {
      setLoading(false);
    }
  }, [showCargo, showAvia]);

  useEffect(() => { load(); }, [load]);

  const total = cargoItems.reduce((s, i) => s + i.count, 0) + aviaItems.reduce((s, i) => s + i.count, 0);

  const renderSection = (title: string, items: NotifItem[]) => (
    <div className="space-y-3">
      <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide">{title}</h2>
      {items.length === 0 ? (
        <p className="text-sm text-gray-400">Нет важных событий</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {items.map(item => (
            <Link
              key={item.key}
              to={item.href}
              className="flex items-center gap-3 p-4 rounded-2xl bg-white transition-all hover:shadow-md"
              style={{ border: item.urgent ? '1px solid #fca5a5' : '1px solid #f0f4f8' }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: item.bg }}>
                <item.icon className="w-5 h-5" style={{ color: item.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                {item.urgent && (
                  <p className="text-xs text-red-500 flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" /> есть старше 24ч
                  </p>
                )}
              </div>
              <span className="text-lg font-bold flex-shrink-0" style={{ color: item.color }}>{item.count}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Центр уведомлений"
        subtitle="Важные события, требующие внимания администратора"
        icon={Bell}
        gradient="linear-gradient(135deg,#1565d8,#2385f4)"
        accent="#1565d8"
        stats={[{ label: 'Всего событий', value: total }]}
        actions={<HeaderBtn icon={RefreshCw} onClick={load}>Обновить</HeaderBtn>}
      />

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
        </div>
      ) : total === 0 ? (
        <div className="py-16 text-center">
          <Bell className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Нет новых событий — всё под контролем</p>
        </div>
      ) : (
        <>
          {showCargo && renderSection('CARGO', cargoItems)}
          {showAvia && renderSection('AVIA', aviaItems)}
        </>
      )}
    </div>
  );
}
