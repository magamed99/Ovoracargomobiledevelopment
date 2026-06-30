import React, { useState, useRef, useEffect } from 'react';
import { CIS_LIST, validateLocalPhone, type PhoneValidationResult } from '../../utils/phoneValidator';

interface PhoneInputProps {
  value: string;
  country: string;
  onChange: (phone: string) => void;
  onCountryChange: (code: string) => void;
  placeholder?: string;
  error?: string;
}

export function PhoneInput({ value, country, onChange, onCountryChange, placeholder = '900 123 456', error }: PhoneInputProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const sel = CIS_LIST.find(c => c.code === country) || CIS_LIST[0];

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const pv = validateLocalPhone(country, value);

  return (
    <div ref={ref} style={{ position: 'relative', marginBottom: 14 }}>
      <div style={{ display: 'flex', borderRadius: 14, border: '1.5px solid #ffffff18', background: '#ffffff08', overflow: 'hidden' }}>
        <button type="button" onClick={() => setOpen(!open)} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
          padding: '15px 10px', border: 'none', borderRight: '1px solid #ffffff12',
          background: open ? '#ffffff10' : 'transparent', color: '#fff',
          fontSize: 15, fontWeight: 600, cursor: 'pointer', flexShrink: 0, minWidth: 80,
        }}>
          <span style={{ fontSize: 18 }}>{sel.flag}</span>
          <span style={{ fontSize: 13, color: '#8899aa' }}>{sel.code}</span>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#607080" strokeWidth="2.5"><path d="M6 9l6 6 6-6" /></svg>
        </button>
        <input type="tel" inputMode="numeric" value={value}
          onChange={e => onChange(e.target.value.replace(/[^\d\s]/g, ''))}
          placeholder={placeholder} autoFocus
          style={{ flex: 1, padding: '15px 14px', border: 'none', outline: 'none', background: 'transparent', color: '#fff', fontSize: 18, fontWeight: 600, letterSpacing: '0.5px', textAlign: 'center', minWidth: 0 }}
        />
      </div>
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100, marginTop: 4,
          borderRadius: 14, border: '1px solid #ffffff15', background: '#0d1a28',
          boxShadow: '0 16px 40px rgba(0,0,0,0.6)', overflow: 'hidden', maxHeight: 240, overflowY: 'auto',
        }}>
          {CIS_LIST.map(c => (
            <button key={c.code} type="button"
              onClick={() => { onCountryChange(c.code); setOpen(false); }}
              style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '12px 16px', border: 'none', borderBottom: '1px solid #ffffff08', background: c.code === country ? '#5ba3f520' : 'transparent', color: '#fff', cursor: 'pointer' }}
            >
              <span style={{ fontSize: 22, width: 30, textAlign: 'center' }}>{c.flag}</span>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{c.name}</div>
                <div style={{ fontSize: 11, color: '#607080' }}>{c.code}</div>
              </div>
              {c.code === country && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5ba3f5" strokeWidth="2.5"><path d="M20 6L9 17l-5-5" /></svg>}
            </button>
          ))}
        </div>
      )}
      {error && <p style={{ color: '#f87171', fontSize: 12, marginTop: 6, textAlign: 'center' }}>{error}</p>}
      {!error && value.length > 0 && !pv.valid && pv.error && <p style={{ color: '#f87171', fontSize: 12, marginTop: 6, textAlign: 'center' }}>{pv.error}</p>}
      {!error && pv.valid && <p style={{ color: '#34d399', fontSize: 12, marginTop: 6, textAlign: 'center' }}>{sel.flag} {sel.name}</p>}
    </div>
  );
}
