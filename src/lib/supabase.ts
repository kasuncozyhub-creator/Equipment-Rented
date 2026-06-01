import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
}

// Seed data for a premium experience out-of-the-box
const INITIAL_EQUIPMENT: Equipment[] = [];

const INITIAL_RENTALS: Rental[] = [];

const INITIAL_CUSTOMERS: Customer[] = [];

const INITIAL_SHOP_PROFILE: ShopProfile = {
  name: 'My Rental Shop',
  address: '',
  phone: '',
  description: ''
};

// Helper to interact with LocalStorage as fallback
export const getLocalEquipment = (): Equipment[] => {
  if (typeof window === 'undefined') return INITIAL_EQUIPMENT;
  
  // One-time cleanup to ensure all legacy dummy/seed data is completely removed from the user's browser
  if (!localStorage.getItem('rented_dummy_cleanup_v2')) {
    localStorage.removeItem('rented_equipment');
    localStorage.removeItem('rented_rentals');
    localStorage.removeItem('rented_customers');
    localStorage.setItem('rented_dummy_cleanup_v2', 'true');
  }

  const stored = localStorage.getItem('rented_equipment');
  if (!stored) {
    localStorage.setItem('rented_equipment', JSON.stringify(INITIAL_EQUIPMENT));
    return INITIAL_EQUIPMENT;
  }
  return JSON.parse(stored);
};

export const saveLocalEquipment = (items: Equipment[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('rented_equipment', JSON.stringify(items));
  }
};

export const getLocalRentals = (): Rental[] => {
  if (typeof window === 'undefined') return INITIAL_RENTALS;
  const stored = localStorage.getItem('rented_rentals');
  if (!stored) {
    localStorage.setItem('rented_rentals', JSON.stringify(INITIAL_RENTALS));
    return INITIAL_RENTALS;
  }
  return JSON.parse(stored);
};

export const saveLocalRentals = (items: Rental[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('rented_rentals', JSON.stringify(items));
  }
};

export const getLocalCustomers = (): Customer[] => {
  if (typeof window === 'undefined') return INITIAL_CUSTOMERS;
  const stored = localStorage.getItem('rented_customers');
  if (!stored) {
    localStorage.setItem('rented_customers', JSON.stringify(INITIAL_CUSTOMERS));
    return INITIAL_CUSTOMERS;
  }
  return JSON.parse(stored);
};

export const saveLocalCustomers = (items: Customer[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('rented_customers', JSON.stringify(items));
  }
};

export const getLocalShopProfile = (): ShopProfile => {
  if (typeof window === 'undefined') return INITIAL_SHOP_PROFILE;
  const stored = localStorage.getItem('rented_shop_profile');
  if (!stored) {
    localStorage.setItem('rented_shop_profile', JSON.stringify(INITIAL_SHOP_PROFILE));
    return INITIAL_SHOP_PROFILE;
  }
  return JSON.parse(stored);
};

export const saveLocalShopProfile = (profile: ShopProfile) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('rented_shop_profile', JSON.stringify(profile));
  }
};

// Database interfaces
export const db = {
  async getEquipment(): Promise<Equipment[]> {
    try {
      const { data, error } = await supabase.from('equipment').select('*');
      if (error || !data || data.length === 0) {
        return getLocalEquipment();
      }
      return data;
    } catch {
      return getLocalEquipment();
    }
  },

  async addEquipment(item: Omit<Equipment, 'id' | 'rating' | 'available'>): Promise<Equipment> {
    const newItem: Equipment = {
      ...item,
      id: 'eq-' + Math.random().toString(36).substr(2, 9),
      rating: 5.0,
      available: true
    };
    
    try {
      const { data, error } = await supabase.from('equipment').insert([newItem]).select().single();
      if (!error && data) {
        // Update local cache
        const local = getLocalEquipment();
        saveLocalEquipment([data, ...local]);
        return data;
      }
    } catch {}

    const local = getLocalEquipment();
    const updated = [newItem, ...local];
    saveLocalEquipment(updated);
    return newItem;
  },

  async getRentals(): Promise<Rental[]> {
    try {
      const { data, error } = await supabase.from('rentals').select('*');
      if (error || !data || data.length === 0) {
        return getLocalRentals();
      }
      return data;
    } catch {
      return getLocalRentals();
    }
  },

  async rentEquipment(equipmentId: string, startDate: string, endDate: string, renterName: string): Promise<Rental> {
    const equipment = (await this.getEquipment()).find(e => e.id === equipmentId);
    if (!equipment) throw new Error("Equipment not found");

    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
    const totalCost = diffDays * equipment.pricePerDay;

    const newRental: Rental = {
      id: 'rent-' + Math.random().toString(36).substr(2, 9),
      equipmentId,
      equipmentName: equipment.name,
      equipmentImage: equipment.image,
      startDate,
      endDate,
      totalCost,
      status: start > new Date() ? 'upcoming' : 'active',
      renterName
    };

    // Update equipment availability
    const equipmentList = await this.getEquipment();
    const updatedEquip = equipmentList.map(e => e.id === equipmentId ? { ...e, available: false } : e);
    saveLocalEquipment(updatedEquip);

    try {
      // Attempt database update
      await supabase.from('equipment').update({ available: false }).eq('id', equipmentId);
      const { data, error } = await supabase.from('rentals').insert([newRental]).select().single();
      if (!error && data) {
        const rentals = getLocalRentals();
        saveLocalRentals([data, ...rentals]);
        return data;
      }
    } catch {}

    const rentals = getLocalRentals();
    saveLocalRentals([newRental, ...rentals]);
    return newRental;
  },

  async getShopProfile(): Promise<ShopProfile> {
    return getLocalShopProfile();
  },

  async saveShopProfile(profile: ShopProfile): Promise<ShopProfile> {
    saveLocalShopProfile(profile);
    return profile;
  },

  async getCustomers(): Promise<Customer[]> {
    return getLocalCustomers();
  },

  async addCustomer(item: Omit<Customer, 'id'>): Promise<Customer> {
    const newItem: Customer = {
      ...item,
      id: 'c-' + Math.random().toString(36).substr(2, 9)
    };
    const local = getLocalCustomers();
    const updated = [...local, newItem];
    saveLocalCustomers(updated);
    return newItem;
  }
};
