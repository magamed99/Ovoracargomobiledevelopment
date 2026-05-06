import { useState, useEffect, useRef } from 'react';
import {
  Plus, Pencil, Trash2, Eye, EyeOff, GripVertical, ExternalLink,
  Image, AlertCircle, CheckCircle2, X, Save, Video, Link2,
  Play, Film, Upload, Loader2, CloudUpload, Sparkles
} from 'lucide-react';
import { getAdminAds, createAdminAd, updateAdminAd, deleteAdminAd, uploadAdMedia } from '../../api/dataApi';

interface Ad {
  id: string;
  emoji: string;
  badge: string;
  title: string;
  description: string;
  image: string;
  videoUrl?: string;
  url: string;
  isActive: boolean;
  order: number;
  placement: string;
  createdAt: string;
  updatedAt: string;
}

type FormState = Omit<Ad, 'id' | 'createdAt' | 'updatedAt'>;

const EMPTY_AD: FormState = {
  emoji: '🚚',
  badge: '',
  title: '',
  description: '',
  image: '',
  videoUrl: '',
  url: '',
  isActive: true,
  order: 0,
  placement: 'all',
};

// ── detect if a url is a video ──────────────────────────────────────
function isVideoUrl(url: string): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  return (
    lower.includes('youtube.com') ||
    lower.includes('youtu.be') ||
    lower.includes('vimeo.com') ||
    lower.includes('rutube.ru') ||
    /\.(mp4|webm|ogg|mov)(\?|$)/.test(lower)
  );
}

// ── convert youtube/vimeo/rutube to embed url ───────────────────────
function toEmbedUrl(url: string): string | null {
  if (!url) return null;
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&mute=1&rel=0&controls=0&loop=1&playlist=${ytMatch[1]}`;
  const vmMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vmMatch) return `https://player.vimeo.com/video/${vmMatch[1]}?autoplay=1&muted=1&loop=1&background=1`;
  const rtMatch = url.match(/rutube\.ru\/video\/([a-f0-9]+)/);
  if (rtMatch) return `https://rutube.ru/play/embed/${rtMatch[1]}?autoplay=1&mute=1`;
  return null;
}

// ── media preview ───────────────────────────────────────────────────
function MediaPreview({ imageUrl, videoUrl, emoji, badge, title, description }: {
  imageUrl?: string; videoUrl?: string; emoji?: string;
  badge?: string; title?: string; description?: string;
}) {
  const embed = videoUrl ? toEmbedUrl(videoUrl) : null;
  const isDirect = videoUrl && /\.(mp4|webm|ogg|mov)(\?|$)/i.test(videoUrl);

  return (
    <div className="block rounded-3xl overflow-hidden border border-slate-200/80 bg-white/80"
      style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,0.8)' }}>
      <div className="relative h-32 overflow-hidden">
        {!embed && !isDirect && (
          <div className="absolute inset-0 bg-gradient-to-r from-[#1978e5]/90 via-[#1978e5]/70 to-transparent z-10" />
        )}
        {imageUrl ? (
          <img src={imageUrl} alt="preview" className="absolute inset-0 w-full h-full object-cover"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#1978e5] to-[#1565c0]" />
        )}
        {videoUrl && embed && (
          <div className="absolute inset-0 z-20">
            <iframe src={embed} className="absolute inset-0 w-full h-full" allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              title="video preview" />
          </div>
        )}
        {videoUrl && isDirect && !embed && (
          <video src={videoUrl} className="absolute inset-0 w-full h-full object-cover z-20" autoPlay muted loop playsInline />
        )}
        {!embed && !isDirect && (
          <div className="relative z-20 h-full flex flex-col justify-center px-5">
            <div className="text-white">
              <div className="text-xs uppercase tracking-wider font-bold mb-1 opacity-90">{emoji || '🚚'} {badge || 'Метка'}</div>
              <h3 className="text-lg font-bold leading-tight mb-1">
                {title ? title.split('\n').map((line, i, arr) => (
                  <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
                )) : <span className="opacity-50">Заголовок баннера</span>}
              </h3>
              <p className="text-xs opacity-90">{description || <span className="opacity-50">Описание</span>}</p>
            </div>
          </div>
        )}
        <div className="absolute top-2 right-2 z-30 px-2 py-0.5 rounded text-[10px] font-bold bg-black/20 text-white">Реклама</div>
      </div>
    </div>
  );
}

// ── file/url upload widget ──────────────────────────────────────────
function MediaUploader({
  label, hint, value, onChange, type = 'image',
}: {
  label: string; hint?: string; value: string;
  onChange: (url: string) => void; type?: 'image' | 'video';
}) {
  const [tab, setTab] = useState<'url' | 'file'>('file');
  const [inputVal, setInputVal] = useState(value);
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState<string | null>(null);
  const [uploadOk, setUploadOk] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { setInputVal(value); }, [value]);

  const handleUrlChange = (v: string) => {
    setInputVal(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onChange(v), 400);
  };

  const doUpload = async (file: File) => {
    setUploading(true);
    setUploadErr(null);
    setUploadOk(false);
    try {
      const url = await uploadAdMedia(file, type);
      onChange(url);
      setInputVal(url);
      setUploadOk(true);
      setTimeout(() => setUploadOk(false), 3000);
    } catch (e: any) {
      setUploadErr(e.message || 'Ошибка загрузки');
    } finally {
      setUploading(false);
    }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) doUpload(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) doUpload(f);
  };

  const accept = type === 'image' ? 'image/jpeg,image/png,image/webp,image/gif' : 'video/mp4,video/webm,video/ogg,video/quicktime';
  const isVideo = type === 'video' || isVideoUrl(inputVal);
  const iconColor = type === 'video' ? 'text-purple-500' : 'text-blue-500';

  return (
    <div>
      {/* Label */}
      <label className="block text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
        {type === 'video' ? <Video className={`w-3.5 h-3.5 ${iconColor}`} /> : <Image className={`w-3.5 h-3.5 ${iconColor}`} />}
        {label}
      </label>

      {/* Tab toggle */}
      <div className="flex rounded-xl overflow-hidden border border-gray-200 mb-3 bg-gray-50 p-0.5 gap-0.5">
        <button type="button" onClick={() => setTab('file')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${tab === 'file' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
          <CloudUpload className="w-3.5 h-3.5" /> Загрузить файл
        </button>
        <button type="button" onClick={() => setTab('url')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${tab === 'url' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
          <Link2 className="w-3.5 h-3.5" /> Вставить URL
        </button>
      </div>

      {/* File tab */}
      {tab === 'file' && (
        <div>
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => !uploading && fileRef.current?.click()}
            className={`relative flex flex-col items-center justify-center gap-2 py-6 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
              dragOver ? 'border-blue-400 bg-blue-50' :
              uploading ? 'border-gray-200 bg-gray-50 cursor-not-allowed' :
              uploadOk ? 'border-green-400 bg-green-50' :
              uploadErr ? 'border-red-300 bg-red-50' :
              'border-gray-200 hover:border-blue-300 hover:bg-blue-50/40'
            }`}
          >
            <input ref={fileRef} type="file" accept={accept} className="hidden" onChange={handleFile} />
            {uploading ? (
              <>
                <Loader2 className="w-7 h-7 text-blue-500 animate-spin" />
                <span className="text-xs text-gray-500 font-medium">Загружаем в облако…</span>
              </>
            ) : uploadOk ? (
              <>
                <CheckCircle2 className="w-7 h-7 text-green-500" />
                <span className="text-xs text-green-600 font-semibold">Файл загружен!</span>
              </>
            ) : uploadErr ? (
              <>
                <AlertCircle className="w-7 h-7 text-red-400" />
                <span className="text-xs text-red-600 font-medium text-center px-4">{uploadErr}</span>
                <span className="text-xs text-red-400 underline">Нажмите чтобы повторить</span>
              </>
            ) : (
              <>
                <Upload className={`w-7 h-7 ${type === 'video' ? 'text-purple-400' : 'text-blue-400'}`} />
                <div className="text-center">
                  <p className="text-xs font-semibold text-gray-600">
                    {type === 'image' ? 'JPG, PNG, WebP, GIF' : 'MP4, WebM, MOV'}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">Нажмите или перетащите файл сюда</p>
                </div>
              </>
            )}
          </div>

          {/* Current file URL badge */}
          {value && !uploading && (
            <div className="mt-2 flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
              {type === 'image' ? <Image className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" /> : <Video className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" />}
              <span className="text-[11px] text-gray-600 truncate flex-1">{value.split('/').pop()}</span>
              <button type="button" onClick={e => { e.stopPropagation(); onChange(''); setInputVal(''); }}
                className="text-gray-400 hover:text-red-500 transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* URL tab */}
      {tab === 'url' && (
        <div>
          <div className="flex items-center gap-2 px-3 py-2.5 border border-gray-200 rounded-xl bg-white focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-300 transition-all">
            <Link2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              type="text"
              value={inputVal}
              onChange={e => handleUrlChange(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none text-gray-800 placeholder:text-gray-400"
              placeholder={type === 'image' ? 'https://images.unsplash.com/photo-...' : 'https://www.youtube.com/watch?v=...'}
            />
            {inputVal && (
              <button type="button" onClick={() => { handleUrlChange(''); onChange(''); }}
                className="text-gray-300 hover:text-gray-500 flex-shrink-0">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Inline preview for image URL */}
          {inputVal && !isVideo && (
            <div className="mt-2 relative w-full overflow-hidden rounded-lg bg-gray-100" style={{ paddingBottom: '40%' }}>
              <img src={inputVal} alt="preview" className="absolute inset-0 w-full h-full object-cover"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            </div>
          )}
          {/* Inline preview for video URL */}
          {inputVal && isVideo && (
            <div className="mt-2">
              <MediaPreview videoUrl={inputVal} />
            </div>
          )}
        </div>
      )}

      {hint && <p className="text-[11px] text-gray-400 mt-1.5">{hint}</p>}
    </div>
  );
}

// ── Demo seed data (mirrors ClientDashboard FALLBACK_ADS) ──────────────────────
const DEMO_ADS = [
  { emoji: '🚚', badge: 'Спецпредложение', title: 'Грузоперевозки\nот 500₽/км', description: 'Надежно • Быстро • Выгодно', image: 'https://images.unsplash.com/photo-1760035434884-f77dc4ce45af?w=600&h=200&fit=crop', videoUrl: '', url: '#', isActive: true, order: 0, placement: 'cargo' },
  { emoji: '✈️', badge: 'Новое направление', title: 'Авиабилеты\nсо скидкой 25%', description: 'Лучшие цены • Без комиссий', image: 'https://images.unsplash.com/photo-1628695333027-df075f487dff?w=600&h=200&fit=crop', videoUrl: '', url: '#', isActive: true, order: 1, placement: 'cargo' },
  { emoji: '🛡️', badge: 'Безопасность', title: 'Страхование грузов\nот 99₽', description: 'Полная защита • 24/7', image: 'https://images.unsplash.com/photo-1637052885415-ccda7cbaf7d9?w=600&h=200&fit=crop', videoUrl: '', url: '#', isActive: true, order: 2, placement: 'cargo' },
];

// ═══════════════════════════════════════════════════════════════════
export function AdsManagement() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editAd, setEditAd] = useState<Ad | null>(null);
  const [form, setForm] = useState<FormState>({ ...EMPTY_AD });
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [seeding, setSeeding] = useState(false);

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3200);
  };

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminAds();
      setAds(data || []);
    } catch (e: any) {
      setError(e.message || 'Ошибка загрузки баннеров');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditAd(null);
    setForm({ ...EMPTY_AD, order: ads.length });
    setShowForm(true);
  };

  const openEdit = (ad: Ad) => {
    setEditAd(ad);
    setForm({
      emoji: ad.emoji,
      badge: ad.badge,
      title: ad.title,
      description: ad.description,
      image: ad.image,
      videoUrl: ad.videoUrl || '',
      url: ad.url,
      isActive: ad.isActive,
      order: ad.order,
      placement: ad.placement || 'all',
    });
    setShowForm(true);
  };

  const closeForm = () => { setShowForm(false); setEditAd(null); };

  const seedDemoAds = async () => {
    setSeeding(true);
    try {
      const created = await Promise.all(DEMO_ADS.map(ad => createAdminAd(ad)));
      setAds(prev => [...prev, ...created]);
      showToast('success', `Создано ${created.length} демо-баннера. Отредактируйте под свой бренд!`);
    } catch (e: any) {
      showToast('error', e.message || 'Ошибка создания демо-баннеров');
    } finally {
      setSeeding(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      console.log('[AdsManagement] Saving form:', form);
      if (editAd) {
        const updated = await updateAdminAd(editAd.id, form);
        setAds(prev => prev.map(a => a.id === editAd.id ? updated : a));
        showToast('success', 'Баннер обновлён');
      } else {
        const created = await createAdminAd(form);
        setAds(prev => [...prev, created]);
        showToast('success', 'Баннер создан');
      }
      closeForm();
    } catch (e: any) {
      showToast('error', e.message || 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (ad: Ad) => {
    try {
      const updated = await updateAdminAd(ad.id, { isActive: !ad.isActive });
      setAds(prev => prev.map(a => a.id === ad.id ? updated : a));
      showToast('success', updated.isActive ? 'Баннер активирован' : 'Баннер скрыт');
    } catch (e: any) {
      showToast('error', e.message || 'Ошибка');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAdminAd(id);
      setAds(prev => prev.filter(a => a.id !== id));
      setDeleteConfirm(null);
      showToast('success', 'Баннер удалён');
    } catch (e: any) {
      showToast('error', e.message || 'Ошибка удаления');
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Рекламные баннеры</h1>
          <p className="text-sm text-gray-500 mt-0.5">Загружайте фото и видео прямо в облако</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium text-sm transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> Добавить баннер
        </button>
      </div>

      {/* Hint */}
      <div className="flex items-start gap-3 px-4 py-3.5 bg-blue-50 border border-blue-200 rounded-xl">
        <CloudUpload className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-blue-800">Хранение в Supabase Storage</p>
          <p className="text-xs text-blue-600 mt-0.5">
            Фото и видео загружаются в облако и доступны по прямой публичной ссылке.
            Активные баннеры сменяются каждые 5 сек. Поддерживаются YouTube, Vimeo, RuTube и прямые файлы .mp4/.webm.
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-red-700 font-semibold">Не удалось загрузить баннеры</p>
            <p className="text-xs text-red-500 mt-0.5 break-all">{error}</p>
            {error.includes('401') && (
              <p className="text-xs text-red-600 mt-1 font-medium">
                Ошибка авторизации — попробуйте выйти из админ-панели и войти снова.
              </p>
            )}
          </div>
          <button onClick={load} className="text-xs text-red-600 underline flex-shrink-0">Повторить</button>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-200 border-t-blue-600" />
        </div>
      ) : ads.length === 0 ? (
        <div className="flex flex-col items-center justify-center bg-white rounded-2xl border border-dashed border-gray-300 p-8 gap-4">
          <Image className="w-10 h-10 text-gray-300" />
          <div className="text-center">
            <p className="text-gray-700 font-semibold text-base">Баннеров пока нет</p>
            <p className="text-gray-400 text-sm mt-1 max-w-sm">
              В страницах водителя и отправителя сейчас показываются <strong>демо-баннеры</strong> (встроенные заглушки).
              Создайте реальные баннеры — они автоматически заменят демо.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
            <button onClick={seedDemoAds} disabled={seeding}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white rounded-xl font-medium text-sm transition-colors">
              {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {seeding ? 'Создаём…' : 'Создать примеры'}
            </button>
            <button onClick={openCreate}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium text-sm transition-colors">
              <Plus className="w-4 h-4" /> С нуля
            </button>
          </div>
          <p className="text-xs text-gray-400 text-center">«Создать примеры» — 3 готовых баннера, которые можно сразу редактировать</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {ads.map(ad => (
            <div key={ad.id}
              className={`bg-white rounded-2xl border overflow-hidden transition-all ${ad.isActive ? 'border-gray-200' : 'border-gray-200 opacity-60'}`}>
              <div className="flex items-stretch gap-0">
                {/* Media preview */}
                <div className="w-56 flex-shrink-0 self-stretch min-h-[120px] relative overflow-hidden bg-gray-900">
                  {ad.image && (
                    <img src={ad.image} alt={ad.title}
                      className="absolute inset-0 w-full h-full object-cover opacity-70"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  )}
                  {ad.videoUrl && (
                    <div className="absolute inset-0 flex items-center justify-center z-10">
                      <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                        <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                      </div>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-900/80 via-blue-800/50 to-transparent z-20 p-3 flex flex-col justify-center">
                    <div className="text-[10px] text-white/70 font-bold uppercase tracking-wide mb-0.5">{ad.emoji} {ad.badge}</div>
                    <p className="text-white font-bold text-xs leading-snug">{ad.title}</p>
                    <p className="text-white/70 text-[10px] mt-0.5">{ad.description}</p>
                  </div>
                  <div className={`absolute top-2 left-2 z-30 px-1.5 py-0.5 rounded text-[10px] font-bold ${ad.isActive ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'}`}>
                    {ad.isActive ? 'Активен' : 'Скрыт'}
                  </div>
                  <div className="absolute bottom-2 right-2 z-30 flex gap-1">
                    {ad.image && <Image className="w-3.5 h-3.5 text-white/60" />}
                    {ad.videoUrl && <Video className="w-3.5 h-3.5 text-purple-300" />}
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <GripVertical className="w-4 h-4 text-gray-300" />
                      <span className="text-xs text-gray-400">Позиция #{ad.order + 1}</span>
                      {ad.videoUrl && (
                        <span className="flex items-center gap-1 text-[10px] font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                          <Video className="w-3 h-3" />видео
                        </span>
                      )}
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        ad.placement === 'welcome' ? 'bg-amber-50 text-amber-600' :
                        ad.placement === 'cargo' ? 'bg-blue-50 text-blue-600' :
                        ad.placement === 'avia' ? 'bg-sky-50 text-sky-600' :
                        'bg-gray-50 text-gray-500'
                      }`}>
                        {ad.placement === 'welcome' ? '🏠 Welcome' :
                         ad.placement === 'cargo' ? '🚚 CARGO' :
                         ad.placement === 'avia' ? '✈️ AVIA' : '🌐 Везде'}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900 text-sm">{ad.title || <span className="text-gray-400 italic">Без названия</span>}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{ad.description}</p>
                    <div className="mt-2 space-y-1">
                      {ad.image && (
                        <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                          <Image className="w-3 h-3 text-blue-400" />
                          <span className="truncate max-w-[200px]">{ad.image.split('/').pop()}</span>
                        </div>
                      )}
                      {ad.videoUrl && (
                        <div className="flex items-center gap-1.5 text-[11px] text-purple-500">
                          <Video className="w-3 h-3" />
                          <span className="truncate max-w-[200px]">{ad.videoUrl.split('/').pop()}</span>
                        </div>
                      )}
                      {ad.url && ad.url !== '#' && (
                        <a href={ad.url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800">
                          <ExternalLink className="w-3 h-3" />
                          {ad.url.length > 40 ? ad.url.slice(0, 40) + '…' : ad.url}
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <button onClick={() => openEdit(ad)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                      <Pencil className="w-3.5 h-3.5" />Изменить
                    </button>
                    <button onClick={() => toggleActive(ad)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${ad.isActive ? 'text-yellow-700 bg-yellow-50 hover:bg-yellow-100' : 'text-green-700 bg-green-50 hover:bg-green-100'}`}>
                      {ad.isActive ? <><EyeOff className="w-3.5 h-3.5" />Скрыть</> : <><Eye className="w-3.5 h-3.5" />Показать</>}
                    </button>
                    <button onClick={() => setDeleteConfirm(ad.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors ml-auto">
                      <Trash2 className="w-3.5 h-3.5" />Удалить
                    </button>
                  </div>
                </div>
              </div>

              {/* Delete confirm */}
              {deleteConfirm === ad.id && (
                <div className="border-t border-red-100 bg-red-50 px-4 py-3 flex items-center gap-3">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-700 flex-1">Удалить «{ad.title}»? Действие необратимо.</p>
                  <button onClick={() => handleDelete(ad.id)}
                    className="px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 transition-colors">Удалить</button>
                  <button onClick={() => setDeleteConfirm(null)}
                    className="px-3 py-1.5 bg-white text-gray-600 text-xs font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">Отмена</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Form Modal ── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[92vh] overflow-y-auto">

            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="font-bold text-gray-900 text-base">{editAd ? 'Редактировать баннер' : 'Новый баннер'}</h2>
              <button onClick={closeForm} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">

              {/* Live preview */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Превью (как на главной)</p>
                <MediaPreview imageUrl={form.image} videoUrl={form.videoUrl}
                  emoji={form.emoji} badge={form.badge} title={form.title} description={form.description} />
              </div>

              {/* Text fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Эмодзи</label>
                  <input type="text" value={form.emoji}
                    onChange={e => setForm(f => ({ ...f, emoji: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="🚚" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Метка (badge)</label>
                  <input type="text" value={form.badge}
                    onChange={e => setForm(f => ({ ...f, badge: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Спецпредложение" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Заголовок <span className="text-red-500">*</span></label>
                <input type="text" value={form.title} required
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Грузоперевозки от 500₽/км" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Описание</label>
                <input type="text" value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Надежно • Быстро • Выгодно" />
              </div>

              {/* Media uploads */}
              <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-4 space-y-5">
                <p className="text-xs font-bold text-blue-700 uppercase tracking-wide flex items-center gap-1.5">
                  <Film className="w-3.5 h-3.5" />Медиа (фото / видео)
                </p>

                <MediaUploader
                  label="Фоновое изображение"
                  hint="JPG, PNG, WebP до 10 МБ. Рекомендуется 1280×720px."
                  value={form.image}
                  onChange={v => setForm(f => ({ ...f, image: v }))}
                  type="image"
                />

                <MediaUploader
                  label="Видео (MP4, WebM или ссылка YouTube/Vimeo/RuTube)"
                  hint="Видео воспроизводится поверх фото. Для YouTube/Vimeo используйте вкладку «URL»."
                  value={form.videoUrl || ''}
                  onChange={v => setForm(f => ({ ...f, videoUrl: v }))}
                  type="video"
                />
              </div>

              {/* Click URL */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                  Ссылка при нажатии
                </label>
                <input type="text" value={form.url}
                  onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com" />
              </div>

              {/* Placement */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Где показывать</label>
                <div className="flex gap-2 flex-wrap">
                  {([
                    { value: 'all',     label: 'Везде',     emoji: '🌐' },
                    { value: 'welcome', label: 'Welcome',   emoji: '🏠' },
                    { value: 'cargo',   label: 'CARGO',     emoji: '🚚' },
                    { value: 'avia',    label: 'AVIA',      emoji: '✈️' },
                  ] as const).map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, placement: opt.value }))}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                        form.placement === opt.value
                          ? 'bg-blue-50 border-blue-400 text-blue-700'
                          : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                      }`}
                    >
                      <span>{opt.emoji}</span> {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Order + Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Позиция (порядок)</label>
                  <input type="number" min={0} value={form.order}
                    onChange={e => setForm(f => ({ ...f, order: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Статус</label>
                  <button type="button"
                    onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
                    className={`w-full flex items-center gap-2 px-3 py-2.5 border rounded-xl text-sm font-medium transition-colors ${
                      form.isActive ? 'bg-green-50 border-green-300 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-500'
                    }`}>
                    {form.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    {form.isActive ? 'Активен' : 'Скрыт'}
                  </button>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={closeForm}
                  className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
                  Отмена
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? 'Сохраняем…' : (editAd ? 'Сохранить' : 'Создать')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
