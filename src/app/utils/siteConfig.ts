export interface PartnerConfig {
  id: string;
  name: string;
  sub: string;
  mark: string;
  color: string;
  textColor?: string;
}

export interface SiteIcons {
  logo: string;
  truck: string;
  plane: string;
  hero: string;
}

export interface SiteConfig {
  partners: PartnerConfig[];
  icons: SiteIcons;
}

const STORAGE_KEY = 'ovora_site_config';

export const DEFAULT_PARTNERS: PartnerConfig[] = [
  { id: '1', name: 'DP World',      sub: 'Global Logistics', mark: 'DP',  color: '#005eb8' },
  { id: '2', name: 'Maersk',        sub: 'Ocean Shipping',   mark: 'MAE', color: '#42b0d5' },
  { id: '3', name: 'DHL',           sub: 'Supply Chain',     mark: 'DHL', color: '#FFCC00', textColor: '#D40511' },
  { id: '4', name: 'Turkish Cargo', sub: 'Air Freight',      mark: 'TC',  color: '#e01a22' },
  { id: '5', name: 'Schenker',      sub: 'Logistics',        mark: 'DB',  color: '#ec0016' },
];

export const DEFAULT_ICONS: SiteIcons = {
  logo:  '/icons/logo-bird.png',
  truck: '/icons/cargo-truck.png',
  plane: '/icons/avia-plane.png',
  hero:  '/icons/hero-promo.png',
};

const DEFAULT_CONFIG: SiteConfig = {
  partners: DEFAULT_PARTNERS,
  icons: DEFAULT_ICONS,
};

export function getSiteConfig(): SiteConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<SiteConfig>;
      return {
        partners: parsed.partners?.length ? parsed.partners : DEFAULT_PARTNERS,
        icons: { ...DEFAULT_ICONS, ...(parsed.icons ?? {}) },
      };
    }
  } catch {}
  return DEFAULT_CONFIG;
}

export function saveSiteConfig(config: SiteConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  window.dispatchEvent(new CustomEvent('ovora_site_config_changed'));
}

export function resetSiteConfig(): void {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent('ovora_site_config_changed'));
}
