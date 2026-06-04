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
  nic?: string;
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

// Helper to upload base64 to Supabase storage bucket 'customers'
const uploadNicPhotoToSupabase = async (base64Data: string, type: 'front' | 'back'): Promise<string> => {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Supabase not configured. Storing image as base64.");
    return base64Data;
  }
  
  try {
    // Check if it's base64, if not it's already a URL
    if (!base64Data || !base64Data.startsWith('data:image')) {
      return base64Data;
    }
    
    // Convert base64 to Blob
    const base64Content = base64Data.split(';base64,').pop();
    if (!base64Content) return base64Data;
    
    const byteCharacters = atob(base64Content);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/jpeg' });
    
    // Generate clean filename
    const cleanFileName = `nic_${type}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}.jpg`;
    
    // 1. Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('customers')
      .upload(cleanFileName, blob, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: true
      });
      
    if (error) {
      console.warn(`Supabase upload failed for ${type}. Attempting to create bucket 'customers'...`, error);
      // Try to create the bucket dynamically in case it does not exist
      try {
        await supabase.storage.createBucket('customers', {
          public: true,
          fileSizeLimit: 10485760 // 10MB
        });
        
        // Retry upload
        const { data: retryData, error: retryError } = await supabase.storage
          .from('customers')
          .upload(cleanFileName, blob, {
            contentType: 'image/jpeg',
            cacheControl: '3600',
            upsert: true
          });
          
        if (retryError) {
          console.error("Supabase storage upload retry error:", retryError);
          return base64Data;
        }
        
        const { data: { publicUrl } } = supabase.storage
          .from('customers')
          .getPublicUrl(cleanFileName);
          
        return publicUrl;
      } catch (err) {
        console.error("Could not create bucket or upload:", err);
        return base64Data; // fallback
      }
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from('customers')
      .getPublicUrl(cleanFileName);
      
    return publicUrl;
  } catch (err) {
    console.error("Error in uploadNicPhotoToSupabase:", err);
    return base64Data; // fallback
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

  async getTenant(phone: string): Promise<{ phone: string; name: string; verification_code?: string } | null> {
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

  async adminListTenants(): Promise<Array<{ phone: string; name: string; verification_code?: string }>> {
    try {
      const { data, error } = await supabase.from('tenants').select('*').order('name');
      if (!error && data) return data;
    } catch {}
    return JSON.parse(localStorage.getItem('rented_local_users') || '[]');
  },

  async adminCreateTenant(phone: string, name: string): Promise<{ phone: string; name: string; verification_code: string }> {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    try {
      await supabase.from('tenants').insert([{ phone, name, verification_code: code }]);
      await supabase.from('shop_profiles').insert([{ tenant_phone: phone, name: name + "'s Shop", address: '', phone, description: '' }]);
    } catch (e) {
      console.warn("Could not sync admin tenant to Supabase, running locally:", e);
    }
    const localUsers = JSON.parse(localStorage.getItem('rented_local_users') || '[]');
    if (!localUsers.some((u: any) => u.phone === phone)) {
      localStorage.setItem('rented_local_users', JSON.stringify([...localUsers, { phone, name, verification_code: code }]));
    }
    return { phone, name, verification_code: code };
  },

  async adminDeleteTenant(phone: string): Promise<boolean> {
    try {
      await supabase.from('tenants').delete().eq('phone', phone);
      await supabase.from('shop_profiles').delete().eq('tenant_phone', phone);
      await supabase.from('equipment').delete().eq('tenant_phone', phone);
      await supabase.from('rentals').delete().eq('tenant_phone', phone);
      await supabase.from('customers').delete().eq('tenant_phone', phone);
    } catch (e) {
      console.warn("Could not delete tenant from Supabase, running locally:", e);
    }
    const localUsers = JSON.parse(localStorage.getItem('rented_local_users') || '[]');
    localStorage.setItem('rented_local_users', JSON.stringify(localUsers.filter((u: any) => u.phone !== phone)));
    localStorage.removeItem(`rented_equipment_${phone}`);
    localStorage.removeItem(`rented_rentals_${phone}`);
    localStorage.removeItem(`rented_customers_${phone}`);
    localStorage.removeItem(`rented_shop_profile_${phone}`);
    return true;
  },

  async getEquipment(tenantPhone?: string): Promise<Equipment[]> {
    try {
      const query = supabase.from('equipment').select('*');
      if (tenantPhone) query.eq('tenant_phone', tenantPhone);
      const { data, error } = await query;
      if (error || !data || data.length === 0) return getLocalEquipment(tenantPhone);
      return data.map((e: any) => ({
        id: e.id,
        name: e.name,
        category: e.category,
        description: e.description,
        pricePerDay: e.pricePerDay || e.price_per_day || 0,
        image: e.image,
        available: e.available,
        rating: e.rating,
        owner: e.owner,
        location: e.location,
        units: e.units
      }));
    } catch { return getLocalEquipment(tenantPhone); }
  },

  async addEquipment(item: Omit<Equipment, 'id' | 'rating' | 'available'>, tenantPhone?: string): Promise<Equipment> {
    const newItem: Equipment & { tenant_phone?: string } = {
      ...item, id: 'eq-' + Math.random().toString(36).substr(2, 9),
      rating: 5.0, available: true, tenant_phone: tenantPhone
    };
    try {
      const dbItem = {
        id: newItem.id,
        name: newItem.name,
        category: newItem.category,
        description: newItem.description,
        price_per_day: newItem.pricePerDay,
        image: newItem.image,
        available: newItem.available,
        rating: newItem.rating,
        owner: newItem.owner,
        location: newItem.location,
        units: newItem.units || 1,
        tenant_phone: tenantPhone
      };
      const { data, error } = await supabase.from('equipment').insert([dbItem]).select().single();
      if (!error && data) {
        const mappedData: Equipment = {
          id: data.id,
          name: data.name,
          category: data.category,
          description: data.description,
          pricePerDay: data.pricePerDay || data.price_per_day || 0,
          image: data.image,
          available: data.available,
          rating: data.rating,
          owner: data.owner,
          location: data.location,
          units: data.units
        };
        const local = getLocalEquipment(tenantPhone);
        saveLocalEquipment([mappedData, ...local], tenantPhone);
        return mappedData;
      }
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
      const dbUpdates: any = { ...updates };
      if (updates.pricePerDay !== undefined) {
        dbUpdates.price_per_day = updates.pricePerDay;
        delete dbUpdates.pricePerDay;
      }
      const { data, error } = await supabase.from('equipment').update(dbUpdates).eq('id', id).select().single();
      if (!error && data) {
        const mappedData: Equipment = {
          id: data.id,
          name: data.name,
          category: data.category,
          description: data.description,
          pricePerDay: data.pricePerDay || data.price_per_day || 0,
          image: data.image,
          available: data.available,
          rating: data.rating,
          owner: data.owner,
          location: data.location,
          units: data.units
        };
        saveLocalEquipment(getLocalEquipment().map(e => e.id === id ? mappedData : e));
        return mappedData;
      }
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
        language: profile.language || 'en',
        updated_at: new Date().toISOString()
      });
      // Sync the name back to the tenants table too!
      await supabase.from('tenants').update({ name: profile.name }).eq('phone', tenantPhone);
    } catch {}
    // Also update local user list if running locally
    try {
      const localUsers = JSON.parse(localStorage.getItem('rented_local_users') || '[]');
      const updatedLocal = localUsers.map((u: any) => u.phone === tenantPhone ? { ...u, name: profile.name } : u);
      localStorage.setItem('rented_local_users', JSON.stringify(updatedLocal));
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
        id: c.id, name: c.name, phone: c.phone, nic: c.phone2 || c.nic,
        address: c.address,
        nicFrontPhoto: c.nic_front_photo || c.nicFrontPhoto,
        nicBackPhoto: c.nic_back_photo || c.nicBackPhoto,
      }));
    } catch { return getLocalCustomers(tenantPhone); }
  },

  async addCustomer(item: Omit<Customer, 'id'>, tenantPhone?: string): Promise<Customer> {
    const frontPhoto = await uploadNicPhotoToSupabase(item.nicFrontPhoto, 'front');
    const backPhoto = item.nicBackPhoto ? await uploadNicPhotoToSupabase(item.nicBackPhoto, 'back') : undefined;

    const newItem: Customer = { 
      ...item, 
      nicFrontPhoto: frontPhoto, 
      nicBackPhoto: backPhoto,
      id: 'c-' + Math.random().toString(36).substr(2, 9) 
    };
    try {
      const { error } = await supabase.from('customers').insert([{
        id: newItem.id, tenant_phone: tenantPhone, name: newItem.name,
        phone: newItem.phone, phone2: newItem.nic, address: newItem.address,
        nic_front_photo: newItem.nicFrontPhoto, nic_back_photo: newItem.nicBackPhoto
      }]);
      if (!error) { saveLocalCustomers([...getLocalCustomers(tenantPhone), newItem], tenantPhone); return newItem; }
    } catch {}
    saveLocalCustomers([...getLocalCustomers(tenantPhone), newItem], tenantPhone);
    return newItem;
  },

  async deleteCustomer(id: string, tenantPhone?: string): Promise<boolean> {
    try { await supabase.from('customers').delete().eq('id', id); } catch {}
    saveLocalCustomers(getLocalCustomers(tenantPhone).filter(c => c.id !== id), tenantPhone);
    return true;
  },

  async syncLocalData(tenantPhone: string): Promise<void> {
    try {
      // 1. Sync Equipment
      const localEquip = getLocalEquipment(tenantPhone);
      if (localEquip.length > 0) {
        const { data: dbEquip } = await supabase.from('equipment').select('id').eq('tenant_phone', tenantPhone);
        const dbIds = new Set(dbEquip?.map((e: any) => e.id) || []);
        const toInsert = localEquip.filter(e => !dbIds.has(e.id)).map(e => ({
          id: e.id,
          name: e.name,
          category: e.category,
          description: e.description,
          pricePerDay: e.pricePerDay,
          image: e.image,
          available: e.available,
          rating: e.rating,
          owner: e.owner,
          location: e.location,
          units: e.units || 1,
          tenant_phone: tenantPhone
        }));
        if (toInsert.length > 0) {
          await supabase.from('equipment').insert(toInsert);
        }
      }

      // 2. Sync Customers
      const localCust = getLocalCustomers(tenantPhone);
      if (localCust.length > 0) {
        const { data: dbCust } = await supabase.from('customers').select('id').eq('tenant_phone', tenantPhone);
        const dbIds = new Set(dbCust?.map((c: any) => c.id) || []);
        const toInsert = localCust.filter(c => !dbIds.has(c.id)).map(c => ({
          id: c.id,
          name: c.name,
          phone: c.phone,
          phone2: c.nic,
          address: c.address,
          nic_front_photo: c.nicFrontPhoto,
          nic_back_photo: c.nicBackPhoto,
          tenant_phone: tenantPhone
        }));
        if (toInsert.length > 0) {
          await supabase.from('customers').insert(toInsert);
        }
      }

      // 3. Sync Rentals
      const localRentals = getLocalRentals(tenantPhone);
      if (localRentals.length > 0) {
        const { data: dbRent } = await supabase.from('rentals').select('id').eq('tenant_phone', tenantPhone);
        const dbIds = new Set(dbRent?.map((r: any) => r.id) || []);
        const toInsert = localRentals.filter(r => !dbIds.has(r.id)).map(r => ({
          id: r.id,
          equipment_id: r.equipmentId,
          equipmentName: r.equipmentName,
          equipmentImage: r.equipmentImage,
          start_date: r.startDate,
          end_date: r.endDate,
          total_cost: r.totalCost,
          status: r.status,
          renter_name: r.renterName,
          renter_phone: r.renterPhone,
          payment_received: r.paymentReceived,
          returned_date: r.returnedDate,
          extended_end_date: r.extendedEndDate,
          notes: r.notes,
          tenant_phone: tenantPhone
        }));
        if (toInsert.length > 0) {
          await supabase.from('rentals').insert(toInsert);
        }
      }

      // 4. Sync Shop Profile
      const localProfile = getLocalShopProfile(tenantPhone);
      if (localProfile) {
        const { data: dbProfile } = await supabase.from('shop_profiles').select('tenant_phone').eq('tenant_phone', tenantPhone).single();
        if (!dbProfile) {
          await supabase.from('shop_profiles').insert([{
            tenant_phone: tenantPhone,
            name: localProfile.name,
            address: localProfile.address,
            phone: localProfile.phone,
            description: localProfile.description,
            image: localProfile.image || '',
            logo: localProfile.logo || '',
            categories: localProfile.categories || [],
            categories_enabled: localProfile.categoriesEnabled ?? false,
            language: localProfile.language || 'en',
          }]);
        }
      }
    } catch (err) {
      console.warn("Failed to sync local data to Supabase:", err);
    }
  }
};
