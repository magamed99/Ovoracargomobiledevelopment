import { useState, useRef } from 'react';
import { ArrowLeft, Truck, FileText, ImagePlus, X, CheckCircle2, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../contexts/UserContext';
import { toast } from 'sonner';
import { updateUser as updateUserApi, registerUser } from '../api/authApi';

const CAR_BRANDS = ['BMW', 'Ford', 'GAZ', 'KamAZ', 'MAN', 'MAZ', 'Mercedes-Benz', 'Scania', 'Toyota', 'Volvo', 'ГАЗ', 'КАМАЗ', 'МАЗ', 'Другое'];

export function DriverRegistrationForm() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { user: cachedUser, setUserDirectly } = useUser();

  const [form, setForm] = useState({ carBrand: '', carModel: '', carYear: '', plateNumber: '' });
  const [submitting, setSubmitting] = useState(false);
  const [docPhotos, setDocPhotos] = useState<{ label: string; url: string }[]>([]);
  const [carPhotos, setCarPhotos] = useState<string[]>([]);
  const docInputRef = useRef<HTMLInputElement>(null);
  const carInputRef = useRef<HTMLInputElement>(null);
  const [activeDocSlot, setActiveDocSlot] = useState<number | null>(null);

  const bg   = isDark ? '#0e1621' : '#f5f7fa';
  const card = isDark ? '#131f2e' : '#ffffff';
  const brd  = isDark ? '#1e2d3d' : '#e8edf2';
  const txt  = isDark ? '#e8eef5' : '#0f172a';
  const sub  = isDark ? '#6b7f94' : '#8a97a8';
  const blue = '#1978e5';

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  function pickDocPhoto(slot: number) {
    setActiveDocSlot(slot);
    docInputRef.current?.click();
  }

  function onDocFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || activeDocSlot === null) return;
    const url = URL.createObjectURL(file);
    setDocPhotos(prev => {
      const next = [...prev];
      next[activeDocSlot] = { label: DOC_SLOTS[activeDocSlot], url };
      return next;
    });
    e.target.value = '';
  }

  function onCarFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    const urls = files.slice(0, 5 - carPhotos.length).map(f => URL.createObjectURL(f));
    setCarPhotos(prev => [...prev, ...urls].slice(0, 5));
    e.target.value = '';
  }

  const handleSubmit = async () => {
    if (!form.carBrand || !form.carModel || !form.carYear || !form.plateNumber) {
      toast.error('Заполните все поля об автомобиле');
      return;
    }
    setSubmitting(true);
    try {
      const vehicle = { brand: form.carBrand, model: form.carModel, year: form.carYear, plate: form.plateNumber.toUpperCase() };
      if (cachedUser?.email) {
        const updated = await updateUserApi({
          email: cachedUser.email,
          firstName: cachedUser.firstName,
          lastName: cachedUser.lastName,
          phone: cachedUser.phone,
          vehicle,
        });
        setUserDirectly({ ...cachedUser, ...updated });
      } else {
        const saved = await registerUser({
          email: `driver_${Date.now()}@ovora.local`,
          role: 'driver',
          firstName: '', lastName: '', phone: '',
          vehicle,
        });
        setUserDirectly(saved);
      }
      sessionStorage.setItem('isAuthenticated', 'true');
      sessionStorage.setItem('userRole', 'driver');
      toast.success('Регистрация завершена!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(`Ошибка: ${err}`);
    } finally {
      setSubmitting(false);
    }
  };

  const DOC_SLOTS = ['Паспорт', 'Техпаспорт (СТС)'];
  const complete = form.carBrand && form.carModel && form.carYear && form.plateNumber;

  return (
    <div style={{ minHeight: '100vh', background: bg, fontFamily: "'Sora', sans-serif", color: txt }}>

      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10, background: isDark ? 'rgba(14,22,33,0.95)' : 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(12px)', borderBottom: `1px solid ${brd}`,
        display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
      }}>
        <button onClick={() => navigate(-1)} style={{
          width: 36, height: 36, borderRadius: 10, border: `1px solid ${brd}`,
          background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: sub,
        }}>
          <ArrowLeft size={18} />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: txt }}>Данные автомобиля</div>
          <div style={{ fontSize: 11, color: sub }}>Последний шаг регистрации</div>
        </div>
        <div style={{
          background: complete ? '#1eb85420' : isDark ? '#1e2d3d' : '#f0f4f8',
          color: complete ? '#1eb854' : sub,
          borderRadius: 20, padding: '4px 10px', fontSize: 11, fontWeight: 600,
        }}>
          {complete ? '✓ Готово' : '4 поля'}
        </div>
      </div>

      {/* Progress */}
      <div style={{ height: 3, background: isDark ? '#1e2d3d' : '#e8edf2' }}>
        <div style={{ height: '100%', background: blue, width: complete ? '100%' : '60%', transition: 'width 0.4s' }} />
      </div>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '16px 16px 120px' }}>

        {/* User card */}
        {cachedUser && (
          <div style={{
            background: card, borderRadius: 16, border: `1px solid ${brd}`,
            padding: '14px 16px', marginBottom: 16,
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{
              width: 42, height: 42, borderRadius: 12, background: `${blue}20`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <CheckCircle2 size={20} color={blue} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: txt }}>
                {cachedUser.firstName} {cachedUser.lastName}
              </div>
              <div style={{ fontSize: 11, color: sub, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {cachedUser.email} · Личные данные сохранены
              </div>
            </div>
          </div>
        )}

        {/* Hero */}
        <div style={{
          background: `linear-gradient(135deg, ${blue}15, ${blue}05)`,
          border: `1px solid ${blue}30`, borderRadius: 20,
          padding: '24px 20px', marginBottom: 20, textAlign: 'center',
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: 20, background: `${blue}20`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px',
          }}>
            <Truck size={32} color={blue} />
          </div>
          <div style={{ fontWeight: 800, fontSize: 18, color: txt, marginBottom: 6 }}>Транспортное средство</div>
          <div style={{ fontSize: 13, color: sub, lineHeight: 1.5 }}>
            Укажите данные вашего грузового автомобиля.<br />Это поможет клиентам найти вас.
          </div>
        </div>

        {/* Car fields card */}
        <div style={{ background: card, borderRadius: 16, border: `1px solid ${brd}`, marginBottom: 16, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: `1px solid ${brd}` }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: txt }}>Основные данные</div>
          </div>

          {[
            { key: 'carBrand', label: 'Марка', placeholder: 'Например: КАМАЗ, Volvo, MAN', type: 'text' },
            { key: 'carModel', label: 'Модель', placeholder: 'Например: 65115, FH16, TGX', type: 'text' },
            { key: 'carYear',  label: 'Год выпуска', placeholder: '2018', type: 'number' },
            { key: 'plateNumber', label: 'Госномер', placeholder: '01 TJ 1234 AA', type: 'text' },
          ].map((field, i, arr) => (
            <div key={field.key} style={{ borderBottom: i < arr.length - 1 ? `1px solid ${brd}` : 'none' }}>
              <label style={{ display: 'block', padding: '14px 16px 0', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: sub }}>
                {field.label}
              </label>
              <input
                type={field.type}
                value={form[field.key as keyof typeof form]}
                onChange={set(field.key as keyof typeof form)}
                placeholder={field.placeholder}
                style={{
                  display: 'block', width: '100%', background: 'transparent', border: 'none',
                  outline: 'none', padding: '6px 16px 14px', fontSize: 15, fontWeight: 600,
                  color: txt, boxSizing: 'border-box',
                  textTransform: field.key === 'plateNumber' ? 'uppercase' : 'none',
                }}
              />
            </div>
          ))}
        </div>

        {/* Quick brand picker */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: sub, marginBottom: 8, fontWeight: 600 }}>БЫСТРЫЙ ВЫБОР МАРКИ</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {CAR_BRANDS.map(b => (
              <button key={b} onClick={() => setForm(f => ({ ...f, carBrand: b }))} style={{
                padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                border: `1px solid ${form.carBrand === b ? blue : brd}`,
                background: form.carBrand === b ? `${blue}20` : card,
                color: form.carBrand === b ? blue : sub, transition: 'all 0.15s',
              }}>
                {b}
              </button>
            ))}
          </div>
        </div>

        {/* Document photos */}
        <div style={{ background: card, borderRadius: 16, border: `1px solid ${brd}`, marginBottom: 16, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: `1px solid ${brd}`, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={15} color={sub} />
            <div style={{ fontWeight: 700, fontSize: 13, color: txt }}>Документы</div>
            <div style={{ marginLeft: 'auto', fontSize: 11, color: sub }}>Необязательно</div>
          </div>
          <div style={{ padding: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {DOC_SLOTS.map((label, i) => {
              const photo = docPhotos[i];
              return (
                <div key={label} onClick={() => pickDocPhoto(i)} style={{
                  height: 110, borderRadius: 12, border: `2px dashed ${photo ? blue + '60' : brd}`,
                  background: photo ? `${blue}08` : 'transparent',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', overflow: 'hidden', position: 'relative', transition: 'all 0.15s',
                }}>
                  {photo ? (
                    <>
                      <img src={photo.url} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 10 }} />
                      <button onClick={e => { e.stopPropagation(); setDocPhotos(p => { const n=[...p]; n[i]=undefined as any; return n; }); }} style={{
                        position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: 11,
                        background: '#ef4444', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <X size={12} color="#fff" />
                      </button>
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.5)', padding: '3px 6px' }}>
                        <div style={{ fontSize: 9, color: '#fff', fontWeight: 600, textAlign: 'center' }}>{label}</div>
                      </div>
                    </>
                  ) : (
                    <>
                      <ImagePlus size={20} color={sub} style={{ marginBottom: 6 }} />
                      <div style={{ fontSize: 11, fontWeight: 600, color: sub, textAlign: 'center', lineHeight: 1.3, padding: '0 8px' }}>{label}</div>
                      <div style={{ fontSize: 10, color: isDark ? '#3d5263' : '#b0bec5', marginTop: 3 }}>Нажмите</div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
          <input ref={docInputRef} type="file" accept="image/*" capture="environment" onChange={onDocFileChange} style={{ display: 'none' }} />
        </div>

        {/* Car photos */}
        <div style={{ background: card, borderRadius: 16, border: `1px solid ${brd}`, marginBottom: 24, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: `1px solid ${brd}`, display: 'flex', alignItems: 'center', gap: 8 }}>
            <ImagePlus size={15} color={sub} />
            <div style={{ fontWeight: 700, fontSize: 13, color: txt }}>Фото автомобиля</div>
            <div style={{ marginLeft: 'auto', fontSize: 11, color: sub }}>{carPhotos.length}/5</div>
          </div>
          <div style={{ padding: 16, display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 16 }}>
            {carPhotos.map((url, i) => (
              <div key={i} style={{ flexShrink: 0, width: 90, height: 90, borderRadius: 12, overflow: 'hidden', position: 'relative' }}>
                <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button onClick={() => setCarPhotos(p => p.filter((_, j) => j !== i))} style={{
                  position: 'absolute', top: 3, right: 3, width: 20, height: 20, borderRadius: 10,
                  background: '#ef4444', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <X size={11} color="#fff" />
                </button>
              </div>
            ))}
            {carPhotos.length < 5 && (
              <button onClick={() => carInputRef.current?.click()} style={{
                flexShrink: 0, width: 90, height: 90, borderRadius: 12,
                border: `2px dashed ${blue}50`, background: `${blue}08`,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: blue,
              }}>
                <ImagePlus size={20} />
                <span style={{ fontSize: 9, fontWeight: 700, marginTop: 4 }}>ДОБАВИТЬ</span>
              </button>
            )}
          </div>
          <input ref={carInputRef} type="file" accept="image/*" multiple onChange={onCarFileChange} style={{ display: 'none' }} />
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={submitting || !complete}
          style={{
            width: '100%', padding: '16px', borderRadius: 16, border: 'none',
            background: complete ? blue : isDark ? '#1e2d3d' : '#e8edf2',
            color: complete ? '#fff' : sub,
            fontWeight: 800, fontSize: 15, cursor: complete ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'all 0.2s',
          }}
        >
          {submitting ? 'Сохранение...' : (
            <>
              Завершить регистрацию
              <ChevronRight size={18} />
            </>
          )}
        </button>
        <div style={{ textAlign: 'center', fontSize: 11, color: sub, marginTop: 10 }}>
          Данные сохраняются на сервере — вы сможете изменить их в профиле
        </div>
      </div>
    </div>
  );
}
