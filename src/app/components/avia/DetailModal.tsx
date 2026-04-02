import { useState } from 'react';
import {
  X, Plane, Package, ArrowRight, Calendar, User, Clock,
  Phone, Copy, Check, Trash2, XCircle, MapPin, Weight,
  DollarSign, FileText, Hash,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import type { AviaFlight, AviaRequest } from '../../api/aviaApi';
import {
  deleteAviaFlight, deleteAviaRequest,
  closeAviaFlight, closeAviaRequest,
} from '../../api/aviaApi';

// ── Helpers ──────────────────────────────────────────────────────────────────

function maskPhone(phone: string): string {
  const d = phone.replace(/\D/g, '');
  if (d.length < 9) return phone;
  return `+${d.slice(0, d.length - 7)}·····${d.slice(-2)}`;
}

function fmtDate(iso: string, short = false): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('ru-RU', short
      ? { day: 'numeric', month: 'short' }
      : { day: 'numeric', month: 'long', year: 'numeric' });
  } catch { return iso; }
}

function fmtDateTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString('ru-RU', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return iso; }
}

function daysSince(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const days = Math.floor(diff / 86_400_000);
    if (days === 0) return 'Сегодня';
    if (days === 1) return 'Вчера';
    return `${days} дн. назад`;
  } catch { return ''; }
}

// ── Contact Inline ──────────────────────────────────────────────────────────

function ContactInline({ phone, accentColor }: { phone: string; accentColor: string }) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`+${phone.replace(/\D/g, '')}`);
      setCopied(true);
      toast.success('Номер скопирован', { duration: 2000 });
      setTimeout(() => setCopied(false), 2000);
    } catch { toast.error('Не удалось скопировать'); }
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '10px 14px', borderRadius: 12,
      background: `${accentColor}08`, border: `1px solid ${accentColor}18`,
    }}>
      <div style={{
        width: 34, height: 34, borderRadius: 10,
        background: `${accentColor}14`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Phone style={{ width: 16, height: 16, color: accentColor }} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 10, color: '#4a6080', fontWeight: 600, marginBottom: 2 }}>Контакт</div>
        {revealed ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: accentColor, letterSpacing: '0.04em' }}>
              +{phone.replace(/\D/g, '')}
            </span>
            <button
              onClick={handleCopy}
              style={{
                width: 26, height: 26, borderRadius: 7,
                border: `1px solid ${accentColor}20`,
                background: copied ? `${accentColor}18` : '#ffffff08',
                color: copied ? accentColor : '#4a6080', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              {copied ? <Check style={{ width: 11, height: 11 }} /> : <Copy style={{ width: 11, height: 11 }} />}
            </button>
          </div>
        ) : (
          <button
            onClick={() => setRevealed(true)}
            style={{
              fontSize: 12, fontWeight: 700, color: accentColor,
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              textDecoration: 'underline', textUnderlineOffset: 2,
            }}
          >
            Показать номер
          </button>
        )}
      </div>
    </div>
  );
}

// ── Info Row ─────────────────────────────────────────────────────────────────

function InfoRow({
  icon: Icon, label, value, valueColor,
}: {
  icon: typeof Calendar; label: string; value: string; valueColor?: string;
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '9px 0', borderBottom: '1px solid #ffffff06',
    }}>
      <div style={{
        width: 30, height: 30, borderRadius: 9,
        background: '#ffffff06',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon style={{ width: 14, height: 14, color: '#4a6080' }} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 10, color: '#3d5268', fontWeight: 600 }}>{label}</div>
        <div style={{ fontSize: 13, color: valueColor || '#c0d0dd', fontWeight: 700, marginTop: 1 }}>{value}</div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ── Flight Detail Modal ─────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

export function FlightDetailModal({
  flight, isMine, onClose, onDeleted, onClosed,
}: {
  flight: AviaFlight;
  isMine: boolean;
  onClose: () => void;
  onDeleted: (id: string) => void;
  onClosed: (id: string) => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [closing, setClosing] = useState(false);
  const isFlightClosed = flight.status === 'closed';

  const handleDelete = async () => {
    if (!confirm('Удалить этот рейс навсегда?')) return;
    setDeleting(true);
    try {
      await deleteAviaFlight(flight.id);
      onDeleted(flight.id);
      onClose();
      toast.success('Рейс удалён');
    } catch { toast.error('Не удалось удалить рейс'); }
    finally { setDeleting(false); }
  };

  const handleCloseAd = async () => {
    if (!confirm('Закрыть рейс? Он исчезнет из общего списка.')) return;
    setClosing(true);
    try {
      await closeAviaFlight(flight.id);
      onClosed(flight.id);
      onClose();
      toast.success('Рейс закрыт');
    } catch { toast.error('Не удалось закрыть рейс'); }
    finally { setClosing(false); }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 520,
          maxHeight: '92dvh', overflowY: 'auto',
          background: '#0a1220', borderRadius: '24px 24px 0 0',
          padding: 'clamp(16px, 5vw, 24px)',
          fontFamily: "'Sora', 'Inter', sans-serif",
        }}
      >
        {/* Handle bar */}
        <div style={{
          width: 36, height: 4, borderRadius: 2,
          background: '#ffffff14', margin: '0 auto 16px',
        }} />

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 20,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: 'linear-gradient(135deg, #0369a1, #0ea5e9)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Plane style={{ width: 20, height: 20, color: '#fff' }} />
            </div>
            <div>
              <div style={{ fontSize: 10, color: '#4a6080', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Рейс
              </div>
              <div style={{ fontSize: 10, color: '#2a3d50', fontWeight: 500, marginTop: 1 }}>
                ID: {flight.id.slice(0, 8)}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {isFlightClosed && (
              <span style={{
                fontSize: 9, fontWeight: 700, color: '#f59e0b',
                padding: '4px 10px', borderRadius: 7,
                background: '#f59e0b14', border: '1px solid #f59e0b20',
                textTransform: 'uppercase', letterSpacing: '0.06em',
              }}>
                Закрыт
              </span>
            )}
            {isMine && !isFlightClosed && (
              <span style={{
                fontSize: 9, fontWeight: 700, color: '#0ea5e9',
                padding: '4px 10px', borderRadius: 7,
                background: '#0ea5e912', border: '1px solid #0ea5e920',
                textTransform: 'uppercase', letterSpacing: '0.06em',
              }}>
                Мой рейс
              </span>
            )}
            <button
              onClick={onClose}
              style={{
                width: 32, height: 32, borderRadius: 10,
                border: '1px solid #ffffff10', background: '#ffffff08',
                color: '#6b8299', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <X style={{ width: 16, height: 16 }} />
            </button>
          </div>
        </div>

        {/* Route Hero */}
        <div style={{
          padding: '20px 16px', borderRadius: 16,
          background: 'linear-gradient(135deg, #0c1e3080, #0ea5e908)',
          border: '1px solid #0ea5e918',
          marginBottom: 16, textAlign: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
            <div>
              <MapPin style={{ width: 14, height: 14, color: '#0ea5e9', margin: '0 auto 4px' }} />
              <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', letterSpacing: '-0.5px' }}>{flight.from}</div>
              <div style={{ fontSize: 10, color: '#4a6080', fontWeight: 600, marginTop: 2 }}>Откуда</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '0 8px' }}>
              <div style={{ width: 40, height: 1, background: '#0ea5e930' }} />
              <Plane style={{ width: 16, height: 16, color: '#0ea5e9', transform: 'rotate(0deg)' }} />
              <div style={{ width: 40, height: 1, background: '#0ea5e930' }} />
            </div>
            <div>
              <MapPin style={{ width: 14, height: 14, color: '#34d399', margin: '0 auto 4px' }} />
              <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', letterSpacing: '-0.5px' }}>{flight.to}</div>
              <div style={{ fontSize: 10, color: '#4a6080', fontWeight: 600, marginTop: 2 }}>Куда</div>
            </div>
          </div>
        </div>

        {/* Info rows */}
        <div style={{ marginBottom: 16 }}>
          <InfoRow icon={Calendar} label="Дата вылета" value={fmtDate(flight.date)} />
          {flight.flightNo && <InfoRow icon={Hash} label="Номер рейса" value={flight.flightNo} />}
          <InfoRow icon={Weight} label="Свободный вес" value={`${flight.freeKg} кг`} valueColor="#0ea5e9" />
          {!!flight.pricePerKg && (
            <InfoRow icon={DollarSign} label="Цена за кг" value={`$${flight.pricePerKg}`} valueColor="#34d399" />
          )}
          <InfoRow icon={User} label="Курьер" value={flight.courierName || maskPhone(flight.courierId)} />
          <InfoRow icon={Clock} label="Создано" value={`${fmtDateTime(flight.createdAt)} · ${daysSince(flight.createdAt)}`} />
        </div>

        {/* Contact */}
        {!isMine && !isFlightClosed && (
          <div style={{ marginBottom: 16 }}>
            <ContactInline phone={flight.courierId} accentColor="#0ea5e9" />
          </div>
        )}

        {/* Actions */}
        {isMine && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            {!isFlightClosed && (
              <button
                onClick={handleCloseAd}
                disabled={closing}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '12px 16px', borderRadius: 12, cursor: 'pointer',
                  border: '1px solid #f59e0b24', background: '#f59e0b0c',
                  color: '#fbbf24', fontSize: 13, fontWeight: 700,
                  opacity: closing ? 0.5 : 1,
                }}
              >
                <XCircle style={{ width: 15, height: 15 }} />
                {closing ? 'Закрытие...' : 'Закрыть рейс'}
              </button>
            )}
            <button
              onClick={handleDelete}
              disabled={deleting}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '12px 16px', borderRadius: 12, cursor: 'pointer',
                border: '1px solid #ef444424', background: '#ef44440c',
                color: '#f87171', fontSize: 13, fontWeight: 700,
                opacity: deleting ? 0.5 : 1,
              }}
            >
              <Trash2 style={{ width: 15, height: 15 }} />
              {deleting ? 'Удаление...' : 'Удалить'}
            </button>
          </div>
        )}

        <div style={{ height: 20 }} />
      </motion.div>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ── Request Detail Modal ────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

export function RequestDetailModal({
  request, isMine, onClose, onDeleted, onClosed,
}: {
  request: AviaRequest;
  isMine: boolean;
  onClose: () => void;
  onDeleted: (id: string) => void;
  onClosed: (id: string) => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [closing, setClosing] = useState(false);
  const isReqClosed = request.status === 'closed';

  const handleDelete = async () => {
    if (!confirm('Удалить эту заявку навсегда?')) return;
    setDeleting(true);
    try {
      await deleteAviaRequest(request.id);
      onDeleted(request.id);
      onClose();
      toast.success('Заявка удалена');
    } catch { toast.error('Не удалось удалить заявку'); }
    finally { setDeleting(false); }
  };

  const handleCloseAd = async () => {
    if (!confirm('Закрыть заявку?')) return;
    setClosing(true);
    try {
      await closeAviaRequest(request.id);
      onClosed(request.id);
      onClose();
      toast.success('Заявка закрыта');
    } catch { toast.error('Не удалось закрыть заявку'); }
    finally { setClosing(false); }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 520,
          maxHeight: '92dvh', overflowY: 'auto',
          background: '#0a1220', borderRadius: '24px 24px 0 0',
          padding: 'clamp(16px, 5vw, 24px)',
          fontFamily: "'Sora', 'Inter', sans-serif",
        }}
      >
        {/* Handle bar */}
        <div style={{
          width: 36, height: 4, borderRadius: 2,
          background: '#ffffff14', margin: '0 auto 16px',
        }} />

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 20,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: 'linear-gradient(135deg, #6d28d9, #a78bfa)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Package style={{ width: 20, height: 20, color: '#fff' }} />
            </div>
            <div>
              <div style={{ fontSize: 10, color: '#4a6080', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Заявка
              </div>
              <div style={{ fontSize: 10, color: '#2a3d50', fontWeight: 500, marginTop: 1 }}>
                ID: {request.id.slice(0, 8)}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {isReqClosed && (
              <span style={{
                fontSize: 9, fontWeight: 700, color: '#f59e0b',
                padding: '4px 10px', borderRadius: 7,
                background: '#f59e0b14', border: '1px solid #f59e0b20',
                textTransform: 'uppercase', letterSpacing: '0.06em',
              }}>
                Закрыта
              </span>
            )}
            {isMine && !isReqClosed && (
              <span style={{
                fontSize: 9, fontWeight: 700, color: '#a78bfa',
                padding: '4px 10px', borderRadius: 7,
                background: '#a78bfa12', border: '1px solid #a78bfa22',
                textTransform: 'uppercase', letterSpacing: '0.06em',
              }}>
                Моя заявка
              </span>
            )}
            <button
              onClick={onClose}
              style={{
                width: 32, height: 32, borderRadius: 10,
                border: '1px solid #ffffff10', background: '#ffffff08',
                color: '#6b8299', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <X style={{ width: 16, height: 16 }} />
            </button>
          </div>
        </div>

        {/* Route Hero */}
        <div style={{
          padding: '20px 16px', borderRadius: 16,
          background: 'linear-gradient(135deg, #140c2e80, #a78bfa08)',
          border: '1px solid #a78bfa18',
          marginBottom: 16, textAlign: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
            <div>
              <MapPin style={{ width: 14, height: 14, color: '#a78bfa', margin: '0 auto 4px' }} />
              <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', letterSpacing: '-0.5px' }}>{request.from}</div>
              <div style={{ fontSize: 10, color: '#4a6080', fontWeight: 600, marginTop: 2 }}>Откуда</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '0 8px' }}>
              <div style={{ width: 40, height: 1, background: '#a78bfa30' }} />
              <Package style={{ width: 16, height: 16, color: '#a78bfa' }} />
              <div style={{ width: 40, height: 1, background: '#a78bfa30' }} />
            </div>
            <div>
              <MapPin style={{ width: 14, height: 14, color: '#34d399', margin: '0 auto 4px' }} />
              <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', letterSpacing: '-0.5px' }}>{request.to}</div>
              <div style={{ fontSize: 10, color: '#4a6080', fontWeight: 600, marginTop: 2 }}>Куда</div>
            </div>
          </div>
        </div>

        {/* Info rows */}
        <div style={{ marginBottom: 16 }}>
          <InfoRow icon={Calendar} label="Отправить до" value={fmtDate(request.beforeDate)} />
          <InfoRow icon={Weight} label="Вес посылки" value={`${request.weightKg} кг`} valueColor="#a78bfa" />
          <InfoRow icon={User} label="Отправитель" value={request.senderName || maskPhone(request.senderId)} />
          <InfoRow icon={Clock} label="Создано" value={`${fmtDateTime(request.createdAt)} · ${daysSince(request.createdAt)}`} />
        </div>

        {/* Description */}
        {request.description && (
          <div style={{
            padding: '12px 14px', borderRadius: 12,
            background: '#ffffff06', border: '1px solid #ffffff08',
            marginBottom: 16,
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              marginBottom: 6,
            }}>
              <FileText style={{ width: 12, height: 12, color: '#4a6080' }} />
              <span style={{ fontSize: 10, color: '#3d5268', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Описание
              </span>
            </div>
            <p style={{
              fontSize: 13, color: '#8ea8b8', lineHeight: 1.55,
              margin: 0, whiteSpace: 'pre-wrap',
            }}>
              {request.description}
            </p>
          </div>
        )}

        {/* Contact */}
        {!isMine && !isReqClosed && (
          <div style={{ marginBottom: 16 }}>
            <ContactInline phone={request.senderId} accentColor="#a78bfa" />
          </div>
        )}

        {/* Actions */}
        {isMine && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            {!isReqClosed && (
              <button
                onClick={handleCloseAd}
                disabled={closing}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '12px 16px', borderRadius: 12, cursor: 'pointer',
                  border: '1px solid #f59e0b24', background: '#f59e0b0c',
                  color: '#fbbf24', fontSize: 13, fontWeight: 700,
                  opacity: closing ? 0.5 : 1,
                }}
              >
                <XCircle style={{ width: 15, height: 15 }} />
                {closing ? 'Закрытие...' : 'Закрыть заявку'}
              </button>
            )}
            <button
              onClick={handleDelete}
              disabled={deleting}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '12px 16px', borderRadius: 12, cursor: 'pointer',
                border: '1px solid #ef444424', background: '#ef44440c',
                color: '#f87171', fontSize: 13, fontWeight: 700,
                opacity: deleting ? 0.5 : 1,
              }}
            >
              <Trash2 style={{ width: 15, height: 15 }} />
              {deleting ? 'Удаление...' : 'Удалить'}
            </button>
          </div>
        )}

        <div style={{ height: 20 }} />
      </motion.div>
    </motion.div>
  );
}
