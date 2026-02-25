import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL ve Anon Key tanımlanmamış!');
}

// Debug: API key formatını kontrol et (sadece development'ta)
if (import.meta.env.DEV) {
  console.log('[Supabase Config]', {
    url: supabaseUrl,
    keyPrefix: supabaseAnonKey?.substring(0, 20) + '...',
    keyLength: supabaseAnonKey?.length,
    keyFormat: supabaseAnonKey?.startsWith('eyJ') ? 'JWT (Legacy)' : 'Invalid format'
  });
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Fetch wrapper - Supabase client çalışmadığında kullanılır
export const dbQuery = (table: string) => {
  return new SupabaseQuery(table, supabaseUrl, supabaseAnonKey);
};

// Eski isimle de export et (geriye uyumluluk için)
export const supabaseFetch = {
  url: supabaseUrl,
  key: supabaseAnonKey,
  
  async from(table: string) {
    return new SupabaseQuery(table, supabaseUrl, supabaseAnonKey);
  }
};

class SupabaseQuery {
  private table: string;
  private url: string;
  private key: string;
  private filters: string[] = [];
  private selectFields: string = '*';
  private orderBy: string[] = [];
  private limitCount: number | null = null;
  private singleResult: boolean = false;

  constructor(table: string, url: string, key: string) {
    this.table = table;
    this.url = url;
    this.key = key;
  }

  select(fields: string = '*') {
    this.selectFields = fields;
    return this;
  }

  eq(column: string, value: any) {
    this.filters.push(`${column}=eq.${value}`);
    return this;
  }

  neq(column: string, value: any) {
    this.filters.push(`${column}=neq.${value}`);
    return this;
  }

  gt(column: string, value: any) {
    this.filters.push(`${column}=gt.${value}`);
    return this;
  }

  gte(column: string, value: any) {
    this.filters.push(`${column}=gte.${value}`);
    return this;
  }

  lt(column: string, value: any) {
    this.filters.push(`${column}=lt.${value}`);
    return this;
  }

  lte(column: string, value: any) {
    this.filters.push(`${column}=lte.${value}`);
    return this;
  }

  ilike(column: string, value: string) {
    this.filters.push(`${column}=ilike.*${value}*`);
    return this;
  }

  in(column: string, values: any[]) {
    this.filters.push(`${column}=in.(${values.join(',')})`);
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    const dir = options?.ascending === false ? 'desc' : 'asc';
    this.orderBy.push(`${column}.${dir}`);
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  single() {
    this.singleResult = true;
    this.limitCount = 1;
    return this;
  }

  async execute(): Promise<{ data: any; error: any }> {
    try {
      let queryUrl = `${this.url}/rest/v1/${this.table}?select=${this.selectFields}`;
      
      if (this.filters.length > 0) {
        queryUrl += '&' + this.filters.join('&');
      }
      
      if (this.orderBy.length > 0) {
        queryUrl += '&order=' + this.orderBy.join(',');
      }
      
      if (this.limitCount) {
        queryUrl += `&limit=${this.limitCount}`;
      }

      const response = await fetch(queryUrl, {
        headers: {
          'apikey': this.key,
          'Authorization': `Bearer ${this.key}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorJson = null;
        try {
          errorJson = JSON.parse(errorText);
        } catch {
          errorJson = errorText;
        }
        
        console.error(`[dbQuery ERROR] Table: ${this.table}`, {
          status: response.status,
          statusText: response.statusText,
          error: errorJson,
          url: queryUrl.substring(0, 200) + '...',
          headers: {
            'apikey': this.key?.substring(0, 20) + '...',
            'keyLength': this.key?.length,
            'keyFormat': this.key?.startsWith('eyJ') ? 'JWT' : 'INVALID'
          }
        });
        return { data: null, error: { message: errorText, code: response.status, details: errorJson } };
      }

      const data = await response.json();
      console.log(`[dbQuery SUCCESS] Table: ${this.table}`, `Found ${Array.isArray(data) ? data.length : 1} record(s)`);
      return { data: this.singleResult ? data[0] || null : data, error: null };
    } catch (error: any) {
      return { data: null, error: { message: error.message } };
    }
  }

  // INSERT
  async insert(data: any): Promise<{ data: any; error: any }> {
    try {
      const response = await fetch(`${this.url}/rest/v1/${this.table}`, {
        method: 'POST',
        headers: {
          'apikey': this.key,
          'Authorization': `Bearer ${this.key}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { data: null, error: { message: errorText, code: response.status } };
      }

      const result = await response.json();
      return { data: result, error: null };
    } catch (error: any) {
      return { data: null, error: { message: error.message } };
    }
  }

  // UPDATE
  async update(data: any): Promise<{ data: any; error: any }> {
    try {
      let queryUrl = `${this.url}/rest/v1/${this.table}`;
      
      if (this.filters.length > 0) {
        queryUrl += '?' + this.filters.join('&');
      }

      const response = await fetch(queryUrl, {
        method: 'PATCH',
        headers: {
          'apikey': this.key,
          'Authorization': `Bearer ${this.key}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { data: null, error: { message: errorText, code: response.status } };
      }

      const result = await response.json();
      return { data: result, error: null };
    } catch (error: any) {
      return { data: null, error: { message: error.message } };
    }
  }

  // DELETE
  async delete(): Promise<{ data: any; error: any }> {
    try {
      let queryUrl = `${this.url}/rest/v1/${this.table}`;
      
      if (this.filters.length > 0) {
        queryUrl += '?' + this.filters.join('&');
      }

      const response = await fetch(queryUrl, {
        method: 'DELETE',
        headers: {
          'apikey': this.key,
          'Authorization': `Bearer ${this.key}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { data: null, error: { message: errorText, code: response.status } };
      }

      return { data: null, error: null };
    } catch (error: any) {
      return { data: null, error: { message: error.message } };
    }
  }

  // Alias for execute
  then(resolve: (value: { data: any; error: any }) => void) {
    return this.execute().then(resolve);
  }
}

// Types
export interface Property {
  id: string;
  title: string;
  description: string;
  location: string;
  city: string;
  district: string;
  price_per_night: number;
  cleaning_fee: number;
  deposit: number;
  bedrooms: number;
  living_rooms: number;
  bathrooms: number;
  max_guests: number;
  property_type: string;
  rating: number;
  review_count: number;
  is_featured: boolean;
  is_available: boolean;
  minimum_nights: number;
  supplier_id?: string; // Tedarikçi ID (Admin bilgisi)
  created_at: string;
  updated_at: string;
}

// Oda ve Yatak Bilgileri
export interface RoomBed {
  id?: string;
  property_id: string;
  room_name: string;
  room_type: 'bedroom' | 'living_room';
  bed_type: string;
  bed_count: number;
  created_at?: string;
}

// Yatak tipleri
export const BED_TYPES = [
  { value: 'single', label: 'Tek Kişilik Yatak', icon: 'ri-hotel-bed-line' },
  { value: 'double', label: 'Çift Kişilik Yatak', icon: 'ri-hotel-bed-fill' },
  { value: 'queen', label: 'Queen Size Yatak', icon: 'ri-hotel-bed-fill' },
  { value: 'king', label: 'King Size Yatak', icon: 'ri-hotel-bed-fill' },
  { value: 'sofa_bed', label: 'Çekyat / Açılır Yatak', icon: 'ri-sofa-line' },
  { value: 'bunk', label: 'Ranza', icon: 'ri-stack-line' },
  { value: 'baby_crib', label: 'Bebek Yatağı', icon: 'ri-emotion-happy-line' },
];

export interface PropertyImage {
  id: string;
  property_id: string;
  image_url: string;
  is_primary: boolean;
  display_order: number;
  created_at: string;
}

// Eski Amenity interface'i (geriye uyumluluk için)
export interface Amenity {
  id: string;
  property_id: string;
  name: string;
  icon: string;
  category: string;
  created_at: string;
}

// Yeni merkezi olanak yapısı
export interface AmenityOption {
  id: string;
  name: string;
  icon: string;
  category: string;
  is_active: boolean;
  display_order: number;
  created_at?: string;
}

// Property-Amenity ilişki tablosu
export interface PropertyAmenity {
  id?: string;
  property_id: string;
  amenity_option_id: string;
  created_at?: string;
}

// Olanak kategorileri
export const AMENITY_CATEGORIES = [
  { value: 'general', label: 'Genel', icon: 'ri-home-line' },
  { value: 'kitchen', label: 'Mutfak', icon: 'ri-restaurant-line' },
  { value: 'bathroom', label: 'Banyo', icon: 'ri-drop-line' },
  { value: 'bedroom', label: 'Yatak Odası', icon: 'ri-hotel-bed-line' },
  { value: 'entertainment', label: 'Eğlence', icon: 'ri-tv-line' },
  { value: 'outdoor', label: 'Dış Mekan', icon: 'ri-plant-line' },
  { value: 'safety', label: 'Güvenlik', icon: 'ri-shield-check-line' },
  { value: 'services', label: 'Hizmetler', icon: 'ri-service-line' },
];

// Varsayılan olanak ikonları (check ikonu en başta - varsayılan)
export const AMENITY_ICONS = [
  // Varsayılan / Genel
  'ri-check-line',
  'ri-checkbox-circle-line',
  'ri-checkbox-circle-fill',
  'ri-check-double-line',
  'ri-star-line',
  'ri-star-fill',
  'ri-heart-line',
  'ri-thumb-up-line',
  
  // İnternet & Teknoloji
  'ri-wifi-line',
  'ri-wifi-fill',
  'ri-home-wifi-line',
  'ri-signal-wifi-line',
  'ri-tv-line',
  'ri-tv-2-line',
  'ri-computer-line',
  'ri-smartphone-line',
  'ri-tablet-line',
  'ri-bluetooth-line',
  'ri-cast-line',
  
  // Klima & Isıtma
  'ri-temp-cold-line',
  'ri-temp-hot-line',
  'ri-fire-line',
  'ri-fire-fill',
  'ri-wind-line',
  'ri-snowflake-line',
  'ri-sun-line',
  'ri-sun-fill',
  'ri-moon-line',
  
  // Mutfak & Yemek
  'ri-fridge-line',
  'ri-restaurant-line',
  'ri-restaurant-2-line',
  'ri-cup-line',
  'ri-cup-fill',
  'ri-goblet-line',
  'ri-cake-line',
  'ri-cake-2-line',
  'ri-knife-line',
  'ri-knife-blood-line',
  'ri-bowl-line',
  
  // Banyo & Temizlik
  'ri-drop-line',
  'ri-drop-fill',
  'ri-droplet-line',
  'ri-shower-line',
  'ri-bath-line',
  'ri-shirt-line',
  'ri-t-shirt-line',
  'ri-brush-line',
  'ri-soap-line',
  
  // Havuz & Deniz
  'ri-swim-line',
  'ri-pool-line',
  'ri-water-flash-line',
  'ri-lifebuoy-line',
  'ri-anchor-line',
  'ri-ship-line',
  'ri-sailboat-line',
  'ri-umbrella-line',
  'ri-umbrella-fill',
  
  // Bahçe & Dış Mekan
  'ri-plant-line',
  'ri-plant-fill',
  'ri-seedling-line',
  'ri-flower-line',
  'ri-leaf-line',
  'ri-tree-line',
  'ri-landscape-line',
  'ri-sun-foggy-line',
  'ri-rainbow-line',
  'ri-barbecue-line',
  'ri-fire-fill',
  
  // Spor & Aktivite
  'ri-game-line',
  'ri-gamepad-line',
  'ri-basketball-line',
  'ri-football-line',
  'ri-tennis-line',
  'ri-ping-pong-line',
  'ri-golf-ball-line',
  'ri-riding-line',
  'ri-run-line',
  'ri-walk-line',
  'ri-bike-line',
  'ri-motorbike-line',
  
  // Müzik & Eğlence
  'ri-music-line',
  'ri-music-2-line',
  'ri-headphone-line',
  'ri-speaker-line',
  'ri-mic-line',
  'ri-guitar-line',
  'ri-disc-line',
  'ri-film-line',
  'ri-movie-line',
  'ri-clapperboard-line',
  
  // Ulaşım & Park
  'ri-parking-line',
  'ri-parking-box-line',
  'ri-car-line',
  'ri-car-fill',
  'ri-taxi-line',
  'ri-bus-line',
  'ri-subway-line',
  'ri-flight-takeoff-line',
  'ri-flight-land-line',
  'ri-map-pin-line',
  'ri-road-map-line',
  'ri-compass-line',
  
  // Güvenlik
  'ri-shield-check-line',
  'ri-shield-line',
  'ri-lock-line',
  'ri-lock-password-line',
  'ri-door-lock-line',
  'ri-key-line',
  'ri-key-2-line',
  'ri-fingerprint-line',
  'ri-camera-line',
  'ri-camera-2-line',
  'ri-eye-line',
  'ri-alarm-warning-line',
  'ri-alarm-line',
  'ri-smoke-line',
  
  // Sağlık
  'ri-first-aid-kit-line',
  'ri-hearts-line',
  'ri-heart-pulse-line',
  'ri-medicine-bottle-line',
  'ri-stethoscope-line',
  'ri-capsule-line',
  'ri-syringe-line',
  'ri-thermometer-line',
  'ri-mental-health-line',
  'ri-hand-sanitizer-line',
  
  // Ev & Mobilya
  'ri-home-line',
  'ri-home-2-line',
  'ri-home-4-line',
  'ri-home-smile-line',
  'ri-building-line',
  'ri-building-2-line',
  'ri-hotel-line',
  'ri-hotel-bed-line',
  'ri-sofa-line',
  'ri-armchair-line',
  'ri-door-line',
  'ri-window-line',
  'ri-lightbulb-line',
  'ri-lightbulb-flash-line',
  'ri-flashlight-line',
  'ri-safe-line',
  'ri-safe-2-line',
  
  // Hayvanlar
  'ri-bear-smile-line',
  'ri-bug-line',
  'ri-bird-line',
  'ri-fish-line',
  'ri-paw-line',
  
  // Bebek & Çocuk
  'ri-baby-line',
  'ri-user-heart-line',
  'ri-parent-line',
  'ri-wheelchair-line',
  
  // Doğa & Manzara
  'ri-mountain-line',
  'ri-cloud-line',
  'ri-cloudy-line',
  'ri-foggy-line',
  'ri-snowy-line',
  'ri-rainy-line',
  'ri-windy-line',
  'ri-moon-foggy-line',
  'ri-sunrise-line',
  'ri-sunset-line',
  
  // İş & Ofis
  'ri-printer-line',
  'ri-projector-line',
  'ri-presentation-line',
  'ri-briefcase-line',
  'ri-calculator-line',
  
  // Diğer
  'ri-cake-3-line',
  'ri-gift-line',
  'ri-award-line',
  'ri-trophy-line',
  'ri-medal-line',
  'ri-vip-crown-line',
  'ri-vip-diamond-line',
  'ri-magic-line',
  'ri-sparkling-line',
  'ri-emotion-happy-line',
  'ri-emotion-laugh-line',
  'ri-hand-heart-line',
  'ri-service-line',
  'ri-customer-service-line',
  'ri-24-hours-line',
  'ri-time-line',
  'ri-calendar-check-line',
  'ri-book-open-line',
  'ri-newspaper-line',
  'ri-article-line',
  'ri-quill-pen-line',
];

export interface Review {
  id: string;
  property_id: string;
  user_name: string;
  user_avatar: string;
  rating: number;
  comment: string;
  created_at: string;
}

// Site genel yorumları (homepage testimonials)
export interface SiteReview {
  id: string;
  name: string;
  location?: string;
  avatar_url?: string;
  rating: number;
  comment: string;
  is_active: boolean;
  show_on_home: boolean;
  sort_order?: number;
  created_at: string;
}

export interface Booking {
  id?: string;
  property_id: string;
  user_id?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  check_in_date: string;
  check_out_date: string;
  adults: number;
  children: number;
  special_requests?: string;
  total_amount: number;
  total_price?: number;
  calculated_price?: number; // Sistem tarafından hesaplanan fiyat
  source?: 'realtor' | 'booking.com' | 'airbnb' | 'aylin_villas' | 'web'; // Rezervasyon kaynağı
  realtor_id?: string; // Eğer emlakçıdan geldiyse emlakçı ID'si
  status?: string;
  reference_code?: string;
  created_at?: string;
}

// Site Ayarları
export interface SiteSettings {
  id?: string;
  phone_primary: string;
  phone_whatsapp: string;
  email: string;
  address?: string;
  working_hours?: string;
  facebook_url?: string;
  instagram_url?: string;
  twitter_url?: string;
  contact_description?: string;
  house_rules?: string;
  additional_info?: string;
  updated_at?: string;
}

// Kullanıcı Tipleri
export type UserRole = 'admin' | 'supplier' | 'agent' | 'member';

export interface AppUser {
  id: string;
  auth_id?: string; // Supabase Auth ID
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: UserRole;
  company_name?: string; // Tedarikçi/Aracı için
  tax_number?: string; // Tedarikçi için
  address?: string;
  notes?: string;
  commission_rate?: number; // Komisyon oranı (yüzde)
  is_active: boolean;
  is_approved: boolean; // Tedarikçi/Aracı onay durumu
  created_at?: string;
  updated_at?: string;
}

// Harcama/Muhasebe
export interface Expense {
  id?: string;
  property_id: string;
  expense_type: 'electricity' | 'water' | 'maintenance' | 'cleaning' | 'other';
  description: string;
  amount: number;
  expense_date: string; // Fatura tarihi
  due_date?: string; // Son ödeme tarihi
  is_paid: boolean;
  paid_date?: string;
  invoice_number?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

// Tedarikçi Başvurusu
export interface SupplierApplication {
  id?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  company_name?: string;
  tax_number?: string;
  address?: string;
  property_count?: number; // Kaç mülk kiraya vermek istiyor
  property_locations?: string; // Mülklerin konumları
  message?: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes?: string;
  created_at?: string;
  updated_at?: string;
}

// Cari Hesap
export interface LedgerAccount {
  id?: string;
  user_id?: string | null; // null ise firma cari hesabı
  user_role: 'supplier' | 'agent' | 'realtor' | 'company';
  balance: number;
  created_at?: string;
  updated_at?: string;
}

// Cari İşlem
export interface LedgerTransaction {
  id?: string;
  account_id: string;
  booking_id?: string;
  transaction_type: 'commission' | 'payment' | 'adjustment';
  amount: number;
  description?: string;
  commission_rate?: number;
  commission_base?: number;
  created_at?: string;
}

// Kullanıcı Rolleri
export const USER_ROLES = [
  { value: 'admin', label: 'Admin', icon: 'ri-shield-user-line', color: 'red' },
  { value: 'supplier', label: 'Tedarikçi', icon: 'ri-home-gear-line', color: 'blue' },
  { value: 'agent', label: 'Aracı', icon: 'ri-user-star-line', color: 'purple' },
  { value: 'member', label: 'Üye', icon: 'ri-user-line', color: 'green' },
];
