import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { AlertTriangle, Clock, Crown, X } from 'lucide-react';
import {
  getSubscription,
  getCachedSubscription,
  cacheSubscription,
  isSubActive,
  getDaysLeft,
} from '../api/subscriptionApi';
import { useLanguage } from '../context/LanguageContext';
import { SK } from '../constants/storageKeys';

function wasDismissedToday(): boolean {
  try {
    const ts = localStorage.getItem(SK.SUB_BANNER_DISMISSED);
    if (!ts) return false;
    return Date.now() - parseInt(ts, 10) < 24 * 60 * 60 * 1000;
  } catch { return false; }
}

function dismiss() {
  try { localStorage.setItem(SK.SUB_BANNER_DISMISSED, String(Date.now())); } catch {}
}

interface Props {
  userEmail: string;
}

export function SubscriptionBanner({ userEmail }: Props) {
  const { t, lang } = useLanguage();
  const [visible, setVisible] = useState(false);
  const [daysLeft, setDaysLeft] = useState(0);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!userEmail || wasDismissedToday()) return;

    async function check() {
      let sub = getCachedSubscription();
      if (!sub) {
        sub = await getSubscription(userEmail);
        if (sub) cacheSubscription(sub);
      }
      if (!sub) return;
      if (sub.status === 'lifetime') return; // никогда не показываем

      const active = isSubActive(sub);
      const days = getDaysLeft(sub);

      if (!active) {
        setIsExpired(true);
        setDaysLeft(0);
        setVisible(true);
      } else if (days <= 7) {
        setIsExpired(false);
        setDaysLeft(days);
        setVisible(true);
      }
    }

    check();
  }, [userEmail]);

  if (!visible) return null;

  const handleDismiss = () => {
    dismiss();
    setVisible(false);
  };

  if (isExpired) {
    return (
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 14px',
          background: 'linear-gradient(90deg, rgba(239,68,68,0.15) 0%, rgba(220,38,38,0.08) 100%)',
          borderBottom: '1px solid rgba(239,68,68,0.25)',
        }}
      >
        <AlertTriangle size={15} color="#f87171" style={{ flexShrink: 0 }} />
        <span style={{ flex: 1, fontSize: 13, color: '#fca5a5', lineHeight: 1.3 }}>
          {t('sub_banner_expired')}
        </span>
        <Link
          to="/subscription"
          style={{
            fontSize: 12, fontWeight: 700, color: '#f87171',
            textDecoration: 'none',
            padding: '4px 10px',
            border: '1px solid rgba(239,68,68,0.4)',
            borderRadius: 6,
            whiteSpace: 'nowrap',
          }}
        >
          {t('sub_banner_renew')}
        </Link>
        <button
          onClick={handleDismiss}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: 'rgba(248,113,113,0.5)' }}
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 14px',
        background: 'linear-gradient(90deg, rgba(251,191,36,0.12) 0%, rgba(245,158,11,0.06) 100%)',
        borderBottom: '1px solid rgba(251,191,36,0.2)',
      }}
    >
      <Clock size={15} color="#fbbf24" style={{ flexShrink: 0 }} />
      <span style={{ flex: 1, fontSize: 13, color: '#fde68a', lineHeight: 1.3 }}>
        {daysLeft === 0
          ? t('sub_banner_trial_last')
          : lang === 'ru'
            ? `${t('sub_banner_trial_days_1')} ${daysLeft} ${daysLeft === 1 ? t('sub_banner_trial_days_2') : daysLeft < 5 ? t('sub_banner_trial_days_5') : t('sub_banner_trial_days_many')}`
            : `${t('sub_banner_trial_days_1')} ${daysLeft} ${t('sub_banner_trial_days_many')}`}
      </span>
      <Link
        to="/subscription"
        style={{
          display: 'flex', alignItems: 'center', gap: 4,
          fontSize: 12, fontWeight: 700, color: '#fbbf24',
          textDecoration: 'none',
          padding: '4px 10px',
          border: '1px solid rgba(251,191,36,0.35)',
          borderRadius: 6,
          whiteSpace: 'nowrap',
        }}
      >
        <Crown size={11} />
        {t('sub_banner_subscribe')}
      </Link>
      <button
        onClick={handleDismiss}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: 'rgba(251,191,36,0.4)' }}
      >
        <X size={14} />
      </button>
    </div>
  );
}
