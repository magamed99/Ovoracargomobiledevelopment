import { useState, useEffect, useCallback } from 'react';
import {
  Star, ThumbsUp, MessageSquare, ArrowLeft, X, ChevronDown,
  Award, Shield, Zap, Heart, Plus, RefreshCw, TrendingUp, Filter,
  BarChart2, CheckCircle2, Sparkles,
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../contexts/UserContext';
import { getReviewsForUser, submitReview } from '../api/dataApi';
import { toast } from 'sonner';
import { StarRow } from './ui/StarRow';

interface Review {
  id: string;
  author: string;
  initials: string;
  color: string;
  rating: number;
  date: string;
  trip: string;
  comment: string;
  helpful: number;
  helpedBy: string[];
  categories: { punctuality: number; reliability: number; communication: number; packaging: number };
  type: 'received' | 'given';
  verified: boolean;
  authorEmail?: string;
  targetEmail?: string;
}

const COLORS = ['#5ba3f5', '#a855f7', '#10b981', '#f43f5e', '#f59e0b', '#06b6d4'];
const AVATAR_BG = [
  'linear-gradient(135deg,#1d4ed8,#5ba3f5)',
  'linear-gradient(135deg,#7c3aed,#a855f7)',
  'linear-gradient(135deg,#059669,#10b981)',
  'linear-gradient(135deg,#dc2626,#f43f5e)',
  'linear-gradient(135deg,#d97706,#f59e0b)',
  'linear-gradient(135deg,#0891b2,#06b6d4)',
];

const CATEGORY_LABELS: Record<string, string> = {
  punctuality:   'Пунктуальность',
  reliability:   'Надёжность',
  communication: 'Коммуникация',
  packaging:     'Упаковка',
};

const CATEGORY_ICONS: Record<string, any> = {
  punctuality:   Zap,
  reliability:   Shield,
  communication: MessageSquare,
  packaging:     Award,
};

const CATEGORY_COLORS: Record<string, string> = {
  punctuality:   '#f59e0b',
  reliability:   '#5ba3f5',
  communication: '#10b981',
  packaging:     '#a855f7',
};

function RatingBadge({ rating }: { rating: number }) {
  const emoji = rating === 5 ? '😍' : rating === 4 ? '👍' : rating === 3 ? '😐' : '👎';
  const label = rating === 5 ? 'Отлично' : rating === 4 ? 'Хорошо' : rating === 3 ? 'Нейтрально' : 'Плохо';
  const color = rating >= 4 ? '#10b981' : rating === 3 ? '#f59e0b' : '#ef4444';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 11, fontWeight: 700, paddingInline: 10, paddingBlock: 4,
      borderRadius: 100, color,
      background: `${color}18`,
      borderWidth: 1, borderStyle: 'solid', borderColor: `${color}30`,
    }}>
      {emoji} {label}
    </span>
  );
}

export function ReviewsPage() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { user: currentUser } = useUser();
  const isDark = theme === 'dark';

  const [reviews, setReviews]     = useState<Review[]>([]);
  const [loading, setLoading]     = useState(true);
  const [activeTab, setActiveTab] = useState<'received' | 'given'>('received');
  const [sortBy, setSortBy]       = useState<'newest' | 'highest' | 'lowest'>('newest');
  const [showSort, setShowSort]   = useState(false);
  const [showModal, setShowModal] = useState(false);

  const [formRating,  setFormRating]  = useState(0);
  const [formComment, setFormComment] = useState('');
  const [formTrip,    setFormTrip]    = useState('');
  const [formAuthor,  setFormAuthor]  = useState('');
  const [formCats,    setFormCats]    = useState({ punctuality: 0, reliability: 0, communication: 0, packaging: 0 });

  const loadReviews = useCallback(async () => {
    if (!currentUser?.email) return;
    setLoading(true);
    try {
      const serverReviews = await getReviewsForUser(currentUser.email);
      const mapped: Review[] = serverReviews.map((r: any, i: number) => ({
        id: r.reviewId || r.id || String(i),
        author:   r.authorName || 'Пользователь',
        initials: (r.authorName || 'П').slice(0, 2).toUpperCase(),
        color:    COLORS[i % COLORS.length],
        rating:   r.rating || 0,
        date:     r.createdAt ? new Date(r.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }) : '',
        trip:     r.tripRoute || r.trip || '',
        comment:  r.comment || '',
        helpful:  r.helpful || 0,
        helpedBy: r.helpedBy || [],
        categories: r.categories || { punctuality: 0, reliability: 0, communication: 0, packaging: 0 },
        type:     r.targetEmail === currentUser.email ? 'received' : 'given',
        verified: r.verified || false,
        authorEmail: r.authorEmail,
        targetEmail: r.targetEmail,
      }));
      setReviews(mapped);
    } catch (err) {
      console.error('[ReviewsPage] ❌ Failed to load reviews:', err);
      toast.error('Не удалось загрузить отзывы');
    } finally {
      setLoading(false);
    }
  }, [currentUser?.email]);

  useEffect(() => {
    loadReviews();
    const iv = setInterval(loadReviews, 15000);
    return () => clearInterval(iv);
  }, [loadReviews]);

  const received = reviews.filter(r => r.type === 'received');
  const given    = reviews.filter(r => r.type === 'given');
  const current  = activeTab === 'received' ? received : given;

  const sorted = [...current].sort((a, b) => {
    if (sortBy === 'highest') return b.rating - a.rating;
    if (sortBy === 'lowest')  return a.rating - b.rating;
    return String(b.id).localeCompare(String(a.id));
  });

  const liveTotal = current.length;
  const liveAvg   = liveTotal ? current.reduce((s, r) => s + r.rating, 0) / liveTotal : 0;
  const liveDist  = [5, 4, 3, 2, 1].map(r => ({
    r,
    count: current.filter(x => x.rating === r).length,
    pct:   liveTotal ? (current.filter(x => x.rating === r).length / liveTotal) * 100 : 0,
  }));

  const handleHelpful = (id: string) => {
    const userId = currentUser?.email || '99';
    setReviews(reviews.map(r => {
      if (r.id !== id) return r;
      const already = r.helpedBy.includes(userId);
      return {
        ...r,
        helpful:  already ? r.helpful - 1 : r.helpful + 1,
        helpedBy: already ? r.helpedBy.filter(x => x !== userId) : [...r.helpedBy, userId],
      };
    }));
  };

  const handleSubmitReview = async () => {
    if (!formRating)           { toast.error('Укажите оценку'); return; }
    if (!formComment.trim())   { toast.error('Напишите комментарий'); return; }
    if (!formAuthor.trim())    { toast.error('Укажите имя'); return; }
    if (!currentUser?.email)   { toast.error('Войдите в аккаунт'); return; }
    try {
      await submitReview({
        authorEmail: currentUser.email,
        authorName:  formAuthor.trim(),
        targetEmail: currentUser.email,
        rating:      formRating,
        comment:     formComment.trim(),
        tripRoute:   formTrip.trim() || undefined,
        categories:  {
          punctuality:   formCats.punctuality   || formRating,
          reliability:   formCats.reliability   || formRating,
          communication: formCats.communication || formRating,
          packaging:     formCats.packaging     || formRating,
        },
        type: 'given',
      });
      setShowModal(false);
      setFormRating(0); setFormComment(''); setFormTrip(''); setFormAuthor('');
      setFormCats({ punctuality: 0, reliability: 0, communication: 0, packaging: 0 });
      setActiveTab('given');
      toast.success('Отзыв опубликован!');
      loadReviews();
    } catch (err) {
      console.error('[ReviewsPage] Submit review failed:', err);
      toast.error('Не удалось отправить отзыв');
    }
  };

  /* ────────── Mobile styles ────────── */
  const bg      = 'bg-[#0E1621]';
  const txt     = isDark ? 'text-white' : 'text-[#0f172a]';
  const sub     = isDark ? 'text-[#64748b]' : 'text-slate-500';
  const divider = isDark ? 'border-white/[0.06]' : 'border-black/[0.06]';
  const hover   = isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-black/[0.02]';
  const inpCls  = `w-full px-4 py-3 border text-[14px] outline-none focus:border-[#1978e5] transition-colors ${isDark ? `bg-transparent border-white/[0.1] text-white placeholder-[#475569]` : `bg-transparent border-black/[0.1] text-[#0f172a] placeholder-slate-400`}`;

  /* ══════════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════════════ */
  return (
    <div className={`font-['Sora'] ${bg} ${txt} min-h-screen`}>

      {/* ════════════════ MOBILE (unchanged) ════════════════ */}
      <div className="md:hidden flex flex-col min-h-screen max-w-3xl mx-auto">
        <header className={`sticky top-0 z-20 flex items-center justify-between px-4 py-3 border-b backdrop-blur-xl bg-[#0E1621]/95 border-white/[0.06]`}>
          <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center active:scale-90 text-white">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-[18px] font-bold text-white">Отзывы</h1>
          <button onClick={() => setShowModal(true)} className="w-9 h-9 flex items-center justify-center text-[#1978e5] active:scale-90">
            <Plus className="w-5 h-5" />
          </button>
        </header>

        <div className={`border-b ${divider}`}>
          <div className="flex">
            <div className={`flex flex-col items-center justify-center px-6 py-5 border-r ${divider}`}>
              <span className={`text-5xl font-extrabold leading-none ${txt}`}>{liveTotal ? liveAvg.toFixed(1) : '—'}</span>
              <div className="mt-2"><StarRow value={Math.round(liveAvg)} size="sm" /></div>
              <span className={`text-[11px] mt-1 ${sub}`}>{liveTotal} отзывов</span>
            </div>
            <div className="flex-1 flex flex-col justify-center px-4 py-4 gap-1.5">
              {liveDist.map(d => (
                <div key={d.r} className="flex items-center gap-2">
                  <span className={`text-[11px] font-bold w-3 text-right ${sub}`}>{d.r}</span>
                  <Star className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400 shrink-0" />
                  <div className={`flex-1 h-1.5 overflow-hidden ${isDark ? 'bg-white/10' : 'bg-black/10'}`}>
                    <div className="h-full transition-all duration-700"
                      style={{ width: `${d.pct}%`, background: d.r >= 4 ? '#22c55e' : d.r === 3 ? '#f59e0b' : '#ef4444' }} />
                  </div>
                  <span className={`text-[11px] w-3 text-right ${sub}`}>{d.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={`flex border-b ${divider}`}>
          {[
            { key: 'received', label: 'Полученные', count: received.length },
            { key: 'given',    label: 'Оставленные', count: given.length },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
              className={`relative flex-1 flex items-center justify-center gap-2 py-3 text-[14px] font-semibold transition-colors ${activeTab === tab.key ? txt : sub}`}>
              {tab.label}
              <span className={`text-[11px] font-bold min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center ${activeTab === tab.key ? 'bg-[#1978e5] text-white' : 'bg-white/10 text-slate-500'}`}>{tab.count}</span>
              {activeTab === tab.key && <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-[#1978e5]" />}
            </button>
          ))}
        </div>

        <div className={`flex items-center justify-between px-4 py-2.5 border-b ${divider}`}>
          <span className={`text-[12px] ${sub}`}>{sorted.length} отзывов</span>
          <div className="relative">
            <button onClick={() => setShowSort(v => !v)} className="flex items-center gap-1 text-[12px] font-semibold text-[#1978e5]">
              {sortBy === 'newest' ? 'Новые' : sortBy === 'highest' ? 'Высокий ★' : 'Низкий ★'}
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showSort ? 'rotate-180' : ''}`} />
            </button>
            {showSort && (
              <div className={`absolute right-0 top-7 w-44 z-50 border shadow-2xl bg-[#0E1621] border-white/[0.08]`}>
                {[{ key: 'newest', label: 'Сначала новые' }, { key: 'highest', label: 'Высокий рейтинг' }, { key: 'lowest', label: 'Низкий рейтинг' }].map(opt => (
                  <button key={opt.key} onClick={() => { setSortBy(opt.key as any); setShowSort(false); }}
                    className={`w-full text-left px-4 py-3 text-[13px] font-medium border-b last:border-b-0 ${divider} ${sortBy === opt.key ? 'text-[#1978e5]' : `${txt} ${hover}`}`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 pb-28">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin w-8 h-8 border-2 border-t-[#1978e5] rounded-full border-white/10" />
            </div>
          ) : sorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <MessageSquare className="w-12 h-12 text-[#64748b]" strokeWidth={1.5} />
              <p className="text-[15px] font-bold text-white">Пока нет отзывов</p>
              <p className="text-[13px] text-center px-8 text-[#64748b]">Отзывы появятся после завершения поездок</p>
            </div>
          ) : (
            sorted.map(review => {
              const liked = review.helpedBy.includes(currentUser?.email || '99');
              return (
                <div key={review.id} className={`border-b ${divider}`}>
                  <div className="px-4 pt-4 pb-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                        style={{ background: AVATAR_BG[reviews.indexOf(review) % AVATAR_BG.length] }}>
                        {review.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="font-bold text-[14px] text-white">{review.author}</h3>
                          {review.verified && (
                            <span className="flex items-center gap-0.5 text-[10px] font-semibold text-emerald-500">
                              <Shield className="w-2.5 h-2.5" /> Верифицирован
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <StarRow value={review.rating} size="sm" />
                          <span className={`text-[11px] font-bold ${review.rating >= 4 ? 'text-yellow-500' : review.rating >= 3 ? 'text-orange-400' : 'text-red-400'}`}>{review.rating}.0</span>
                        </div>
                        <p className="text-[11px] mt-0.5 text-[#64748b]">{review.trip} {review.trip && review.date ? '·' : ''} {review.date}</p>
                      </div>
                    </div>
                    <p className="text-[13px] leading-relaxed mt-3 text-[#64748b]">{review.comment}</p>
                  </div>
                  <div className={`px-4 py-3 grid grid-cols-2 gap-x-4 gap-y-2 border-t ${divider} bg-white/[0.02]`}>
                    {Object.entries(CATEGORY_LABELS).map(([key, label]) => {
                      const val = review.categories[key as keyof typeof review.categories];
                      return (
                        <div key={key} className="flex items-center gap-2">
                          <span className="text-[10px] w-20 shrink-0 text-[#64748b]">{label}</span>
                          <div className="flex-1 h-1.5 overflow-hidden bg-white/10">
                            <div className="h-full bg-[#1978e5]" style={{ width: `${(val / 5) * 100}%` }} />
                          </div>
                          <span className="text-[10px] font-bold w-4 text-right text-white">{val}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className={`px-4 py-2 flex items-center justify-between border-t ${divider}`}>
                    <button onClick={() => handleHelpful(review.id)}
                      className={`flex items-center gap-1.5 text-[12px] font-semibold transition-colors ${liked ? 'text-[#1978e5]' : 'text-[#64748b]'}`}>
                      <ThumbsUp className={`w-3.5 h-3.5 ${liked ? 'fill-[#1978e5]' : ''}`} />
                      Полезно {review.helpful > 0 && `(${review.helpful})`}
                    </button>
                    <span className="text-[10px] text-[#64748b]">
                      {review.rating === 5 ? '😍 Отлично' : review.rating === 4 ? '👍 Хорошо' : review.rating === 3 ? '😐 Нейтрально' : '👎 Плохо'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {showModal && (
          <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={() => setShowModal(false)}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div className="relative w-full max-w-md pb-10 shadow-2xl bg-[#0E1621]" onClick={e => e.stopPropagation()}>
              <div className="w-10 h-1 rounded-full mx-auto mt-3 mb-4 bg-slate-500/30" />
              <div className={`flex items-center justify-between px-4 pb-3 border-b ${divider}`}>
                <h2 className="text-[17px] font-bold text-white">Написать отзыв</h2>
                <button onClick={() => setShowModal(false)} className="w-8 h-8 flex items-center justify-center text-[#64748b]"><X className="w-4 h-4" /></button>
              </div>
              <div className="px-4 pt-4 space-y-4">
                <div className="flex flex-col items-center">
                  <p className="text-[13px] font-semibold mb-2 text-[#64748b]">Общая оценка</p>
                  <StarRow value={formRating} onChange={setFormRating} size="lg" />
                  <span className="text-[12px] mt-1 text-[#64748b]">
                    {formRating === 5 ? 'Отлично!' : formRating === 4 ? 'Хорошо' : formRating === 3 ? 'Нейтрально' : formRating === 2 ? 'Плохо' : formRating === 1 ? 'Ужасно' : 'Нажмите на звезду'}
                  </span>
                </div>
                <div className={`border-t border-b pt-3 pb-3 space-y-3 ${divider}`}>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-[#64748b]">Детальная оценка</p>
                  {Object.entries(CATEGORY_LABELS).map(([key, label]) => {
                    const Icon = CATEGORY_ICONS[key];
                    return (
                      <div key={key} className="flex items-center gap-3">
                        <Icon className="w-4 h-4 shrink-0 text-[#64748b]" />
                        <span className="text-[12px] w-28 shrink-0 text-[#64748b]">{label}</span>
                        <StarRow value={formCats[key as keyof typeof formCats]} onChange={v => setFormCats(p => ({ ...p, [key]: v }))} size="sm" />
                      </div>
                    );
                  })}
                </div>
                <input type="text" placeholder="Ваше имя *" value={formAuthor} onChange={e => setFormAuthor(e.target.value)} className={inpCls} />
                <input type="text" placeholder="Маршрут (например: Душанбе → Москва)" value={formTrip} onChange={e => setFormTrip(e.target.value)} className={inpCls} />
                <textarea rows={3} placeholder="Напишите ваш отзыв... *" value={formComment} onChange={e => setFormComment(e.target.value)} className={`${inpCls} resize-none`} />
                <button onClick={handleSubmitReview}
                  className="w-full h-12 bg-[#1978e5] hover:bg-[#1565c0] text-white font-bold transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                  <Heart className="w-4 h-4" />
                  Опубликовать отзыв
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ════════════════ DESKTOP ════════════════ */}
      <div className="hidden md:block min-h-screen" style={{ background: '#080f1a' }}>
        <style>{`
          @keyframes rv-up   { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }
          @keyframes rv-in   { from { opacity:0; } to { opacity:1; } }
          @keyframes rv-card { from { opacity:0; transform:translateY(12px) scale(.98); } to { opacity:1; transform:translateY(0) scale(1); } }
          @keyframes rv-bar  { from { width:0; } to { width:var(--w); } }
          .rv-section { animation: rv-up .45s cubic-bezier(.22,1,.36,1) both; }
          .rv-section:nth-child(1){ animation-delay:.05s }
          .rv-section:nth-child(2){ animation-delay:.12s }
          .rv-section:nth-child(3){ animation-delay:.19s }
          .rv-card-item { animation: rv-card .4s cubic-bezier(.22,1,.36,1) both; }
          .rv-tab {
            position:relative; padding: 10px 20px; border-radius:12px; font-size:13px;
            font-weight:700; cursor:pointer; transition: background .2s, color .2s;
            border:none; font-family:inherit;
          }
          .rv-tab-active { background:#1e3a55; color:#5ba3f5; }
          .rv-tab-inactive { background:transparent; color:#4a6580; }
          .rv-tab-inactive:hover { background:#0f1e30; color:#7a9ab5; }
          .rv-sort-btn {
            display:flex; align-items:center; gap:6px; padding:8px 14px;
            border-radius:10px; font-size:12px; font-weight:700; cursor:pointer;
            border:1px solid #1e2d3d; background:#0e1e32; color:#5ba3f5;
            font-family:inherit; transition: border-color .2s, background .2s;
          }
          .rv-sort-btn:hover { background:#111f33; border-color:#2a4060; }
          .rv-review-card {
            border-radius:20px; overflow:hidden;
            border: 1px solid #1a2d42;
            transition: border-color .2s ease, box-shadow .2s ease, transform .2s ease;
          }
          .rv-review-card:hover {
            border-color: #2a4060;
            box-shadow: 0 8px 32px #00000050;
            transform: translateY(-2px);
          }
          .rv-helpful-btn {
            display:flex; align-items:center; gap:6px; padding:6px 14px;
            border-radius:10px; font-size:12px; font-weight:700; cursor:pointer;
            border:none; font-family:inherit;
            transition: background .2s, color .2s;
          }
          .rv-write-btn {
            width:100%; display:flex; align-items:center; justify-content:center; gap:8px;
            padding:13px; border-radius:16px; font-size:14px; font-weight:800;
            cursor:pointer; border:none; font-family:inherit; color:#fff;
            background: linear-gradient(135deg,#1d4ed8,#5ba3f5);
            box-shadow: 0 8px 24px #1d4ed840;
            transition: transform .2s ease, box-shadow .2s ease;
          }
          .rv-write-btn:hover { transform:translateY(-2px); box-shadow:0 12px 32px #1d4ed855; }
          .rv-write-btn:active { transform:scale(.98); }
          .rv-modal-inp {
            width:100%; padding:12px 16px; border-radius:12px; font-size:14px;
            font-weight:500; outline:none; font-family:inherit; color:#e2e8f0;
            background:#0a1520; border:1px solid #1e2d3d;
            transition: border-color .2s;
          }
          .rv-modal-inp:focus { border-color:#5ba3f550; }
          .rv-modal-inp::placeholder { color:#3a5570; }
          .rv-cat-bar { animation: rv-bar .7s cubic-bezier(.22,1,.36,1) .3s both; }
        `}</style>

        {/* ── TOP BAR ── */}
        <div style={{ background: '#0a1220', borderBottomWidth:1, borderBottomStyle:'solid', borderBottomColor:'#ffffff08', animation:'rv-in .3s ease both' }}>
          <div className="max-w-7xl mx-auto px-10 py-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate(-1)}
                className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                style={{ background:'#ffffff0a', borderWidth:1, borderStyle:'solid', borderColor:'#ffffff0f', color:'#8a9bb0' }}>
                <ArrowLeft style={{ width:18, height:18 }} />
              </button>
              <div>
                <p style={{ fontSize:10, fontWeight:800, letterSpacing:'.18em', textTransform:'uppercase', color:'#3a5570' }}>Аккаунт</p>
                <h1 style={{ fontSize:22, fontWeight:900, color:'#fff', lineHeight:1.2 }}>Мои отзывы</h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={loadReviews}
                className="flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
                style={{ padding:'8px 16px', borderRadius:12, background:'#ffffff08', borderWidth:1, borderStyle:'solid', borderColor:'#ffffff0f', fontSize:12, fontWeight:700, color:'#607080' }}>
                <RefreshCw style={{ width:14, height:14 }} />
                Обновить
              </button>
              <button onClick={() => setShowModal(true)} className="rv-write-btn" style={{ width:'auto', padding:'8px 20px', fontSize:13 }}>
                <Plus style={{ width:16, height:16 }} />
                Написать отзыв
              </button>
            </div>
          </div>
        </div>

        {/* ── BODY ── */}
        <div className="max-w-7xl mx-auto px-10 py-8 flex gap-8 items-start">

          {/* ── LEFT SIDEBAR ── */}
          <div className="w-[300px] flex-shrink-0 flex flex-col gap-5 sticky top-8">

            {/* Rating Card */}
            <div className="rv-section rounded-3xl overflow-hidden"
              style={{ background:'linear-gradient(160deg,#0f1f38,#0c1624)', borderWidth:1, borderStyle:'solid', borderColor:'#1a2d45', boxShadow:'0 24px 48px #00000060' }}>
              {/* Gradient stripe */}
              <div style={{ height:3, background:'linear-gradient(90deg,#1d4ed8,#5ba3f5,#10b981)' }} />
              <div style={{ padding:24 }}>
                {/* Score */}
                <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:20 }}>
                  <div style={{ textAlign:'center' }}>
                    <p style={{ fontSize:56, fontWeight:900, color:'#fff', lineHeight:1 }}>{liveTotal ? liveAvg.toFixed(1) : '—'}</p>
                    <div style={{ marginTop:6 }}><StarRow value={Math.round(liveAvg)} size="sm" /></div>
                    <p style={{ fontSize:11, color:'#4a6580', marginTop:4 }}>{liveTotal} отзывов</p>
                  </div>
                  <div style={{ flex:1 }}>
                    {liveDist.map(d => (
                      <div key={d.r} style={{ display:'flex', alignItems:'center', gap:6, marginBottom:5 }}>
                        <span style={{ fontSize:11, fontWeight:700, color:'#4a6580', width:8, textAlign:'right' }}>{d.r}</span>
                        <Star style={{ width:10, height:10, fill:'#fbbf24', color:'#fbbf24', flexShrink:0 }} />
                        <div style={{ flex:1, height:5, borderRadius:100, background:'#0f1e30', overflow:'hidden' }}>
                          <div className="rv-cat-bar"
                            style={{
                              height:'100%', borderRadius:100,
                              background: d.r >= 4 ? '#10b981' : d.r === 3 ? '#f59e0b' : '#ef4444',
                              '--w': `${d.pct}%`,
                            } as React.CSSProperties} />
                        </div>
                        <span style={{ fontSize:10, color:'#2a4060', width:14, textAlign:'right' }}>{d.count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Stat chips */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  {[
                    { label:'Получено', val: received.length, icon: TrendingUp, color:'#5ba3f5' },
                    { label:'Оставлено', val: given.length, icon: BarChart2, color:'#10b981' },
                  ].map(({ label, val, icon: Icon, color }) => (
                    <div key={label} style={{ background:'#0a1520', borderRadius:14, padding:'12px 14px', borderWidth:1, borderStyle:'solid', borderColor:'#1a2d3d' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
                        <Icon style={{ width:13, height:13, color }} />
                        <span style={{ fontSize:10, color:'#3a5570', fontWeight:700, textTransform:'uppercase', letterSpacing:'.1em' }}>{label}</span>
                      </div>
                      <p style={{ fontSize:24, fontWeight:900, color:'#fff', lineHeight:1 }}>{val}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Write review CTA */}
            <div className="rv-section">
              <button onClick={() => setShowModal(true)} className="rv-write-btn">
                <Sparkles style={{ width:16, height:16 }} />
                Написать отзыв
              </button>
            </div>

            {/* Filter Card */}
            <div className="rv-section rounded-2xl overflow-hidden"
              style={{ background:'#0e1e32', borderWidth:1, borderStyle:'solid', borderColor:'#1a2d42' }}>
              <div style={{ padding:'14px 16px', borderBottomWidth:1, borderBottomStyle:'solid', borderBottomColor:'#1a2d3d', display:'flex', alignItems:'center', gap:8 }}>
                <Filter style={{ width:14, height:14, color:'#4a6580' }} />
                <span style={{ fontSize:11, fontWeight:800, textTransform:'uppercase', letterSpacing:'.14em', color:'#3a5570' }}>Фильтры</span>
              </div>
              <div style={{ padding:12 }}>
                <p style={{ fontSize:10, fontWeight:700, color:'#2a4060', textTransform:'uppercase', letterSpacing:'.1em', marginBottom:8, paddingLeft:4 }}>Тип</p>
                {[
                  { key: 'received', label: 'Полученные', count: received.length },
                  { key: 'given',    label: 'Оставленные', count: given.length },
                ].map(tab => (
                  <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
                    className={`rv-tab ${activeTab === tab.key ? 'rv-tab-active' : 'rv-tab-inactive'}`}
                    style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
                    <span>{tab.label}</span>
                    <span style={{ fontSize:11, fontWeight:800, minWidth:22, height:22, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:100, background: activeTab === tab.key ? '#5ba3f530' : '#0a1520', color: activeTab === tab.key ? '#5ba3f5' : '#3a5570' }}>
                      {tab.count}
                    </span>
                  </button>
                ))}

                <p style={{ fontSize:10, fontWeight:700, color:'#2a4060', textTransform:'uppercase', letterSpacing:'.1em', marginBottom:8, marginTop:12, paddingLeft:4 }}>Сортировка</p>
                {[
                  { key: 'newest',  label: 'Сначала новые' },
                  { key: 'highest', label: 'Высокий рейтинг' },
                  { key: 'lowest',  label: 'Низкий рейтинг' },
                ].map(opt => (
                  <button key={opt.key} onClick={() => setSortBy(opt.key as any)}
                    className={`rv-tab ${sortBy === opt.key ? 'rv-tab-active' : 'rv-tab-inactive'}`}
                    style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'flex-start', gap:8, marginBottom:3 }}>
                    <span style={{ width:6, height:6, borderRadius:'50%', background: sortBy === opt.key ? '#5ba3f5' : '#1e2d3d', flexShrink:0, display:'inline-block' }} />
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── RIGHT: Reviews ── */}
          <div className="flex-1 min-w-0">

            {/* Count bar */}
            <div className="rv-section" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <p style={{ fontSize:14, fontWeight:700, color:'#fff' }}>
                  {activeTab === 'received' ? 'Полученные отзывы' : 'Оставленные отзывы'}
                </p>
                <span style={{ fontSize:11, fontWeight:800, padding:'3px 10px', borderRadius:100, background:'#1e3a55', color:'#5ba3f5' }}>
                  {sorted.length}
                </span>
              </div>
              <div style={{ fontSize:12, color:'#3a5570', fontWeight:600 }}>
                {sortBy === 'newest' ? '↓ Новые первые' : sortBy === 'highest' ? '↓ Высокий рейтинг' : '↑ Низкий рейтинг'}
              </div>
            </div>

            {/* List */}
            {loading ? (
              <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'80px 0' }}>
                <div style={{ width:40, height:40, borderRadius:'50%', borderWidth:3, borderStyle:'solid', borderColor:'#1e2d3d', borderTopColor:'#5ba3f5', animation:'spin 1s linear infinite' }} />
              </div>
            ) : sorted.length === 0 ? (
              <div className="rv-section" style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'80px 0', gap:16 }}>
                <div style={{ width:72, height:72, borderRadius:24, display:'flex', alignItems:'center', justifyContent:'center', background:'#0e1e32', borderWidth:1, borderStyle:'solid', borderColor:'#1a2d42' }}>
                  <MessageSquare style={{ width:32, height:32, color:'#2a4060' }} />
                </div>
                <p style={{ fontSize:18, fontWeight:800, color:'#fff' }}>Пока нет отзывов</p>
                <p style={{ fontSize:14, color:'#3a5570', textAlign:'center', maxWidth:300, lineHeight:1.6 }}>
                  Отзывы появятся после завершения поездок
                </p>
                <button onClick={() => setShowModal(true)} className="rv-write-btn" style={{ width:'auto', padding:'10px 24px' }}>
                  <Plus style={{ width:16, height:16 }} /> Написать первый отзыв
                </button>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                {sorted.map((review, idx) => {
                  const liked = review.helpedBy.includes(currentUser?.email || '99');
                  const avatarBg = AVATAR_BG[idx % AVATAR_BG.length];
                  const accentColor = COLORS[idx % COLORS.length];
                  return (
                    <div key={review.id} className="rv-review-card rv-card-item"
                      style={{ background:'linear-gradient(145deg,#0e1e32,#0a1520)', animationDelay:`${idx * 55}ms` }}>

                      {/* Top accent line */}
                      <div style={{ height:2, background:`linear-gradient(90deg,${accentColor},${accentColor}40,transparent)` }} />

                      <div style={{ padding:24 }}>
                        {/* Author row */}
                        <div style={{ display:'flex', alignItems:'flex-start', gap:14, marginBottom:16 }}>
                          <div style={{ width:48, height:48, borderRadius:16, display:'flex', alignItems:'center', justifyContent:'center', background:avatarBg, flexShrink:0, fontSize:16, fontWeight:900, color:'#fff', boxShadow:`0 4px 16px ${accentColor}30` }}>
                            {review.initials}
                          </div>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                              <h3 style={{ fontSize:16, fontWeight:800, color:'#fff' }}>{review.author}</h3>
                              {review.verified && (
                                <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:10, fontWeight:700, color:'#10b981', background:'#10b98115', padding:'3px 8px', borderRadius:100, borderWidth:1, borderStyle:'solid', borderColor:'#10b98130' }}>
                                  <CheckCircle2 style={{ width:10, height:10 }} /> Верифицирован
                                </span>
                              )}
                              <RatingBadge rating={review.rating} />
                            </div>
                            <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:4 }}>
                              <StarRow value={review.rating} size="sm" />
                              <span style={{ fontSize:12, fontWeight:800, color:'#fbbf24' }}>{review.rating}.0</span>
                            </div>
                            {(review.trip || review.date) && (
                              <p style={{ fontSize:11, color:'#3a5570', marginTop:3 }}>
                                {review.trip}{review.trip && review.date ? ' · ' : ''}{review.date}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Comment */}
                        <p style={{ fontSize:14, lineHeight:1.7, color:'#8a9bb0', marginBottom:20, paddingLeft:4 }}>
                          {review.comment}
                        </p>

                        {/* Category bars */}
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px 24px', padding:'16px', borderRadius:14, background:'#080f1a', marginBottom:16 }}>
                          {Object.entries(CATEGORY_LABELS).map(([key, label]) => {
                            const val = review.categories[key as keyof typeof review.categories];
                            const catColor = CATEGORY_COLORS[key];
                            const CatIcon = CATEGORY_ICONS[key];
                            return (
                              <div key={key}>
                                <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:5 }}>
                                  <CatIcon style={{ width:11, height:11, color:catColor }} />
                                  <span style={{ fontSize:10, color:'#3a5570', fontWeight:600 }}>{label}</span>
                                  <span style={{ marginLeft:'auto', fontSize:10, fontWeight:800, color:catColor }}>{val}/5</span>
                                </div>
                                <div style={{ height:5, borderRadius:100, background:'#0f1e30', overflow:'hidden' }}>
                                  <div className="rv-cat-bar"
                                    style={{ height:'100%', borderRadius:100, background:catColor, '--w': `${(val/5)*100}%` } as React.CSSProperties} />
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Footer */}
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingTop:12, borderTopWidth:1, borderTopStyle:'solid', borderTopColor:'#1a2d3d' }}>
                          <button
                            className="rv-helpful-btn"
                            onClick={() => handleHelpful(review.id)}
                            style={{ background: liked ? '#1d4ed820' : '#0a1520', color: liked ? '#5ba3f5' : '#4a6580', borderWidth:1, borderStyle:'solid', borderColor: liked ? '#5ba3f540' : '#1a2d3d' }}>
                            <ThumbsUp style={{ width:13, height:13, fill: liked ? '#5ba3f5' : 'none' }} />
                            Полезно {review.helpful > 0 && `· ${review.helpful}`}
                          </button>
                          <p style={{ fontSize:11, color:'#2a4060' }}>
                            {review.type === 'received' ? 'Получен' : 'Оставлен'} · #{review.id.toString().slice(-4)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── DESKTOP MODAL ── */}
        {showModal && (
          <div style={{ position:'fixed', inset:0, zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}
            onClick={() => setShowModal(false)}>
            <div style={{ position:'absolute', inset:0, background:'#00000080', backdropFilter:'blur(8px)' }} />
            <div
              onClick={e => e.stopPropagation()}
              style={{
                position:'relative', width:'100%', maxWidth:520,
                borderRadius:28, overflow:'hidden',
                background:'linear-gradient(160deg,#0f1f38,#0a1520)',
                borderWidth:1, borderStyle:'solid', borderColor:'#1e2d45',
                boxShadow:'0 32px 80px #00000090, 0 0 0 1px #5ba3f510',
                animation:'rv-card .3s cubic-bezier(.34,1.56,.64,1) both',
              }}>
              {/* Top gradient */}
              <div style={{ height:3, background:'linear-gradient(90deg,#1d4ed8,#5ba3f5,#10b981)' }} />

              {/* Header */}
              <div style={{ padding:'20px 24px', borderBottomWidth:1, borderBottomStyle:'solid', borderBottomColor:'#1a2d3d', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ width:36, height:36, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(135deg,#1d4ed8,#5ba3f5)' }}>
                    <Heart style={{ width:16, height:16, color:'#fff' }} />
                  </div>
                  <div>
                    <p style={{ fontSize:10, fontWeight:800, color:'#3a5570', textTransform:'uppercase', letterSpacing:'.14em' }}>Новый отзыв</p>
                    <h2 style={{ fontSize:18, fontWeight:900, color:'#fff' }}>Написать отзыв</h2>
                  </div>
                </div>
                <button onClick={() => setShowModal(false)}
                  style={{ width:36, height:36, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', background:'#ffffff08', borderWidth:1, borderStyle:'solid', borderColor:'#ffffff10', color:'#4a6580', cursor:'pointer' }}>
                  <X style={{ width:16, height:16 }} />
                </button>
              </div>

              {/* Body */}
              <div style={{ padding:'24px', display:'flex', flexDirection:'column', gap:20, maxHeight:'70vh', overflowY:'auto' }}>

                {/* Stars */}
                <div style={{ textAlign:'center' }}>
                  <p style={{ fontSize:12, fontWeight:700, color:'#3a5570', marginBottom:10, textTransform:'uppercase', letterSpacing:'.12em' }}>Общая оценка</p>
                  <div style={{ display:'flex', justifyContent:'center', marginBottom:8 }}>
                    <StarRow value={formRating} onChange={setFormRating} size="lg" />
                  </div>
                  <span style={{ fontSize:13, color: formRating ? '#5ba3f5' : '#2a4060' }}>
                    {formRating === 5 ? '✨ Отлично!' : formRating === 4 ? '👍 Хорошо' : formRating === 3 ? '😐 Нейтрально' : formRating === 2 ? '😕 Плохо' : formRating === 1 ? '😞 Ужасно' : 'Нажмите на звезду'}
                  </span>
                </div>

                {/* Category ratings */}
                <div style={{ background:'#080f1a', borderRadius:16, padding:16, borderWidth:1, borderStyle:'solid', borderColor:'#1a2d3d' }}>
                  <p style={{ fontSize:10, fontWeight:800, color:'#2a4060', textTransform:'uppercase', letterSpacing:'.14em', marginBottom:12 }}>Детальная оценка</p>
                  <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                    {Object.entries(CATEGORY_LABELS).map(([key, label]) => {
                      const Icon = CATEGORY_ICONS[key];
                      const c = CATEGORY_COLORS[key];
                      return (
                        <div key={key} style={{ display:'flex', alignItems:'center', gap:10 }}>
                          <Icon style={{ width:15, height:15, flexShrink:0, color:c }} />
                          <span style={{ fontSize:12, color:'#4a6580', width:110, flexShrink:0 }}>{label}</span>
                          <StarRow value={formCats[key as keyof typeof formCats]} onChange={v => setFormCats(p => ({ ...p, [key]: v }))} size="sm" />
                        </div>
                      );
                    })}
                  </div>
                </div>

                <input type="text" placeholder="Ваше имя *" value={formAuthor}
                  onChange={e => setFormAuthor(e.target.value)} className="rv-modal-inp" />
                <input type="text" placeholder="Маршрут (например: Душанбе → Москва)" value={formTrip}
                  onChange={e => setFormTrip(e.target.value)} className="rv-modal-inp" />
                <textarea rows={4} placeholder="Напишите ваш отзыв... *" value={formComment}
                  onChange={e => setFormComment(e.target.value)}
                  className="rv-modal-inp" style={{ resize:'none' }} />

                <button onClick={handleSubmitReview} className="rv-write-btn">
                  <Heart style={{ width:16, height:16 }} />
                  Опубликовать отзыв
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
