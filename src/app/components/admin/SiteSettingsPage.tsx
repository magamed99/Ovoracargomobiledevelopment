import { useState, useRef, useCallback } from 'react';
import {
  Image, Users2, Plus, Trash2, Edit3, Save, X,
  Upload, RefreshCw, CheckCircle, AlertCircle, Globe,
} from 'lucide-react';
import {
  getSiteConfig, saveSiteConfig, resetSiteConfig,
  DEFAULT_PARTNERS, DEFAULT_ICONS,
} from '../../utils/siteConfig';
import type { SiteConfig, PartnerConfig } from '../../utils/siteConfig';

const TAB_ICONS = { partners: Users2, icons: Image, };
const TABS = [
  { key: 'partners', label: 'Партнёры' },
  { key: 'icons',    label: 'Иконки и фото' },
] as const;
type Tab = typeof TABS[number]['key'];

function Toast({ msg, ok }: { msg: string; ok: boolean }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl shadow-xl text-sm font-semibold text-white"
      style={{ background: ok ? '#10b981' : '#ef4444', animation: 'fadeSlideUp 0.25s ease' }}>
      {ok ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
      {msg}
    </div>
  );
}

function ColorDot({ color }: { color: string }) {
  return <span className="inline-block w-4 h-4 rounded-full border border-white/20 flex-shrink-0" style={{ background: color }} />;
}

function ImageUpload({
  label, value, onChange,
}: { label: string; value: string; onChange: (v: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = e => onChange(e.target?.result as string);
    reader.readAsDataURL(file);
  }, [onChange]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const isDefault = value.startsWith('/icons/');

  return (
    <div className="rounded-2xl border border-gray-200 overflow-hidden bg-white">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <p className="font-semibold text-gray-800 text-sm">{label}</p>
        {!isDefault && (
          <button onClick={() => onChange(DEFAULT_ICONS[label.toLowerCase().includes('лого') ? 'logo' : label.toLowerCase().includes('грузо') ? 'truck' : label.toLowerCase().includes('авиа') ? 'plane' : 'hero'])}
            className="text-xs text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1">
            <RefreshCw className="w-3 h-3" /> Сбросить
          </button>
        )}
      </div>

      <div className="p-4 flex gap-4 items-start">
        {/* Preview */}
        <div className="flex-shrink-0 w-24 h-16 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center">
          {value ? (
            <img src={value} alt={label} className="w-full h-full object-contain" />
          ) : (
            <Image className="w-6 h-6 text-gray-300" />
          )}
        </div>

        {/* Upload zone */}
        <div className="flex-1 flex flex-col gap-2">
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => fileRef.current?.click()}
            className="flex flex-col items-center justify-center gap-1 py-4 rounded-xl border-2 border-dashed cursor-pointer transition-all"
            style={{ borderColor: dragging ? '#1565d8' : '#e2e8f0', background: dragging ? '#eff6ff' : '#f8fafc' }}
          >
            <Upload className="w-5 h-5" style={{ color: dragging ? '#1565d8' : '#94a3b8' }} />
            <p className="text-xs font-medium" style={{ color: dragging ? '#1565d8' : '#64748b' }}>
              {dragging ? 'Отпусти файл' : 'Нажми или перетащи фото'}
            </p>
            <p className="text-[10px] text-gray-400">PNG, JPG, WEBP</p>
          </div>
          <input
            ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
          {/* Or URL */}
          <input
            type="text" placeholder="Или вставь URL-ссылку на фото..."
            value={isDefault ? '' : (value.startsWith('data:') ? '' : value)}
            onChange={e => onChange(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 outline-none focus:border-blue-400 text-gray-700 placeholder-gray-400"
          />
        </div>
      </div>
    </div>
  );
}

const EMPTY_PARTNER: Omit<PartnerConfig, 'id'> = {
  name: '', sub: '', mark: '', color: '#2176e8',
};

export function SiteSettingsPage() {
  const [tab, setTab] = useState<Tab>('partners');
  const [config, setConfig] = useState<SiteConfig>(() => getSiteConfig());
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [editingPartner, setEditingPartner] = useState<PartnerConfig | null>(null);
  const [newPartner, setNewPartner] = useState<Omit<PartnerConfig, 'id'>>(EMPTY_PARTNER);
  const [addingNew, setAddingNew] = useState(false);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 2800);
  };

  const save = () => {
    saveSiteConfig(config);
    showToast('Настройки сохранены!');
  };

  const reset = () => {
    resetSiteConfig();
    setConfig({ partners: DEFAULT_PARTNERS, icons: DEFAULT_ICONS });
    showToast('Настройки сброшены');
  };

  const deletePartner = (id: string) => {
    setConfig(c => ({ ...c, partners: c.partners.filter(p => p.id !== id) }));
  };

  const savePartner = () => {
    if (!editingPartner) return;
    setConfig(c => ({
      ...c,
      partners: c.partners.map(p => p.id === editingPartner.id ? editingPartner : p),
    }));
    setEditingPartner(null);
  };

  const addPartner = () => {
    if (!newPartner.name.trim() || !newPartner.mark.trim()) {
      showToast('Заполни название и аббревиатуру', false);
      return;
    }
    const partner: PartnerConfig = { ...newPartner, id: Date.now().toString() };
    setConfig(c => ({ ...c, partners: [...c.partners, partner] }));
    setNewPartner(EMPTY_PARTNER);
    setAddingNew(false);
    showToast('Партнёр добавлен');
  };

  const updateIcon = (key: keyof typeof DEFAULT_ICONS, val: string) => {
    setConfig(c => ({ ...c, icons: { ...c.icons, [key]: val } }));
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {toast && <Toast msg={toast.msg} ok={toast.ok} />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-600" /> Настройки сайта
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Управляй партнёрами и медиафайлами главной страницы</p>
        </div>
        <div className="flex gap-2">
          <button onClick={reset}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors border border-gray-200">
            <RefreshCw className="w-3.5 h-3.5" /> Сбросить
          </button>
          <button onClick={save}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl text-white transition-all"
            style={{ background: 'linear-gradient(135deg,#1565d8,#2385f4)', boxShadow: '0 4px 14px #1565d840' }}>
            <Save className="w-3.5 h-3.5" /> Сохранить
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-2xl bg-gray-100 border border-gray-200">
        {TABS.map(t => {
          const Icon = TAB_ICONS[t.key];
          const active = tab === t.key;
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: active ? '#ffffff' : 'transparent',
                color: active ? '#1565d8' : '#64748b',
                boxShadow: active ? '0 2px 8px #00000010' : 'none',
              }}>
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ── PARTNERS TAB ── */}
      {tab === 'partners' && (
        <div className="space-y-3">
          {/* List */}
          {config.partners.map(p => (
            <div key={p.id}>
              {editingPartner?.id === p.id ? (
                /* Edit form */
                <div className="rounded-2xl border border-blue-200 bg-blue-50/40 p-4 space-y-3">
                  <p className="text-sm font-bold text-blue-700">Редактирование</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-600 mb-1 block">Название *</label>
                      <input value={editingPartner.name}
                        onChange={e => setEditingPartner({ ...editingPartner, name: e.target.value })}
                        className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 outline-none focus:border-blue-400" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 mb-1 block">Аббревиатура *</label>
                      <input value={editingPartner.mark} maxLength={4}
                        onChange={e => setEditingPartner({ ...editingPartner, mark: e.target.value.toUpperCase() })}
                        className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 outline-none focus:border-blue-400" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 mb-1 block">Описание</label>
                      <input value={editingPartner.sub}
                        onChange={e => setEditingPartner({ ...editingPartner, sub: e.target.value })}
                        className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 outline-none focus:border-blue-400" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 mb-1 block">Цвет</label>
                      <div className="flex gap-2 items-center">
                        <input type="color" value={editingPartner.color}
                          onChange={e => setEditingPartner({ ...editingPartner, color: e.target.value })}
                          className="w-10 h-9 rounded-lg border border-gray-200 cursor-pointer p-0.5" />
                        <input value={editingPartner.color}
                          onChange={e => setEditingPartner({ ...editingPartner, color: e.target.value })}
                          className="flex-1 px-3 py-2 text-sm rounded-xl border border-gray-200 outline-none font-mono" />
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end pt-1">
                    <button onClick={() => setEditingPartner(null)}
                      className="px-4 py-2 text-xs font-semibold rounded-xl text-gray-500 border border-gray-200 hover:bg-gray-50">
                      <X className="w-3.5 h-3.5 inline mr-1" />Отмена
                    </button>
                    <button onClick={savePartner}
                      className="px-4 py-2 text-xs font-bold rounded-xl text-white"
                      style={{ background: '#1565d8' }}>
                      <Save className="w-3.5 h-3.5 inline mr-1" />Сохранить
                    </button>
                  </div>
                </div>
              ) : (
                /* Partner row */
                <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white border border-gray-200 shadow-sm">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-sm"
                    style={{ background: p.color + '22', color: p.textColor ?? p.color, border: `1px solid ${p.color}44` }}>
                    {p.mark.slice(0, 3)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-gray-900 text-sm">{p.name}</p>
                      <ColorDot color={p.color} />
                    </div>
                    <p className="text-xs text-gray-400">{p.sub}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => setEditingPartner(p)}
                      className="p-2 rounded-xl text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button onClick={() => deletePartner(p.id)}
                      className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Add new */}
          {addingNew ? (
            <div className="rounded-2xl border border-green-200 bg-green-50/40 p-4 space-y-3">
              <p className="text-sm font-bold text-green-700">Новый партнёр</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Название *</label>
                  <input value={newPartner.name} placeholder="Например: FedEx"
                    onChange={e => setNewPartner({ ...newPartner, name: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 outline-none focus:border-green-400" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Аббревиатура *</label>
                  <input value={newPartner.mark} maxLength={4} placeholder="FDX"
                    onChange={e => setNewPartner({ ...newPartner, mark: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 outline-none focus:border-green-400" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Описание</label>
                  <input value={newPartner.sub} placeholder="Express Delivery"
                    onChange={e => setNewPartner({ ...newPartner, sub: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 outline-none focus:border-green-400" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Цвет</label>
                  <div className="flex gap-2 items-center">
                    <input type="color" value={newPartner.color}
                      onChange={e => setNewPartner({ ...newPartner, color: e.target.value })}
                      className="w-10 h-9 rounded-lg border border-gray-200 cursor-pointer p-0.5" />
                    <input value={newPartner.color}
                      onChange={e => setNewPartner({ ...newPartner, color: e.target.value })}
                      className="flex-1 px-3 py-2 text-sm rounded-xl border border-gray-200 outline-none font-mono" />
                  </div>
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-1">
                <button onClick={() => { setAddingNew(false); setNewPartner(EMPTY_PARTNER); }}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-gray-500 border border-gray-200 hover:bg-gray-50">
                  <X className="w-3.5 h-3.5 inline mr-1" />Отмена
                </button>
                <button onClick={addPartner}
                  className="px-4 py-2 text-xs font-bold rounded-xl text-white"
                  style={{ background: '#10b981' }}>
                  <Plus className="w-3.5 h-3.5 inline mr-1" />Добавить
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setAddingNew(true)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-gray-200 text-sm font-semibold text-gray-400 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition-all">
              <Plus className="w-4 h-4" /> Добавить партнёра
            </button>
          )}

          <div className="pt-1 flex justify-end">
            <button onClick={save}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl text-white"
              style={{ background: 'linear-gradient(135deg,#1565d8,#2385f4)', boxShadow: '0 4px 14px #1565d840' }}>
              <Save className="w-4 h-4" /> Сохранить партнёров
            </button>
          </div>
        </div>
      )}

      {/* ── ICONS TAB ── */}
      {tab === 'icons' && (
        <div className="space-y-4">
          <div className="p-3 rounded-xl text-xs text-blue-700 font-medium bg-blue-50 border border-blue-100 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            Загружай фото с устройства или вставляй ссылку. После сохранения изменения сразу появятся на сайте.
          </div>

          <ImageUpload label="Логотип (лого птица)"
            value={config.icons.logo}
            onChange={v => updateIcon('logo', v)} />

          <ImageUpload label="Грузовик CARGO"
            value={config.icons.truck}
            onChange={v => updateIcon('truck', v)} />

          <ImageUpload label="Самолёт AVIA"
            value={config.icons.plane}
            onChange={v => updateIcon('plane', v)} />

          <ImageUpload label="Главный баннер (hero-promo)"
            value={config.icons.hero}
            onChange={v => updateIcon('hero', v)} />

          <div className="flex justify-end pt-1">
            <button onClick={save}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl text-white"
              style={{ background: 'linear-gradient(135deg,#1565d8,#2385f4)', boxShadow: '0 4px 14px #1565d840' }}>
              <Save className="w-4 h-4" /> Сохранить фото
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
