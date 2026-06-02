import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';

export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : new Proxy({} as any, {
      get(target, prop) {
        return () => {
          throw new Error("Supabase is not configured. Falling back to LocalStorage.");
        };
      }
    });

export interface Equipment {
  id: string;
  name: string;
  category: string;
  description: string;
  pricePerDay: number;
  image: string;
  available: boolean;
  rating: number;
  owner: string;
  location: string;
  units?: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  phone2?: string;
  address: string;
  nicFrontPhoto: string;
  nicBackPhoto?: string;
}

export interface ShopProfile {
  name: string;
  address: string;
  phone: string;
  description: string;
  image?: string;
  logo?: string;
  categories?: string[];
  categoriesEnabled?: boolean;
  language?: 'en' | 'si';
}

export interface Rental {
  id: string;
  equipmentId: string;
  equipmentName: string;
  equipmentImage: string;
  startDate: string;
  endDate: string;
  totalCost: number;
  status: 'active' | 'upcoming' | 'completed';
  renterName: string;
  renterPhone?: string;
  paymentReceived?: boolean;
  returnedDate?: string;
  extendedEndDate?: string;
  notes?: string;
}

// Seed data
const INITIAL_EQUIPMENT: Equipment[] = [];
const INITIAL_RENTALS: Rental[] = [];
const INITIAL_CUSTOMERS: Customer[] = [];

const INITIAL_SHOP_PROFILE: ShopProfile = {
  name: 'My Rental Shop',
  address: '',
  phone: '',
  description: '',
  image: '',
  logo: '',
  categories: ['Camera', 'Drone', 'Tools', 'Audio', 'Transport'],
  categoriesEnabled: false,
  language: 'en',
};

// ── LocalStorage helpers ──
const getCurrentUserPhone = (): string => {
  if (typeof window === 'undefined') return 'global';
  try {
    const stored = localStorage.getItem('rented_user');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && parsed.phone) return parsed.phone;
    }
  } catch {}
  return 'global';
};

export const getLocalEquipment = (tenantPhone?: string): Equipment[] => {
  if (typeof window === 'undefined') return INITIAL_EQUIPMENT;
  const phone = tenantPhone || getCurrentUserPhone();
  const key = `rented_equipment_${phone}`;
  const stored = localStorage.getItem(key);
  if (!stored) { localStorage.setItem(key, JSON.stringify(INITIAL_EQUIPMENT)); return INITIAL_EQUIPMENT; }
  return JSON.parse(stored);
};

export const saveLocalEquipment = (items: Equipment[], tenantPhone?: string) => {
  if (typeof window !== 'undefined') {
    const phone = tenantPhone || getCurrentUserPhone();
    const key = `rented_equipment_${phone}`;
    try {
      localStorage.setItem(key, JSON.stringify(items));
    } catch (e: any) {
      if (e.name === 'QuotaExceededError' || e.code === 22) {
        console.warn("Equipment storage quota exceeded. Pruning older product images...");
        const pruned = items.map((eq, idx) => idx < items.length - 1 ? { ...eq, image: '' } : eq);
        try { localStorage.setItem(key, JSON.stringify(pruned)); } catch {}
      }
    }
  }
};

export const getLocalRentals = (tenantPhone?: string): Rental[] => {
  if (typeof window === 'undefined') return INITIAL_RENTALS;
  const phone = tenantPhone || getCurrentUserPhone();
  const key = `rented_rentals_${phone}`;
  const stored = localStorage.getItem(key);
  if (!stored) { localStorage.setItem(key, JSON.stringify(INITIAL_RENTALS)); return INITIAL_RENTALS; }
  return JSON.parse(stored);
};

export const saveLocalRentals = (items: Rental[], tenantPhone?: string) => {
  if (typeof window !== 'undefined') {
    const phone = tenantPhone || getCurrentUserPhone();
    const key = `rented_rentals_${phone}`;
    try {
      localStorage.setItem(key, JSON.stringify(items));
    } catch (e: any) {
      if (e.name === 'QuotaExceededError' || e.code === 22) {
        console.warn("Rentals storage quota exceeded. Pruning older rental images...");
        const pruned = items.map((r, idx) => idx < items.length - 1 ? { ...r, equipmentImage: '' } : r);
        try { localStorage.setItem(key, JSON.stringify(pruned)); } catch {}
      }
    }
  }
};

export const getLocalCustomers = (tenantPhone?: string): Customer[] => {
  if (typeof window === 'undefined') return INITIAL_CUSTOMERS;
  const phone = tenantPhone || getCurrentUserPhone();
  const key = `rented_customers_${phone}`;
  const stored = localStorage.getItem(key);
  if (!stored) { localStorage.setItem(key, JSON.stringify(INITIAL_CUSTOMERS)); return INITIAL_CUSTOMERS; }
  return JSON.parse(stored);
};

export const saveLocalCustomers = (items: Customer[], tenantPhone?: string) => {
  if (typeof window !== 'undefined') {
    const phone = tenantPhone || getCurrentUserPhone();
    const key = `rented_customers_${phone}`;
    try {
      localStorage.setItem(key, JSON.stringify(items));
    } catch (e: any) {
      if (e.name === 'QuotaExceededError' || e.code === 22) {
        console.warn("Customers storage quota exceeded. Pruning older NIC images...");
        const pruned = items.map((c, idx) => {
          if (idx < items.length - 1) {
            return { ...c, nicFrontPhoto: '', nicBackPhoto: '' }; // Clear large images of older customers
          }
          return c;
        });
        try {
          localStorage.setItem(key, JSON.stringify(pruned));
        } catch {
          // Final fallback: keep only the last few entries
          try { localStorage.setItem(key, JSON.stringify(items.slice(-3))); } catch {}
        }
      }
    }
  }
};

export const getLocalShopProfile = (tenantPhone?: string): ShopProfile => {
  if (typeof window === 'undefined') return INITIAL_SHOP_PROFILE;
  const phone = tenantPhone || getCurrentUserPhone();
  const key = `rented_shop_profile_${phone}`;
  const stored = localStorage.getItem(key);
  if (!stored) { localStorage.setItem(key, JSON.stringify(INITIAL_SHOP_PROFILE)); return INITIAL_SHOP_PROFILE; }
  return JSON.parse(stored);
};

export const saveLocalShopProfile = (profile: ShopProfile, tenantPhone?: string) => {
  if (typeof window !== 'undefined') {
    const phone = tenantPhone || getCurrentUserPhone();
    localStorage.setItem(`rented_shop_profile_${phone}`, JSON.stringify(profile));
  }
};

// ── Database helpers ──
export const db = {
  async checkTenantExists(phone: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.from('tenants').select('phone').eq('phone', phone);
      if (!error && data && data.length > 0) return true;
    } catch {}
    const localUsers = JSON.parse(localStorage.getItem('rented_local_users') || '[]');
    return localUsers.some((u: any) => u.phone === phone);
  },

  async getTenant(phone: string): Promise<{ phone: string; name: string } | null> {
    try {
      const { data, error } = await supabase.from('tenants').select('*').eq('phone', phone).single();
      if (!error && data) return data;
    } catch {}
    const localUsers = JSON.parse(localStorage.getItem('rented_local_users') || '[]');
    return localUsers.find((u: any) => u.phone === phone) || null;
  },

  async createTenant(phone: string, name: string): Promise<{ phone: string; name: string }> {
    try {
      await supabase.from('tenants').insert([{ phone, name }]);
      await supabase.from('shop_profiles').insert([{ tenant_phone: phone, name: name + "'s Shop", address: '', phone, description: '' }]);
    } catch (e) { console.warn("Could not sync tenant to Supabase, running locally:", e); }
    const localUsers = JSON.parse(localStorage.getItem('rented_local_users') || '[]');
    if (!localUsers.some((u: any) => u.phone === phone)) {
      localStorage.setItem('rented_local_users', JSON.stringify([...localUsers, { phone, name }]));
    }
    return { phone, name };
  },

  async getEquipment(tenantPhone?: string): Promise<Equipment[]> {
    try {
      const query = supabase.from('equipment').select('*');
      if (tenantPhone) query.eq('tenant_phone', tenantPhone);
      const { data, error } = await query;
      if (error || !data || data.length === 0) return getLocalEquipment(tenantPhone);
      return data;
    } catch { return getLocalEquipment(tenantPhone); }
  },

  async addEquipment(item: Omit<Equipment, 'id' | 'rating' | 'available'>, tenantPhone?: string): Promise<Equipment> {
    const newItem: Equipment & { tenant_phone?: string } = {
      ...item, id: 'eq-' + Math.random().toString(36).substr(2, 9),
      rating: 5.0, available: true, tenant_phone: tenantPhone
    };
    try {
      const { data, error } = await supabase.from('equipment').insert([newItem]).select().single();
      if (!error && data) { const local = getLocalEquipment(tenantPhone); saveLocalEquipment([data, ...local], tenantPhone); return data; }
    } catch {}
    const local = getLocalEquipment(tenantPhone);
    saveLocalEquipment([newItem as Equipment, ...local], tenantPhone);
    return newItem as Equipment;
  },

  async deleteEquipment(id: string): Promise<boolean> {
    try { await supabase.from('equipment').delete().eq('id', id); } catch {}
    saveLocalEquipment(getLocalEquipment().filter(e => e.id !== id));
    return true;
  },

  async updateEquipment(id: string, updates: Partial<Equipment>): Promise<Equipment | null> {
    try {
      const { data, error } = await supabase.from('equipment').update(updates).eq('id', id).select().single();
      if (!error && data) { saveLocalEquipment(getLocalEquipment().map(e => e.id === id ? data : e)); return data; }
    } catch {}
    const local = getLocalEquipment();
    const existing = local.find(e => e.id === id);
    if (!existing) return null;
    const updated = { ...existing, ...updates };
    saveLocalEquipment(local.map(e => e.id === id ? updated : e));
    return updated;
  },

  async getRentals(tenantPhone?: string): Promise<Rental[]> {
    try {
      const query = supabase.from('rentals').select('*');
      if (tenantPhone) query.eq('tenant_phone', tenantPhone);
      const { data, error } = await query;
      if (error || !data || data.length === 0) return getLocalRentals(tenantPhone);
      return data.map((r: any) => ({
        id: r.id, equipmentId: r.equipmentId || r.equipment_id,
        equipmentName: r.equipmentName || r.equipment_name,
        equipmentImage: r.equipmentImage || r.equipment_image || '',
        startDate: r.startDate || r.start_date,
        endDate: r.endDate || r.end_date,
        totalCost: r.totalCost || r.total_cost || 0,
        status: r.status, renterName: r.renterName || r.renter_name,
        renterPhone: r.renterPhone || r.renter_phone,
        paymentReceived: r.paymentReceived ?? r.payment_received ?? false,
        returnedDate: r.returnedDate || r.returned_date,
        extendedEndDate: r.extendedEndDate || r.extended_end_date,
        notes: r.notes,
      }));
    } catch { return getLocalRentals(tenantPhone); }
  },

  async rentEquipment(equipmentId: string, startDate: string, endDate: string, renterName: string, tenantPhone?: string, renterPhone?: string): Promise<Rental> {
    const equipment = (await this.getEquipment(tenantPhone)).find(e => e.id === equipmentId);
    if (!equipment) throw new Error("Equipment not found");
    const diffDays = Math.ceil(Math.abs(new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000) || 1;
    const newRental: Rental & { tenant_phone?: string } = {
      id: 'rent-' + Math.random().toString(36).substr(2, 9),
      equipmentId, equipmentName: equipment.name, equipmentImage: equipment.image,
      startDate, endDate, totalCost: diffDays * equipment.pricePerDay,
      status: new Date(startDate) > new Date() ? 'upcoming' : 'active',
      renterName, renterPhone, paymentReceived: false, tenant_phone: tenantPhone
    };
    try {
      await supabase.from('equipment').update({ available: false }).eq('id', equipmentId);
      const { data, error } = await supabase.from('rentals').insert([newRental]).select().single();
      if (!error && data) { saveLocalRentals([data, ...getLocalRentals(tenantPhone)], tenantPhone); return data; }
    } catch {}
    saveLocalRentals([newRental as Rental, ...getLocalRentals(tenantPhone)], tenantPhone);
    return newRental as Rental;
  },

  async updateRental(id: string, updates: Partial<Rental>): Promise<Rental | null> {
    try {
      const { data, error } = await supabase.from('rentals').update(updates).eq('id', id).select().single();
      if (!error && data) { saveLocalRentals(getLocalRentals().map(r => r.id === id ? data : r)); return data; }
    } catch {}
    const local = getLocalRentals();
    const existing = local.find(r => r.id === id);
    if (!existing) return null;
    const updated = { ...existing, ...updates };
    saveLocalRentals(local.map(r => r.id === id ? updated : r));
    return updated;
  },

  async deleteRental(id: string): Promise<boolean> {
    try { await supabase.from('rentals').delete().eq('id', id); } catch {}
    saveLocalRentals(getLocalRentals().filter(r => r.id !== id));
    return true;
  },

  async getShopProfile(tenantPhone?: string): Promise<ShopProfile> {
    if (!tenantPhone) return getLocalShopProfile();
    try {
      const { data, error } = await supabase.from('shop_profiles').select('*').eq('tenant_phone', tenantPhone).single();
      if (error || !data) return getLocalShopProfile(tenantPhone);
      let parsedCategories: string[] = ['Camera', 'Drone', 'Tools', 'Audio', 'Transport'];
      if (data.categories) {
        if (Array.isArray(data.categories)) parsedCategories = data.categories;
        else if (typeof data.categories === 'string') {
          try { parsedCategories = JSON.parse(data.categories); }
          catch { parsedCategories = data.categories.split(',').map((c: string) => c.trim()).filter(Boolean); }
        }
      } else {
        const lp = getLocalShopProfile(tenantPhone);
        if (lp?.categories) parsedCategories = lp.categories;
      }
      return {
        name: data.name, address: data.address || '', phone: data.phone || '',
        description: data.description || '', image: data.image || '', logo: data.logo || '',
        categories: parsedCategories,
        categoriesEnabled: data.categories_enabled ?? data.categoriesEnabled ?? false,
        language: data.language || 'en',
      };
    } catch { return getLocalShopProfile(tenantPhone); }
  },

  async saveShopProfile(profile: ShopProfile, tenantPhone?: string): Promise<ShopProfile> {
    saveLocalShopProfile(profile, tenantPhone);
    if (!tenantPhone) return profile;
    try {
      await supabase.from('shop_profiles').upsert({
        tenant_phone: tenantPhone, name: profile.name, address: profile.address,
        phone: profile.phone, description: profile.description,
        image: profile.image || '', logo: profile.logo || '',
        categories: profile.categories || [],
        categories_enabled: profile.categoriesEnabled ?? false,
        categoriesEnabled: profile.categoriesEnabled ?? false,
        language: profile.language || 'en',
        updated_at: new Date().toISOString()
      });
    } catch {}
    return profile;
  },

  async getCustomers(tenantPhone?: string): Promise<Customer[]> {
    try {
      const query = supabase.from('customers').select('*');
      if (tenantPhone) query.eq('tenant_phone', tenantPhone);
      const { data, error } = await query;
      if (error || !data || data.length === 0) return getLocalCustomers(tenantPhone);
      return data.map((c: any) => ({
        id: c.id, name: c.name, phone: c.phone, phone2: c.phone2,
        address: c.address,
        nicFrontPhoto: c.nic_front_photo || c.nicFrontPhoto,
        nicBackPhoto: c.nic_back_photo || c.nicBackPhoto,
      }));
    } catch { return getLocalCustomers(tenantPhone); }
  },

  async addCustomer(item: Omit<Customer, 'id'>, tenantPhone?: string): Promise<Customer> {
    const newItem: Customer = { ...item, id: 'c-' + Math.random().toString(36).substr(2, 9) };
    try {
      const { error } = await supabase.from('customers').insert([{
        id: newItem.id, tenant_phone: tenantPhone, name: newItem.name,
        phone: newItem.phone, phone2: newItem.phone2, address: newItem.address,
        nic_front_photo: newItem.nicFrontPhoto, nic_back_photo: newItem.nicBackPhoto
      }]);
      if (!error) { saveLocalCustomers([...getLocalCustomers(tenantPhone), newItem], tenantPhone); return newItem; }
    } catch {}
    saveLocalCustomers([...getLocalCustomers(tenantPhone), newItem], tenantPhone);
    return newItem;
  },
};
