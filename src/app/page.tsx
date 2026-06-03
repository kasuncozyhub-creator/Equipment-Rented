'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { db, Equipment, Rental, supabase, Customer, ShopProfile } from '@/lib/supabase';
import {
  Search, PlusCircle, Compass, BookOpen, Calendar, WifiOff, X, Camera,
  User, Shield, CheckCircle, Smartphone, Phone, Clock, Wrench, Truck,
  Zap, Package, TrendingUp, Activity, Lock, Mail, LogOut, Users, Store,
  MoreVertical, ShoppingCart, DollarSign, AlertTriangle, RotateCcw,
  Edit3, Trash2, Check, ChevronDown, Globe, ArrowRight,
} from 'lucide-react';

/* ─────────────────── i18n (English / Sinhala) ─────────────────── */
const i18n = {
  en: {
    nav_catalog: 'Catalog', nav_rentals: 'Rentals', nav_customers: 'Customers', nav_profile: 'Profile',
    catalog_title: 'Rent Equipment Easily', catalog_sub: 'Add new equipment',
    search_ph: 'Search cameras, drills, generators...',
    items_available: 'items in catalog', ready_rent: 'ready to rent',
    no_equip: 'No equipment found', no_equip_sub: 'Try a different search or category',
    add_equip: 'Add Equipment', add_equip_title: 'Add Catalog Equipment',
    edit_equip_title: 'Edit Equipment', publish: 'Publish to Catalog', save_changes: 'Save Changes',
    equip_name: 'Equipment Name', category: 'Category', description: 'Description',
    price_day: 'Price (Rs/day)', units: 'Units (Stock / Quantity)', photo: 'Equipment Photo',
    add_to_cart: 'Add to Cart', rent_now: 'Rent Now', rented_out: 'Rented Out',
    daily_rate: 'Daily Rate', total_est: 'Total Estimate',
    stock: 'Stock', available_units: 'available units',
    cart_title: 'Rental Cart', cart_empty: 'Your cart is empty', cart_sub: 'Add equipment from the catalog',
    cart_total: 'Total Cost', rent_all: 'Confirm All Rentals', select_cust: 'Select Customer',
    start_date: 'Start Date', end_date: 'End Date', confirm_booking: 'Confirm Rental Booking',
    register_cust_btn: '+ Register New Customer',
    rentals_title: 'Rentals Manager', rentals_sub: 'Track and manage all equipment leases.',
    no_rentals: 'No rentals logged', no_rentals_sub: 'Assign equipment to a customer from the Catalog',
    revenue: 'Revenue', payment_received: 'Payment Received', not_paid: 'Unpaid',
    mark_returned: 'Mark as Returned', extend_rental: 'Extend Rental',
    edit_rental: 'Edit Rental', delete_rental: 'Delete Rental',
    rental_details: 'Rental Details', rented_by: 'Rented by',
    overdue: 'OVERDUE', active: 'Active', upcoming: 'Upcoming', completed: 'Completed', returned: 'Returned',
    rev_total: 'Total Revenue', rev_collected: 'Cash Collected', rev_pending: 'Pending', rev_active: 'Active Rentals',
    customers_title: 'Customers Directory', customers_sub: "Register and view your shop's rental clients.",
    cust_name: 'Name', cust_contact: 'Contact Info', cust_address: 'Address', cust_docs: 'NIC Documents',
    add_cust: 'Add Customer', reg_cust: 'Register Customer',
    full_name: 'Full Name', primary_mob: 'Primary Mobile', sec_mob: 'Secondary Mobile',
    address: 'Address', nic_front: 'NIC Front Photo', nic_back: 'NIC Back Photo',
    profile_title: 'Shop Profile', profile_sub: 'Configure your business identity.',
    shop_name: 'Shop Name', shop_address: 'Business Address', shop_phone: 'Phone Number',
    shop_desc: 'Store Description', shop_logo: 'Shop Logo', upload_logo: 'Upload Logo',
    categories: 'Manage Custom Categories', cat_enabled: 'Enabled', cat_disabled: 'Disabled',
    language: 'Language', lang_en: 'English', lang_si: 'සිංහල',
    save_profile: 'Save Profile', profile_saved: 'Profile Saved!',
    edit_details: 'Edit Details', close: 'Close', call_client: 'Call Client',
    offline: 'Offline mode — Using cached data', install: 'Install', install_msg: 'Install Rented as an app',
    login: 'Welcome Back', signup: 'Create Account', verify: 'Verify Code',
    mobile: 'Mobile Number', send_otp: 'Send Verification Code', verify_btn: 'Verify & Log In',
    log_out: 'Log Out', delete_confirm: 'Are you sure you want to delete this?',
    new_ext_date: 'New Return Date', notes: 'Notes (optional)', update_rental: 'Update Rental',
  },
  si: {
    nav_catalog: 'භාණ්ඩ', nav_rentals: 'කුලී', nav_customers: 'ගනුදෙනුකරුවන්', nav_profile: 'ගබඩාව',
    catalog_title: 'ලේසියෙන් කුලියට ගන්න', catalog_sub: 'නව උපකරණ එකතු කරන්න',
    search_ph: 'කැමරා, සරඹ, ජනරේටර්... සොයන්න',
    items_available: 'භාණ්ඩ ඇත', ready_rent: 'කුලියට දීමට සූදානම්',
    no_equip: 'භාණ්ඩ හමු නොවිණ', no_equip_sub: 'වෙනත් සෙවුමක් හෝ ශ්‍රේණියක් උත්සාහ කරන්න',
    add_equip: 'භාණ්ඩ එකතු කරන්න', add_equip_title: 'නව භාණ්ඩය එකතු කරන්න',
    edit_equip_title: 'භාණ්ඩය සංස්කරණය', publish: 'ප්‍රකාශ කරන්න', save_changes: 'වෙනස්කම් සුරකින්',
    equip_name: 'භාණ්ඩයේ නම', category: 'ශ්‍රේණිය', description: 'විස්තරය',
    price_day: 'මිල (රු/දිනය)', units: 'ඒකක (තොගය)', photo: 'භාණ්ඩ ඡායාරූපය',
    add_to_cart: 'කූඩයට දමන්න', rent_now: 'දැන් කුලී', rented_out: 'කුලී ගෙන ඇත',
    daily_rate: 'දෛනික ගාස්තුව', total_est: 'මුළු ඇස්තමේන්තු',
    stock: 'තොගය', available_units: 'ලෙස ඇත',
    cart_title: 'කුලී කූඩය', cart_empty: 'කූඩය හිස්', cart_sub: 'කැටලොගයෙන් භාණ්ඩ එකතු කරන්න',
    cart_total: 'මුළු ගාස්තුව', rent_all: 'සියලු කුලී තහවුරු කරන්න', select_cust: 'ගනුදෙනුකරු තෝරන්න',
    start_date: 'ආරම්භ දිනය', end_date: 'අවසාන දිනය', confirm_booking: 'කුලී වෙන්කිරීම තහවුරු කරන්න',
    register_cust_btn: '+ නව ගනුදෙනුකරු ලියාපදිංචි කරන්න',
    rentals_title: 'කුලී කළමනාකරු', rentals_sub: 'සියලු කුලී නිරීක්ෂණය කරන්න.',
    no_rentals: 'කුලී ලොග් නොමැත', no_rentals_sub: 'කැටලොගයෙන් ගනුදෙනුකරුවෙකුට භාණ්ඩ ලබාදෙන්න',
    revenue: 'ආදායම', payment_received: 'ගෙවීම ලැබිණ', not_paid: 'ගෙවා නැත',
    mark_returned: 'ආපසු ලැබී ඇත', extend_rental: 'කාලය දීර්ඝ කරන්න',
    edit_rental: 'කුලී සංස්කරණය', delete_rental: 'කුලී ඉවත් කරන්න',
    rental_details: 'කුලී විස්තර', rented_by: 'කුලියට ගත්',
    overdue: 'ප්‍රමාද', active: 'සක්‍රිය', upcoming: 'ළඟ එන', completed: 'සම්පූර්ණ', returned: 'ආපසු',
    rev_total: 'මුළු ආදායම', rev_collected: 'ලද මුදල', rev_pending: 'නොලද', rev_active: 'සක්‍රිය කුලී',
    customers_title: 'ගනුදෙනුකරු ලැයිස්තුව', customers_sub: 'ගනුදෙනුකරුවන් ලියාපදිංචි කරන්න.',
    cust_name: 'නම', cust_contact: 'දුරකථනය', cust_address: 'ලිපිනය', cust_docs: 'ජාතික හැඳුනුම්',
    add_cust: 'ගනුදෙනුකරු එකතු', reg_cust: 'ලියාපදිංචි කරන්න',
    full_name: 'සම්පූර්ණ නම', primary_mob: 'ප්‍රධාන දුරකථනය', sec_mob: 'ද්විතීයික දුරකථනය',
    address: 'ලිපිනය', nic_front: 'ජා.හැ. ඉදිරිපස', nic_back: 'ජා.හැ. පිටුපස',
    profile_title: 'ගබඩා තතු', profile_sub: 'ව්‍යාපාර අනන්‍යතාව සකසන්න.',
    shop_name: 'ගබඩාවේ නම', shop_address: 'ව්‍යාපාර ලිපිනය', shop_phone: 'දුරකථනය',
    shop_desc: 'ගබඩාව ගැන', shop_logo: 'ගබඩා ලාංඡනය', upload_logo: 'ලාංඡනය උඩුගත කරන්න',
    categories: 'ශ්‍රේණි කළමනාකරු', cat_enabled: 'සක්‍රිය', cat_disabled: 'අක්‍රිය',
    language: 'භාෂාව', lang_en: 'English', lang_si: 'සිංහල',
    save_profile: 'තතු සුරකින්', profile_saved: 'තතු සුරකිණ!',
    edit_details: 'සංස්කරණය කරන්න', close: 'වසන්න', call_client: 'ගනුදෙනුකරු ඇමතුම',
    offline: 'ඔෆ්ලයින් - සුරකිච තතු භාවිතා කරයි', install: 'ස්ථාපනය', install_msg: 'Rented යෙදුම ස්ථාපනය කරන්න',
    login: 'නැවත ලිපිනය ඇතුළත් කරන්න', signup: 'ගිණුම සාදන්න', verify: 'කේතය තහවුරු',
    mobile: 'ජංගම දු.අ.', send_otp: 'සත්‍යාපන කේතය යවන්න', verify_btn: 'තහවුරු & ඇතුළු',
    log_out: 'පිටවෙන්න', delete_confirm: 'ඔබට මෙය ඉවත් කිරීමට අවශ්‍යද?',
    new_ext_date: 'නව ආපසු දිනය', notes: 'සටහන් (විකල්ප)', update_rental: 'කුලී යාවත්කාලීන',
  },
} as const;
type Lang = 'en' | 'si';

/* ─────────────────── Static helpers ─────────────────── */
const STATIC_CATEGORIES = [
  { label: 'All', value: 'All', icon: Compass },
  { label: 'Camera', value: 'Camera & Video', icon: Camera },
  { label: 'Drone', value: 'Drones', icon: Zap },
  { label: 'Tools', value: 'Power Tools', icon: Wrench },
  { label: 'Audio', value: 'Audio & Music', icon: Phone },
  { label: 'Transport', value: 'Transport', icon: Truck },
];

function daysBetween(start: string, end: string): number {
  return Math.max(1, Math.ceil(Math.abs(new Date(end).getTime() - new Date(start).getTime()) / 86400000));
}

/* ─────────────────── Logo ─────────────────── */
function Logo({ shopName, shopLogo }: { shopName?: string; shopLogo?: string }) {
  const name = shopName || 'Rented';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      {shopLogo && shopLogo !== '' ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={shopLogo} alt={name} style={{ width: 38, height: 38, borderRadius: 12, objectFit: 'cover', boxShadow: '0 4px 12px rgba(37,99,235,0.25)', flexShrink: 0 }} />
      ) : (
        <div style={{ width: 38, height: 38, borderRadius: 12, background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: 18, letterSpacing: -1, boxShadow: '0 4px 12px rgba(37,99,235,0.25)', flexShrink: 0 }}>
          {name.trim().charAt(0).toUpperCase() || 'R'}
        </div>
      )}
      <div>
        <div style={{ fontWeight: 900, fontSize: 18, letterSpacing: -0.5, color: '#1e40af', lineHeight: 1.1 }}>{name}</div>
        <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 500, lineHeight: 1 }}>Equipment Rental</div>
      </div>
    </div>
  );
}

/* ─────────────────── Toggle Switch ─────────────────── */
function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle} style={{ width: 38, height: 20, borderRadius: 10, background: on ? '#2563eb' : '#cbd5e1', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', padding: 0, flexShrink: 0 }}>
      <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: on ? 20 : 2, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
    </button>
  );
}

/* ─────────────────── Cart type ─────────────────── */
interface CartItem { item: Equipment; qty: number; }

/* ─────────────────── MAIN COMPONENT ─────────────────── */
export default function RentedApp() {
  /* -- Language -- */
  const [lang, setLang] = useState<Lang>('en');
  const t = useCallback((key: keyof typeof i18n.en) => i18n[lang][key], [lang]);

  /* -- Auth -- */
  const [user, setUser] = useState<{ phone: string; name: string } | null>(null);
  const [authView, setAuthView] = useState<'login' | 'signup' | 'verify_login' | 'verify_signup'>('login');
  const [authPhone, setAuthPhone] = useState('');
  const [authName, setAuthName] = useState('');
  const [authOtp, setAuthOtp] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  /* -- App state -- */
  const [tab, setTab] = useState<'catalog' | 'rentals' | 'customers' | 'profile'>('catalog');
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [shopProfile, setShopProfile] = useState<ShopProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  /* -- Cart -- */
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [cartCustomer, setCartCustomer] = useState('');
  const [cartStart, setCartStart] = useState('');
  const [cartEnd, setCartEnd] = useState('');
  const [cartDone, setCartDone] = useState(false);
  const [cartError, setCartError] = useState('');

  /* -- Booking (single item) -- */
  const [bookingItem, setBookingItem] = useState<Equipment | null>(null);
  const [bStart, setBStart] = useState('');
  const [bEnd, setBEnd] = useState('');
  const [bName, setBName] = useState('');
  const [bPhone, setBPhone] = useState('');
  const [bDone, setBDone] = useState(false);
  const [showRegisterInBooking, setShowRegisterInBooking] = useState(false);

  /* -- Rental detail popup -- */
  const [selectedRental, setSelectedRental] = useState<Rental | null>(null);
  const [rentalEdit, setRentalEdit] = useState<Partial<Rental>>({});
  const [showRentalEdit, setShowRentalEdit] = useState(false);
  const [rentalEditDone, setRentalEditDone] = useState(false);

  /* -- Customers -- */
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [cName, setCName] = useState('');
  const [cPhone, setCPhone] = useState('');
  const [cPhone2, setCPhone2] = useState('');
  const [cAddress, setCAddress] = useState('');
  const [cNicFront, setCNicFront] = useState('');
  const [cNicBack, setCNicBack] = useState('');
  const [cDone, setCDone] = useState(false);
  const [cError, setCError] = useState('');

  /* -- Shop profile -- */
  const [sName, setSName] = useState('');
  const [sAddress, setSAddress] = useState('');
  const [sPhone, setSPhone] = useState('');
  const [sDescription, setSDescription] = useState('');
  const [sImage, setSImage] = useState('');
  const [sLogo, setSLogo] = useState('');
  const [sCategories, setSCategories] = useState<string[]>([]);
  const [newCatInput, setNewCatInput] = useState('');
  const [sCategoriesEnabled, setSCategoriesEnabled] = useState(false);
  const [sDone, setSDone] = useState(false);

  /* -- Gear forms -- */
  const [gear, setGear] = useState({ name: '', category: 'Power Tools', description: '', pricePerDay: 0, image: '', location: '', owner: '', phone: '', units: 1 });
  const [gearDone, setGearDone] = useState(false);
  const [showAddGearModal, setShowAddGearModal] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<Equipment | null>(null);
  const [editGearDone, setEditGearDone] = useState(false);

  /* -- Inline register customer in booking -- */
  const [inlineCName, setInlineCName] = useState('');
  const [inlineCPhone, setInlineCPhone] = useState('');
  const [inlineCPhone2, setInlineCPhone2] = useState('');
  const [inlineCAddress, setInlineCAddress] = useState('');
  const [inlineCNicFront, setInlineCNicFront] = useState('');
  const [inlineCNicBack, setInlineCNicBack] = useState('');
  const [inlineCError, setInlineCError] = useState('');

  /* -- Unseen rentals notifications -- */
  const [lastRentalsCount, setLastRentalsCount] = useState<number | null>(null);
  const [unseenRentalsCount, setUnseenRentalsCount] = useState(0);

  /* -- Shop Profile phone edit -- */
  const [isEditingPhone, setIsEditingPhone] = useState(false);

  /* -- Unified Customer Registration Modal -- */
  const [showCustRegModal, setShowCustRegModal] = useState(false);

  /* -- Cart customer registration inline -- */
  const [showRegisterInCart, setShowRegisterInCart] = useState(false);

  /* -- Category icons -- */
  const getCategoryIcon = (name: string) => {
    const l = name.toLowerCase();
    if (l.includes('camera') || l.includes('video')) return Camera;
    if (l.includes('drone') || l.includes('zap')) return Zap;
    if (l.includes('tool') || l.includes('wrench')) return Wrench;
    if (l.includes('audio') || l.includes('music') || l.includes('sound')) return Phone;
    if (l.includes('transport') || l.includes('car') || l.includes('truck')) return Truck;
    return Package;
  };

  const categories = sCategoriesEnabled
    ? [{ label: 'All', value: 'All', icon: Compass }, ...sCategories.map(c => ({ label: c, value: c, icon: getCategoryIcon(c) }))]
    : [{ label: 'All', value: 'All', icon: Compass }];


  /* ── Load data ── */
  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      // Sync offline data to Supabase first if any exists on this device
      await db.syncLocalData(user.phone);
      
      const [equip, rents, custs, profile] = await Promise.all([
        db.getEquipment(user.phone),
        db.getRentals(user.phone),
        db.getCustomers(user.phone),
        db.getShopProfile(user.phone),
      ]);
      setEquipment(equip);
      setRentals(rents);
      setCustomers(custs);
      setShopProfile(profile);
      setSName(profile.name);
      setSAddress(profile.address);
      setSPhone(profile.phone || user.phone);
      setSDescription(profile.description);
      setSImage(profile.image || '');
      setSLogo(profile.logo || '');
      setSCategories(profile.categories || ['Camera', 'Drone', 'Tools', 'Audio', 'Transport']);
      setSCategoriesEnabled(!!profile.categoriesEnabled);
      if (profile.language) setLang(profile.language);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    const stored = localStorage.getItem('rented_user');
    if (stored) { try { setUser(JSON.parse(stored)); } catch {} }
    setOffline(!navigator.onLine);
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
    const beforeInstall = (e: Event) => { e.preventDefault(); setInstallPrompt(e); };
    window.addEventListener('beforeinstallprompt', beforeInstall);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
      window.removeEventListener('beforeinstallprompt', beforeInstall);
    };
  }, []);

  useEffect(() => {
    if (user) {
      const displayName = user.name || user.phone;
      setBName(displayName);
      setGear(prev => ({ ...prev, owner: displayName }));
    } else {
      setBName('');
      setGear(prev => ({ ...prev, owner: '' }));
    }
  }, [user]);

  /* ── Close dropdowns on outside click ── */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('.menu-trigger')) return;
      setActiveMenuId(null);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  /* ── Track unseen rentals for notification badge ── */
  useEffect(() => {
    const activeCount = rentals.filter(r => r.status !== 'completed' && !r.returnedDate).length;
    if (lastRentalsCount === null) {
      setLastRentalsCount(activeCount);
    } else {
      if (activeCount > lastRentalsCount) {
        if (tab !== 'rentals') {
          setUnseenRentalsCount(prev => prev + (activeCount - lastRentalsCount));
        }
      }
      setLastRentalsCount(activeCount);
    }
  }, [rentals, tab, lastRentalsCount]);

  useEffect(() => {
    if (tab === 'rentals') {
      setUnseenRentalsCount(0);
    }
  }, [tab]);

  /* ── Derived values ── */
  const today = new Date().toISOString().split('T')[0];

  const getEquipmentAvailability = (item: Equipment) => {
    const activeCount = rentals.filter(r => r.equipmentId === item.id && r.status !== 'completed' && !r.returnedDate).length;
    const total = item.units || 1;
    const available = Math.max(0, total - activeCount);
    return { availableCount: available, totalCount: total, isAvailable: available > 0 };
  };

  const filtered = equipment.filter(it => {
    const q = search.toLowerCase().trim();
    const matchQ = !q || it.name.toLowerCase().includes(q) || (it.description || '').toLowerCase().includes(q) || (it.category || '').toLowerCase().includes(q);
    const matchC = category === 'All' || it.category === category;
    return matchQ && matchC;
  });

  const activeRentalsCount = rentals.filter(r => r.status !== 'completed' && !r.returnedDate).length;
  const availableCount = equipment.filter(e => getEquipmentAvailability(e).isAvailable).length;

  /* ── Revenue stats ── */
  const totalRevenue = rentals.reduce((s, r) => s + (r.totalCost || 0), 0);
  const collectedCash = rentals.filter(r => r.paymentReceived).reduce((s, r) => s + (r.totalCost || 0), 0);
  const pendingPayment = rentals.filter(r => !r.paymentReceived && r.status !== 'completed').reduce((s, r) => s + (r.totalCost || 0), 0);
  const overdueCount = rentals.filter(r => !r.returnedDate && r.status !== 'completed' && (r.extendedEndDate || r.endDate) < today).length;

  /* ── Rental card color ── */
  const getRentalCardClass = (r: Rental) => {
    if (r.returnedDate) return 'rental-card rental-card-returned';
    const effEnd = r.extendedEndDate || r.endDate;
    if (effEnd < today && r.status !== 'completed') return 'rental-card rental-card-overdue';
    if (!r.paymentReceived && r.status === 'active') return 'rental-card rental-card-unpaid';
    if (r.status === 'upcoming') return 'rental-card rental-card-upcoming';
    if (r.status === 'active') return 'rental-card rental-card-active';
    return 'rental-card rental-card-returned';
  };

  /* ── Auth ── */
  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setAuthError(''); setAuthSuccess(''); setAuthLoading(true);
    const phone = authPhone.trim();
    const name = authName.trim();
    if (authView === 'signup') {
      if (!name || !phone) { setAuthError('Please fill in all fields.'); setAuthLoading(false); return; }
      if (phone.length < 6) { setAuthError('Please enter a valid mobile number.'); setAuthLoading(false); return; }
      const exists = await db.checkTenantExists(phone);
      if (exists) { setAuthError('This mobile number is already registered. Please sign in instead.'); setAuthLoading(false); return; }
      setAuthSuccess('Verification code sent! For testing, use the last 4 digits of your number.');
      setAuthView('verify_signup'); setAuthLoading(false);
    } else if (authView === 'verify_signup') {
      if (!authOtp) { setAuthError('Please enter the verification code.'); setAuthLoading(false); return; }
      if (authOtp !== phone.slice(-4)) { setAuthError('Incorrect verification code.'); setAuthLoading(false); return; }
      const newUser = await db.createTenant(phone, name);
      setAuthSuccess('Account created! Logging you in...');
      setTimeout(() => { localStorage.setItem('rented_user', JSON.stringify(newUser)); setUser(newUser); setAuthLoading(false); setAuthPhone(''); setAuthName(''); setAuthOtp(''); }, 1000);
    } else if (authView === 'login') {
      if (!phone) { setAuthError('Please enter your mobile number.'); setAuthLoading(false); return; }
      const exists = await db.checkTenantExists(phone);
      if (!exists && phone === '0777777777') { await db.createTenant('0777777777', 'Rented Admin'); }
      else if (!exists) { setAuthError('This mobile number is not registered. Please create an account first.'); setAuthLoading(false); return; }
      setAuthSuccess('Verification code sent! For testing, use the last 4 digits of your number.');
      setAuthView('verify_login'); setAuthLoading(false);
    } else if (authView === 'verify_login') {
      if (!authOtp) { setAuthError('Please enter the verification code.'); setAuthLoading(false); return; }
      if (authOtp !== phone.slice(-4)) { setAuthError('Incorrect verification code.'); setAuthLoading(false); return; }
      const matched = await db.getTenant(phone);
      if (!matched) { setAuthError('User not found.'); setAuthLoading(false); return; }
      setAuthSuccess('Verification successful! Logging you in...');
      setTimeout(() => { localStorage.setItem('rented_user', JSON.stringify(matched)); setUser(matched); setAuthLoading(false); setAuthPhone(''); setAuthName(''); setAuthOtp(''); }, 1000);
    }
  }

  function handleLogout() {
    localStorage.removeItem('rented_user');
    setUser(null); setAuthPhone(''); setAuthName(''); setAuthOtp(''); setAuthError(''); setAuthSuccess(''); setAuthView('login'); setTab('catalog');
  }

  /* ── Compressed Image helper (resolves LocalStorage QuotaExceededError) ── */
  function processImage(file: File | undefined, callback: (base64: string) => void) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 600; // Resize large images to maximum 600px width/height
        
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          // Compress to JPEG with 0.6 quality (highly compressed but excellent for documents/photos)
          const base64 = canvas.toDataURL('image/jpeg', 0.6);
          callback(base64);
        } else {
          callback(e.target?.result as string);
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  /* ── Cart actions ── */
  function addToCart(item: Equipment) {
    setCart(prev => {
      const idx = prev.findIndex(ci => ci.item.id === item.id);
      if (idx >= 0) return prev.map((ci, i) => i === idx ? { ...ci, qty: ci.qty + 1 } : ci);
      return [...prev, { item, qty: 1 }];
    });
  }

  function removeFromCart(itemId: string) {
    setCart(prev => prev.filter(ci => ci.item.id !== itemId));
  }

  const cartTotal = cart.reduce((s, ci) => {
    if (!cartStart || !cartEnd) return s;
    return s + daysBetween(cartStart, cartEnd) * ci.item.pricePerDay * ci.qty;
  }, 0);

  async function handleRentAll(e: React.FormEvent) {
    e.preventDefault();
    setCartError('');
    if (!cartCustomer) { setCartError('Please select a customer.'); return; }
    if (!cartStart || !cartEnd) { setCartError('Please set start and end dates.'); return; }
    if (cart.length === 0) { setCartError('Cart is empty.'); return; }
    try {
      for (const ci of cart) {
        for (let i = 0; i < ci.qty; i++) {
          await db.rentEquipment(ci.item.id, cartStart, cartEnd, cartCustomer, user?.phone);
        }
      }
      await loadData();
      setCartDone(true);
      setTimeout(() => {
        setCartDone(false); setShowCart(false); setCart([]);
        setCartCustomer(''); setCartStart(''); setCartEnd('');
      }, 2000);
    } catch (err: any) {
      setCartError(err.message || 'An error occurred.');
    }
  }

  /* ── Single booking ── */
  async function handleBook(e: React.FormEvent) {
    e.preventDefault();
    if (!bookingItem || !bStart || !bEnd || !bName) return;
    try {
      await db.rentEquipment(bookingItem.id, bStart, bEnd, bName, user?.phone, bPhone);
      await loadData();
      setBDone(true);
      setTimeout(() => { setBDone(false); setBookingItem(null); setBStart(''); setBEnd(''); setBName(''); setBPhone(''); }, 1500);
    } catch {}
  }

  /* ── Inline register customer (global / booking / cart) ── */
  async function handleInlineRegister(e: React.FormEvent) {
    e.preventDefault();
    setInlineCError('');
    if (!inlineCName.trim() || !inlineCPhone.trim() || !inlineCAddress.trim()) { setInlineCError('Please fill all required fields.'); return; }
    if (!inlineCNicFront) { setInlineCError('NIC Front photo is required.'); return; }
    if (customers.some(c => c.phone === inlineCPhone.trim())) { setInlineCError('This mobile number is already registered.'); return; }
    await db.addCustomer({ name: inlineCName.trim(), phone: inlineCPhone.trim(), phone2: inlineCPhone2 || undefined, address: inlineCAddress.trim(), nicFrontPhoto: inlineCNicFront, nicBackPhoto: inlineCNicBack || undefined }, user?.phone);
    await loadData();
    setBName(inlineCName.trim());
    setBPhone(inlineCPhone.trim());
    setCartCustomer(inlineCName.trim());
    setShowRegisterInBooking(false);
    setShowCustRegModal(false);
    setInlineCName(''); setInlineCPhone(''); setInlineCPhone2(''); setInlineCAddress(''); setInlineCNicFront(''); setInlineCNicBack(''); setInlineCError('');
  }

  /* ── Rental actions ── */
  async function handleTogglePayment(r: Rental) {
    const updated = await db.updateRental(r.id, { paymentReceived: !r.paymentReceived });
    if (updated) { setRentals(prev => prev.map(x => x.id === r.id ? updated : x)); setSelectedRental(updated); }
  }

  async function handleMarkReturned(r: Rental) {
    const updated = await db.updateRental(r.id, { returnedDate: today, status: 'completed' });
    if (updated) { setRentals(prev => prev.map(x => x.id === r.id ? updated : x)); setSelectedRental(updated); await loadData(); }
  }

  async function handleDeleteRental(r: Rental) {
    if (!window.confirm(t('delete_confirm'))) return;
    await db.deleteRental(r.id);
    await loadData();
    setSelectedRental(null);
  }

  async function handleUpdateRental(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedRental) return;
    const updates: Partial<Rental> = {};
    if (rentalEdit.extendedEndDate) {
      const days = daysBetween(selectedRental.startDate, rentalEdit.extendedEndDate);
      updates.extendedEndDate = rentalEdit.extendedEndDate;
      updates.totalCost = days * selectedRental.totalCost / daysBetween(selectedRental.startDate, selectedRental.endDate);
    }
    if (rentalEdit.renterName) updates.renterName = rentalEdit.renterName;
    if (rentalEdit.notes !== undefined) updates.notes = rentalEdit.notes;
    if (rentalEdit.totalCost !== undefined) updates.totalCost = Number(rentalEdit.totalCost);
    const updated = await db.updateRental(selectedRental.id, updates);
    if (updated) { setRentals(prev => prev.map(x => x.id === selectedRental.id ? updated : x)); setSelectedRental(updated); }
    setRentalEditDone(true);
    setTimeout(() => { setRentalEditDone(false); setShowRentalEdit(false); setRentalEdit({}); }, 1200);
  }

  /* ── Add customer ── */
  async function handleAddCustomer(e: React.FormEvent) {
    e.preventDefault();
    setCError('');
    if (!cName.trim() || !cPhone.trim() || !cAddress.trim()) { setCError('Please fill in all required fields.'); return; }
    if (!cNicFront) { setCError('NIC Front Photo is required.'); return; }
    if (customers.some(c => c.phone === cPhone.trim())) { setCError('A customer with this number is already registered.'); return; }
    await db.addCustomer({ name: cName.trim(), phone: cPhone.trim(), phone2: cPhone2 || undefined, address: cAddress.trim(), nicFrontPhoto: cNicFront, nicBackPhoto: cNicBack || undefined }, user?.phone);
    await loadData();
    setCDone(true);
    setTimeout(() => { setCDone(false); setCName(''); setCPhone(''); setCPhone2(''); setCAddress(''); setCNicFront(''); setCNicBack(''); }, 1500);
  }

  /* ── Shop profile ── */
  async function handleSaveShopProfile(e: React.FormEvent) {
    e.preventDefault();
    const phoneToSave = sPhone.trim();
    if (!phoneToSave) return;

    if (user && phoneToSave !== user.phone) {
      const confirmChange = window.confirm(
        `Are you sure you want to change your Shop Phone Number to ${phoneToSave}?\n\n` +
        `WARNING: This will update your login Account ID. You will be logged out and must sign in with this new number.`
      );
      if (!confirmChange) {
        setSPhone(user.phone);
        setIsEditingPhone(false);
        return;
      }
      
      // Update tenant/account in DB / LocalStorage
      await db.createTenant(phoneToSave, user.name);
      await db.saveShopProfile({ name: sName, address: sAddress, phone: phoneToSave, description: sDescription, image: sImage, logo: sLogo, categories: sCategories, categoriesEnabled: sCategoriesEnabled, language: lang }, phoneToSave);
      
      // Log out
      handleLogout();
      return;
    }

    await db.saveShopProfile({ name: sName, address: sAddress, phone: phoneToSave, description: sDescription, image: sImage, logo: sLogo, categories: sCategories, categoriesEnabled: sCategoriesEnabled, language: lang }, user?.phone);
    await loadData();
    setIsEditingPhone(false);
    setSDone(true);
    setTimeout(() => setSDone(false), 1500);
  }

  /* ── Gear CRUD ── */
  async function handleAddGear(e: React.FormEvent) {
    e.preventDefault();
    await db.addEquipment({ name: gear.name, category: sCategoriesEnabled ? gear.category : 'General', description: gear.description || 'No description.', pricePerDay: Number(gear.pricePerDay), image: gear.image || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80', location: gear.location || (shopProfile?.address || 'Main Shop'), owner: gear.owner || (shopProfile?.name || 'Rented Owner'), units: Number(gear.units || 1) }, user?.phone);
    await loadData();
    setGearDone(true);
    setTimeout(() => { setGearDone(false); setShowAddGearModal(false); setGear({ name: '', category: 'Power Tools', description: '', pricePerDay: 0, image: '', location: '', owner: '', phone: '', units: 1 }); }, 1500);
  }

  async function handleDeleteGear(id: string) {
    if (!window.confirm(t('delete_confirm'))) return;
    await db.deleteEquipment(id);
    await loadData();
    setActiveMenuId(null);
  }

  async function handleEditGear(e: React.FormEvent) {
    e.preventDefault();
    if (!editingItem) return;
    await db.updateEquipment(editingItem.id, { name: editingItem.name, category: editingItem.category, description: editingItem.description, pricePerDay: Number(editingItem.pricePerDay), image: editingItem.image, units: Number(editingItem.units || 1) });
    await loadData();
    setEditGearDone(true);
    setTimeout(() => { setEditGearDone(false); setEditingItem(null); }, 1500);
  }

  async function handleInstall() {
    if (!installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  }

  /* ─────────────────── AUTH SCREEN ─────────────────── */
  if (!user) {
    const isVerify = authView === 'verify_login' || authView === 'verify_signup';
    return (
      <div className="auth-container">
        <div className="auth-bg-circle-1" />
        <div className="auth-bg-circle-2" />
        <div className="auth-card">
          <div className="auth-header">
            <Logo />
            <h2 className="auth-title">
              {authView === 'login' && 'Welcome Back'}
              {authView === 'signup' && 'Create Account'}
              {isVerify && 'Verify Code'}
            </h2>
            <p className="auth-subtitle">
              {authView === 'login' && 'Enter your mobile number to sign in.'}
              {authView === 'signup' && 'Register your mobile number to get started.'}
              {isVerify && `We've sent a 4-digit code to ${authPhone}.`}
            </p>
          </div>

          <form onSubmit={handleAuth} className="auth-form">
            {authError && <div className="auth-error-alert"><X size={16} style={{ flexShrink: 0 }} /><span>{authError}</span></div>}
            {authSuccess && <div className="auth-success-alert"><CheckCircle size={16} style={{ flexShrink: 0 }} /><span>{authSuccess}</span></div>}

            {!isVerify ? (
              <>
                {authView === 'signup' && (
                  <div className="auth-field-group">
                    <label className="auth-label">Full Name</label>
                    <div className="auth-input-wrapper">
                      <User size={18} className="auth-input-icon" />
                      <input type="text" className="auth-input" placeholder="John Doe" value={authName} onChange={e => setAuthName(e.target.value)} required />
                    </div>
                  </div>
                )}
                <div className="auth-field-group">
                  <label className="auth-label">Mobile Number</label>
                  <div className="auth-input-wrapper">
                    <Smartphone size={18} className="auth-input-icon" />
                    <input type="tel" className="auth-input" placeholder="e.g. 0777777777" value={authPhone} onChange={e => setAuthPhone(e.target.value)} required />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 8 }} disabled={authLoading}>
                  {authLoading ? 'Please wait...' : 'Send Verification Code'}
                </button>
              </>
            ) : (
              <>
                <div className="auth-field-group">
                  <label className="auth-label">
                    <span>Verification Code</span>
                    <span style={{ fontSize: 11, color: 'var(--blue-500)', fontWeight: 700 }}>Hint: {authPhone.slice(-4)}</span>
                  </label>
                  <div className="auth-input-wrapper">
                    <Lock size={18} className="auth-input-icon" />
                    <input type="text" className="auth-input" placeholder="Enter 4-digit code" maxLength={4} value={authOtp} onChange={e => setAuthOtp(e.target.value)} required />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 8 }} disabled={authLoading}>
                  {authLoading ? 'Verifying...' : 'Verify & Log In'}
                </button>
              </>
            )}
          </form>

          <div className="auth-footer">
            {authView === 'login' && (<>Don't have an account?<span className="auth-link" onClick={() => { setAuthView('signup'); setAuthError(''); setAuthSuccess(''); }}> Create Account</span></>)}
            {authView === 'signup' && (<>Already have an account?<span className="auth-link" onClick={() => { setAuthView('login'); setAuthError(''); setAuthSuccess(''); }}> Sign In</span></>)}
            {isVerify && (<span className="auth-link" style={{ cursor: 'pointer' }} onClick={() => { setAuthView(authView === 'verify_login' ? 'login' : 'signup'); setAuthError(''); setAuthSuccess(''); setAuthOtp(''); }}>← Back</span>)}
          </div>
        </div>
      </div>
    );
  }

  /* ─────────────────── MAIN APP ─────────────────── */
  return (
    <div className="app-root">
      {/* ── Banners ── */}
      {offline && (<div className="banner-offline"><WifiOff size={16} />{t('offline')}</div>)}
      {installPrompt && !offline && (
        <div className="banner-install">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Smartphone size={18} style={{ flexShrink: 0 }} />
            <span>{t('install_msg')}</span>
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <button onClick={handleInstall} className="btn btn-primary btn-sm">{t('install')}</button>
            <button onClick={() => setInstallPrompt(null)} className="btn-ghost btn btn-sm" style={{ padding: '7px 8px' }}><X size={14} /></button>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <header className="header">
        <div className="header-inner">
          <Logo shopName={shopProfile?.name} shopLogo={shopProfile?.logo} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="header-user-name" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-600)' }}>Hi, {user.name || user.phone}</span>
            <button onClick={handleLogout} className="btn-ghost btn btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-600)', background: 'var(--bg)', borderRadius: 'var(--radius-sm)', padding: '6px 12px' }}>
              <LogOut size={14} style={{ color: 'var(--red)' }} />
              <span style={{ fontWeight: 600 }}>{t('log_out')}</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="body-layout">
        {/* Sidebar */}
        <nav className="sidebar" aria-label="Main navigation">
          <span className="sidebar-label">Navigation</span>
          {(['catalog', 'rentals', 'customers', 'profile'] as const).map(tabKey => (
            <button key={tabKey} id={`sidebar-${tabKey}`} className={`sidebar-item ${tab === tabKey ? 'active' : ''}`} onClick={() => setTab(tabKey)}>
              {tabKey === 'catalog' && <Compass size={18} />}
              {tabKey === 'rentals' && <BookOpen size={18} />}
              {tabKey === 'customers' && <Users size={18} />}
              {tabKey === 'profile' && <Store size={18} />}
              {t(`nav_${tabKey}` as any)}
              {tabKey === 'rentals' && unseenRentalsCount > 0 && <span className="sidebar-badge">{unseenRentalsCount}</span>}
            </button>
          ))}

          <div className="sidebar-divider" />
          <span className="sidebar-label">Overview</span>
          <div style={{ padding: '6px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[['Available', availableCount, '#2563eb'], ['Items', equipment.length, '#1e40af'], ['Active Rentals', activeRentalsCount, '#16a34a']].map(([label, val, color]) => (
              <div key={String(label)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: '#6b7280' }}>{String(label)}</span>
                <span style={{ fontWeight: 700, color: String(color) }}>{val}</span>
              </div>
            ))}
          </div>

          <div className="sidebar-divider" />
          <span className="sidebar-label">Account</span>
          <button className="sidebar-item" style={{ color: 'var(--red)', marginTop: 4 }} onClick={handleLogout}>
            <LogOut size={18} />{t('log_out')}
          </button>
        </nav>

        {/* Main */}
        <main className="main-content">
          <div className="page-wrap" style={{ paddingTop: 20, paddingBottom: 20 }}>

            {/* ─── CATALOG TAB ─── */}
            {tab === 'catalog' && (
              <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Search BAR — top */}
                <div className="search-wrap">
                  <Search size={18} className="search-icon" />
                  <input type="text" className="form-input" placeholder={t('search_ph')} value={search} onChange={e => setSearch(e.target.value)} id="equipment-search" />
                </div>

                {/* Compact hero strip */}
                <div className="hero-strip">
                  <div>
                    <div style={{ fontWeight: 900, fontSize: 16, letterSpacing: -0.3, lineHeight: 1.2 }}>{t('catalog_title')}</div>
                    <div style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>{t('catalog_sub')}</div>
                  </div>
                  <button className="btn" onClick={() => { setShowAddGearModal(true); setGear(g => ({ ...g, category: sCategories[0] || 'Camera' })); }} style={{ background: 'white', color: '#2563eb', padding: '10px 18px', fontSize: 14, borderRadius: 12, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    <PlusCircle size={16} />{t('add_equip')}
                  </button>
                </div>

                {/* Category chips */}
                {sCategoriesEnabled && (
                  <div className="chip-group">
                    {categories.map(c => (
                      <button key={c.value} className={`chip ${category === c.value ? 'chip-active' : 'chip-default'}`} onClick={() => setCategory(c.value)}>
                        <c.icon size={13} />{c.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Results info */}
                <div style={{ fontSize: 13, color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span><strong style={{ color: '#1e40af' }}>{filtered.length}</strong> {t('items_available')}</span>
                  {filtered.filter(e => getEquipmentAvailability(e).isAvailable).length > 0 && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span className="dot dot-green" />
                      {filtered.filter(e => getEquipmentAvailability(e).isAvailable).length} {t('ready_rent')}
                    </span>
                  )}
                </div>

                {/* Grid */}
                {loading ? (
                  <div className="loading-wrap"><div className="spinner" /><p style={{ fontSize: 14, color: '#6b7280' }}>Loading...</p></div>
                ) : filtered.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon"><Search size={28} /></div>
                    <p style={{ fontWeight: 700, fontSize: 16, color: '#374151' }}>{t('no_equip')}</p>
                    <p style={{ fontSize: 14 }}>{t('no_equip_sub')}</p>
                  </div>
                ) : (
                  <div className="equip-grid">
                    {filtered.map(item => {
                      const { availableCount: avC, totalCount, isAvailable } = getEquipmentAvailability(item);
                      const inCart = cart.findIndex(ci => ci.item.id === item.id) >= 0;
                      return (
                        <article key={item.id} className="equip-card">
                          <div className="equip-img">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={item.image || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80'} alt={item.name} />
                            <div style={{ position: 'absolute', top: 10, left: 10 }}>
                              <span className={`badge ${isAvailable ? 'badge-green' : 'badge-red'}`}>
                                <span className={`dot ${isAvailable ? 'dot-green' : 'dot-red'}`} style={{ width: 6, height: 6 }} />
                                {isAvailable ? `${avC}/${totalCount}` : 'Rented'}
                              </span>
                            </div>
                            <div style={{ position: 'absolute', top: 10, right: 10 }}>
                              {item.category && item.category !== 'General' && <span className="badge badge-blue">{item.category}</span>}
                            </div>
                          </div>

                          <div className="equip-body" style={{ position: 'relative' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                              <div style={{ flex: 1 }}>
                                <h3 style={{ fontWeight: 800, fontSize: 15, color: '#0f172a', lineHeight: 1.3, marginBottom: 4 }}>{item.name}</h3>
                                <p style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.description}</p>
                              </div>
                              <div style={{ position: 'relative', flexShrink: 0 }}>
                                <button type="button" className="menu-trigger" onClick={e => { e.stopPropagation(); setActiveMenuId(activeMenuId === item.id ? null : item.id); }} style={{ background: '#f8fafc', border: '1px solid #cbd5e1', cursor: 'pointer', color: '#475569', padding: '4px 6px', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <MoreVertical size={16} style={{ pointerEvents: 'none' }} />
                                </button>
                                {activeMenuId === item.id && (
                                  <div style={{ position: 'absolute', right: 0, top: 30, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 10, display: 'flex', flexDirection: 'column', minWidth: 110, overflow: 'hidden' }}>
                                    <button type="button" onClick={e => { e.stopPropagation(); setEditingItem(item); setActiveMenuId(null); }} style={{ width: '100%', padding: '8px 12px', fontSize: 12, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', color: '#374151', fontWeight: 700 }} className="menu-item-hover">
                                      <Edit3 size={12} style={{ marginRight: 6 }} />Edit
                                    </button>
                                    <button type="button" onClick={e => { e.stopPropagation(); handleDeleteGear(item.id); }} style={{ width: '100%', padding: '8px 12px', fontSize: 12, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', color: '#ef4444', fontWeight: 700, borderTop: '1px solid #f1f5f9' }} className="menu-item-hover">
                                      <Trash2 size={12} style={{ marginRight: 6 }} />Delete
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <div className="equip-price">Rs.{(item.pricePerDay).toLocaleString()}<span> /day</span></div>
                                <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 600 }}>{t('stock')}: {avC}/{totalCount} {t('available_units')}</div>
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
                                <button disabled={!isAvailable} onClick={() => setBookingItem(item)} className={`btn btn-sm ${isAvailable ? 'btn-primary' : 'btn-secondary'}`} style={{ fontSize: 12, width: '100%', padding: '8px 12px', justifyContent: 'center' }}>
                                  {isAvailable ? <><Calendar size={13} /> {t('rent_now')}</> : t('rented_out')}
                                </button>
                                {isAvailable && (
                                  <button onClick={() => addToCart(item)} className="btn btn-sm btn-secondary" style={{ fontSize: 12, width: '100%', padding: '8px 12px', justifyContent: 'center' }}>
                                    <ShoppingCart size={12} />{inCart ? '✓ Added' : t('add_to_cart')}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ─── RENTALS TAB ─── */}
            {tab === 'rentals' && (
              <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <div className="section-title">{t('rentals_title')}</div>
                  <div className="section-sub">{t('rentals_sub')}</div>
                </div>

                {/* Revenue Dashboard Strip */}
                <div className="revenue-strip">
                  {[
                    { label: t('rev_total'), value: `Rs.${totalRevenue.toLocaleString()}`, sub: 'All time', icon: TrendingUp, color: '#2563eb', bg: '#eff6ff' },
                    { label: t('rev_collected'), value: `Rs.${collectedCash.toLocaleString()}`, sub: 'Paid', icon: CheckCircle, color: '#16a34a', bg: '#f0fdf4' },
                    { label: t('rev_pending'), value: `Rs.${pendingPayment.toLocaleString()}`, sub: 'Unpaid', icon: Clock, color: '#d97706', bg: '#fffbeb' },
                    { label: t('rev_active'), value: `${activeRentalsCount}`, sub: overdueCount > 0 ? `${overdueCount} overdue` : 'On track', icon: Activity, color: overdueCount > 0 ? '#dc2626' : '#4f46e5', bg: overdueCount > 0 ? '#fee2e2' : '#f5f3ff' },
                  ].map(s => {
                    const Icon = s.icon;
                    return (
                      <div key={s.label} className="rev-card" style={{ borderTop: `4px solid ${s.color}` }}>
                        <div className="rev-icon-box" style={{ background: s.bg, color: s.color }}>
                          <Icon size={20} />
                        </div>
                        <div className="rev-info">
                          <div className="rev-label">{s.label}</div>
                          <div className="rev-value" style={{ color: '#0f172a' }}>{s.value}</div>
                          <div className="rev-sub">
                            {s.label === t('rev_active') && overdueCount > 0 ? (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#dc2626', fontWeight: 800 }}>
                                <AlertTriangle size={12} /> {s.sub}
                              </span>
                            ) : (
                              <span>{s.sub}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Rental list */}
                {loading ? (
                  <div className="loading-wrap"><div className="spinner" /></div>
                ) : rentals.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon"><BookOpen size={28} /></div>
                    <p style={{ fontWeight: 700, fontSize: 16, color: '#374151' }}>{t('no_rentals')}</p>
                    <p style={{ fontSize: 14 }}>{t('no_rentals_sub')}</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {rentals.map(r => {
                      const effEnd = r.extendedEndDate || r.endDate;
                      const isOverdue = !r.returnedDate && r.status !== 'completed' && effEnd < today;
                      return (
                        <div key={r.id} className={getRentalCardClass(r)} style={{ cursor: 'pointer' }} onClick={() => { setSelectedRental(r); setRentalEdit({}); setShowRentalEdit(false); }}>
                          <div className="rental-thumb">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={r.equipmentImage || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80'} alt={r.equipmentName} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                          </div>
                          <div className="rental-details">
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                              <h4 style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', lineHeight: 1.3 }}>{r.equipmentName}</h4>
                              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                {isOverdue && <span className="overdue-badge"><AlertTriangle size={9} />{t('overdue')}</span>}
                                {r.returnedDate && <span className="badge badge-amber">{t('returned')}</span>}
                                {!r.returnedDate && r.paymentReceived && <span className="badge badge-green">{t('payment_received')}</span>}
                                {!r.returnedDate && !r.paymentReceived && <span className="badge badge-amber">{t('not_paid')}</span>}
                              </div>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#6b7280' }}>
                                <Calendar size={12} style={{ color: '#2563eb' }} />
                                <span>{r.startDate} → {effEnd}</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#6b7280' }}>
                                <User size={12} style={{ color: '#2563eb' }} />
                                <strong>{r.renterName}</strong>
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 6, borderTop: '1px solid #f0f6ff' }}>
                              <div>
                                <p style={{ fontSize: 11, color: '#9ca3af' }}>{t('revenue')}</p>
                                <p style={{ fontWeight: 800, fontSize: 15, color: '#2563eb' }}>Rs.{(r.totalCost).toLocaleString()}</p>
                              </div>
                              <p style={{ fontSize: 11, color: '#9ca3af' }}>Tap for details →</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ─── CUSTOMERS TAB ─── */}
            {tab === 'customers' && (
              <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <div className="section-title">{t('customers_title')}</div>
                  <div className="section-sub">{t('customers_sub')}</div>
                </div>

                <div className="form-layout">
                  <div className="form-main">
                    <div className="card-flat" style={{ overflow: 'hidden', padding: 0 }}>

                      {/* ── Desktop Table ── */}
                      <div className="cust-table-wrap" style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                          <thead>
                            <tr style={{ background: 'var(--surface-alt)', borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                              <th style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-700)' }}>{t('cust_name')}</th>
                              <th style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-700)' }}>{t('cust_contact')}</th>
                              <th style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-700)' }}>{t('cust_address')}</th>
                              <th style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-700)' }}>{t('cust_docs')}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {customers.length === 0 ? (
                              <tr><td colSpan={4} style={{ padding: '40px 16px', textAlign: 'center', color: '#9ca3af' }}>No registered customers yet.</td></tr>
                            ) : customers.map(c => (
                              <tr key={c.id} onClick={() => setSelectedCustomer(c)} style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }} className="table-row-hover">
                                <td style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--text-900)' }}>{c.name}</td>
                                <td style={{ padding: '14px 16px' }}>
                                  <div style={{ color: 'var(--blue-600)', fontWeight: 600 }}>{c.phone}</div>
                                  {c.phone2 && <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>Alt: {c.phone2}</div>}
                                </td>
                                <td style={{ padding: '14px 16px', color: 'var(--text-600)' }}>{c.address}</td>
                                <td style={{ padding: '14px 16px' }}>
                                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                    {c.nicFrontPhoto && <span style={{ fontSize: 11, background: '#2563eb', color: '#fff', padding: '4px 8px', borderRadius: 4, fontWeight: 600 }}>Front</span>}
                                    {c.nicBackPhoto ? <span style={{ fontSize: 11, background: '#f1f5f9', color: '#475569', padding: '4px 8px', borderRadius: 4, fontWeight: 600, border: '1px solid #cbd5e1' }}>Back</span> : <span style={{ fontSize: 11, color: '#9ca3af', fontStyle: 'italic' }}>No Back</span>}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* ── Mobile / PWA Card List ── */}
                      <div className="cust-cards-wrap" style={{ padding: '12px' }}>
                        {customers.length === 0 ? (
                          <div style={{ padding: '36px 16px', textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>No registered customers yet.</div>
                        ) : customers.map(c => (
                          <div key={c.id} className="cust-card" onClick={() => setSelectedCustomer(c)}>
                            <div className="cust-avatar">
                              {c.name.trim().charAt(0).toUpperCase()}
                            </div>
                            <div className="cust-info">
                              <div className="cust-name">{c.name}</div>
                              <div className="cust-phone">{c.phone}{c.phone2 ? ` · ${c.phone2}` : ''}</div>
                              {c.address && <div className="cust-addr">{c.address}</div>}
                            </div>
                            <div className="cust-docs">
                              {c.nicFrontPhoto && <span style={{ fontSize: 10, background: '#2563eb', color: '#fff', padding: '3px 7px', borderRadius: 4, fontWeight: 700 }}>Front</span>}
                              {c.nicBackPhoto
                                ? <span style={{ fontSize: 10, background: '#f1f5f9', color: '#475569', padding: '3px 7px', borderRadius: 4, fontWeight: 700, border: '1px solid #cbd5e1' }}>Back</span>
                                : <span style={{ fontSize: 10, color: '#9ca3af', fontStyle: 'italic' }}>No Back</span>}
                            </div>
                          </div>
                        ))}
                      </div>

                    </div>
                  </div>


                  {/* Add Customer Form */}
                  <div className="form-side">
                    <div className="card-flat" style={{ padding: 20 }}>
                      <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>{t('add_cust')}</h3>
                      <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 16 }}>Register a new customer profile.</p>
                      {cDone ? (
                        <div className="success-panel" style={{ padding: '20px 10px' }}>
                          <div className="success-icon"><CheckCircle size={28} /></div>
                          <p style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>Customer Registered! 🎉</p>
                        </div>
                      ) : (
                        <form onSubmit={handleAddCustomer} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                          {cError && <p style={{ color: 'var(--red)', fontSize: 12, fontWeight: 600 }}>{cError}</p>}
                          <div><label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>{t('full_name')} *</label><input type="text" className="form-input" placeholder="Sarah Jenkins" value={cName} onChange={e => setCName(e.target.value)} required /></div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                            <div><label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>{t('primary_mob')} *</label><input type="tel" className="form-input" placeholder="0771234567" value={cPhone} onChange={e => setCPhone(e.target.value)} required /></div>
                            <div><label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>{t('sec_mob')}</label><input type="tel" className="form-input" placeholder="Optional" value={cPhone2} onChange={e => setCPhone2(e.target.value)} /></div>
                          </div>
                          <div><label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>{t('address')} *</label><textarea className="form-input" rows={2} placeholder="12 Main Street..." value={cAddress} onChange={e => setCAddress(e.target.value)} style={{ resize: 'none' }} required /></div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            {/* NIC Front */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                              <label style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>{t('nic_front')} *</label>
                              {cNicFront ? (
                                <div style={{ position: 'relative', width: '100%', height: 100, borderRadius: 10, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={cNicFront} alt="NIC Front" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  <button type="button" onClick={() => setCNicFront('')} style={{ position: 'absolute', top: 6, right: 6, background: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%', width: 18, height: 18, fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={10} /></button>
                                </div>
                              ) : (
                                <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, height: 100, border: '2px dashed #cbd5e1', borderRadius: 10, cursor: 'pointer', background: '#f8fafc', textAlign: 'center', padding: '10px 4px' }} className="upload-box-hover">
                                  <Camera size={18} style={{ color: '#64748b' }} />
                                  <span style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>Upload Front</span>
                                  <input type="file" accept="image/*" onChange={e => processImage(e.target.files?.[0], setCNicFront)} style={{ display: 'none' }} required={!cNicFront} />
                                </label>
                              )}
                            </div>
                            {/* NIC Back */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                              <label style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>{t('nic_back')}</label>
                              {cNicBack ? (
                                <div style={{ position: 'relative', width: '100%', height: 100, borderRadius: 10, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={cNicBack} alt="NIC Back" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  <button type="button" onClick={() => setCNicBack('')} style={{ position: 'absolute', top: 6, right: 6, background: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%', width: 18, height: 18, fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={10} /></button>
                                </div>
                              ) : (
                                <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, height: 100, border: '2px dashed #cbd5e1', borderRadius: 10, cursor: 'pointer', background: '#f8fafc', textAlign: 'center', padding: '10px 4px' }} className="upload-box-hover">
                                  <Camera size={18} style={{ color: '#64748b' }} />
                                  <span style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>Upload Back</span>
                                  <input type="file" accept="image/*" onChange={e => processImage(e.target.files?.[0], setCNicBack)} style={{ display: 'none' }} />
                                </label>
                              )}
                            </div>
                          </div>
                          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 4 }}>{t('reg_cust')}</button>
                        </form>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ─── SHOP PROFILE TAB ─── */}
            {tab === 'profile' && (
              <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <div className="section-title">{t('profile_title')}</div>
                  <div className="section-sub">{t('profile_sub')}</div>
                </div>

                <div className="form-layout">
                  {/* Left: View */}
                  <div className="form-main">
                    <div className="card-flat" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        {sLogo && sLogo !== '' ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={sLogo} alt={sName} style={{ width: 64, height: 64, borderRadius: 16, objectFit: 'cover', border: '2px solid var(--blue-100)', boxShadow: 'var(--shadow-md)' }} />
                        ) : (
                          <div style={{ width: 64, height: 64, borderRadius: 16, background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 900, boxShadow: 'var(--shadow-md)' }}>
                            {sName ? sName.charAt(0) : 'R'}
                          </div>
                        )}
                        <div>
                          <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>{sName || 'Rented Store'}</h3>
                          <p style={{ fontSize: 13, color: '#6b7280' }}>Mobile Rental Hub Account</p>
                        </div>
                      </div>
                      <div className="divider" />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {[['Business Address', sAddress], ['Phone', sPhone]].map(([label, val]) => (
                          <div key={label}>
                            <p style={{ fontSize: 11, textTransform: 'uppercase', color: '#9ca3af', fontWeight: 700, letterSpacing: 0.5, marginBottom: 4 }}>{label}</p>
                            <p style={{ fontSize: 14, color: '#374151', fontWeight: 600 }}>{val || 'Not set'}</p>
                          </div>
                        ))}
                        <div>
                          <p style={{ fontSize: 11, textTransform: 'uppercase', color: '#9ca3af', fontWeight: 700, letterSpacing: 0.5, marginBottom: 4 }}>About</p>
                          <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.6 }}>{sDescription || 'No description provided.'}</p>
                        </div>
                        <div>
                          <p style={{ fontSize: 11, textTransform: 'uppercase', color: '#9ca3af', fontWeight: 700, letterSpacing: 0.5, marginBottom: 4 }}>{t('language')}</p>
                          <p style={{ fontSize: 14, color: '#374151', fontWeight: 600 }}>{lang === 'en' ? t('lang_en') : t('lang_si')}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Edit form */}
                  <div className="form-side">
                    <div className="card-flat" style={{ padding: 20 }}>
                      <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>{t('edit_details')}</h3>
                      <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 16 }}>Update public information.</p>

                      {sDone ? (
                        <div className="success-panel" style={{ padding: '20px 10px' }}>
                          <div className="success-icon"><CheckCircle size={28} /></div>
                          <p style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>{t('profile_saved')} 🎉</p>
                        </div>
                      ) : (
                        <form onSubmit={handleSaveShopProfile} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                          <div><label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>{t('shop_name')}</label><input type="text" className="form-input" value={sName} onChange={e => setSName(e.target.value)} required /></div>
                          <div><label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>{t('shop_address')}</label><input type="text" className="form-input" value={sAddress} onChange={e => setSAddress(e.target.value)} required /></div>
                          <div>
                            <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>{t('shop_phone')}</label>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <input
                                type="tel"
                                className="form-input"
                                value={sPhone}
                                onChange={e => setSPhone(e.target.value)}
                                disabled={!isEditingPhone}
                                style={!isEditingPhone ? { background: '#f1f5f9', color: '#64748b', cursor: 'not-allowed', borderColor: '#cbd5e1' } : {}}
                                required
                              />
                              <button
                                type="button"
                                onClick={() => setIsEditingPhone(!isEditingPhone)}
                                className="btn btn-secondary btn-sm"
                                style={{ whiteSpace: 'nowrap', padding: '10px 14px', fontSize: 12 }}
                              >
                                {isEditingPhone ? 'Cancel' : 'Change Phone'}
                              </button>
                            </div>
                          </div>
                          <div><label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>{t('shop_desc')}</label><textarea className="form-input" rows={4} value={sDescription} onChange={e => setSDescription(e.target.value)} style={{ resize: 'none' }} /></div>

                          {/* Language selector */}
                          <div>
                            <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>{t('language')}</label>
                            <div style={{ display: 'flex', gap: 8 }}>
                              {(['en', 'si'] as const).map(l => (
                                <button key={l} type="button" onClick={() => setLang(l)} style={{ flex: 1, padding: '9px 12px', borderRadius: 10, border: `1.5px solid ${lang === l ? '#2563eb' : '#e2e8f0'}`, background: lang === l ? '#eff6ff' : '#f8fafc', color: lang === l ? '#2563eb' : '#6b7280', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: 'inherit' }}>
                                  <Globe size={13} />{l === 'en' ? 'English' : 'සිංහල'}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Categories toggle */}
                          <div style={{ border: '1px solid #cbd5e1', borderRadius: 12, padding: 14, background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <label style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>{t('categories')}</label>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ fontSize: 11, fontWeight: 600, color: sCategoriesEnabled ? '#16a34a' : '#64748b' }}>{sCategoriesEnabled ? t('cat_enabled') : t('cat_disabled')}</span>
                                <Toggle on={sCategoriesEnabled} onToggle={() => setSCategoriesEnabled(p => !p)} />
                              </div>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, opacity: sCategoriesEnabled ? 1 : 0.5, pointerEvents: sCategoriesEnabled ? 'auto' : 'none' }}>
                              {sCategories.map(cat => (
                                <span key={cat} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1e40af', padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700 }}>
                                  {cat}
                                  <button type="button" onClick={() => setSCategories(prev => prev.filter(c => c !== cat))} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}><X size={12} style={{ color: '#ef4444' }} /></button>
                                </span>
                              ))}
                              {sCategories.length === 0 && <p style={{ fontSize: 12, color: '#94a3b8' }}>No categories yet.</p>}
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <input type="text" className="form-input" placeholder={sCategoriesEnabled ? "New category..." : "Enable to add"} value={newCatInput} onChange={e => setNewCatInput(e.target.value)} disabled={!sCategoriesEnabled} style={{ fontSize: 12, padding: '6px 12px' }} />
                              <button type="button" onClick={() => { const t2 = newCatInput.trim(); if (t2 && !sCategories.includes(t2)) { setSCategories(prev => [...prev, t2]); setNewCatInput(''); } }} disabled={!sCategoriesEnabled} className="btn btn-primary btn-sm" style={{ whiteSpace: 'nowrap' }}>Add</button>
                            </div>
                          </div>

                          {/* Logo */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <label style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>{t('shop_logo')}</label>
                            {sLogo && sLogo !== '' ? (
                              <div style={{ position: 'relative', width: 90, height: 90, borderRadius: 16, overflow: 'hidden', border: '1px solid #cbd5e1' }}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={sLogo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                <button type="button" onClick={() => setSLogo('')} style={{ position: 'absolute', top: 6, right: 6, background: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%', width: 20, height: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={12} /></button>
                              </div>
                            ) : (
                              <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, width: 140, padding: '16px 12px', border: '2px dashed #cbd5e1', borderRadius: 16, cursor: 'pointer', background: '#f8fafc', textAlign: 'center' }} className="upload-box-hover">
                                <PlusCircle size={20} style={{ color: '#64748b' }} />
                                <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>{t('upload_logo')}</span>
                                <input type="file" accept="image/*" onChange={e => processImage(e.target.files?.[0], setSLogo)} style={{ display: 'none' }} />
                              </label>
                            )}
                          </div>

                          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 8 }}>{t('save_profile')}</button>
                        </form>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>

      {/* ── Mobile Bottom Nav ── */}
      <nav className="bottom-nav" aria-label="Mobile navigation">
        {(['catalog', 'rentals', 'customers', 'profile'] as const).map(tabKey => (
          <button key={tabKey} id={`nav-${tabKey}`} className={`bottom-nav-item ${tab === tabKey ? 'active' : ''}`} onClick={() => setTab(tabKey)}>
            {tabKey === 'catalog' && <Compass size={22} />}
            {tabKey === 'rentals' && <BookOpen size={22} />}
            {tabKey === 'customers' && <Users size={22} />}
            {tabKey === 'profile' && <Store size={22} />}
            <span>{t(`nav_${tabKey}` as any)}</span>
            {tabKey === 'rentals' && unseenRentalsCount > 0 && (
              <span style={{
                position: 'absolute',
                top: 5,
                right: 'calc(50% - 22px)',
                background: 'var(--red)',
                color: '#fff',
                fontSize: 9,
                fontWeight: 900,
                borderRadius: '50%',
                width: 16,
                height: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1.5px solid #fff',
                lineHeight: 1,
                boxShadow: '0 2px 4px rgba(220, 38, 38, 0.3)'
              }}>
                {unseenRentalsCount}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* ── Cart FAB (Catalog only) ── */}
      {tab === 'catalog' && cart.length > 0 && (
        <button className="cart-fab" onClick={() => setShowCart(true)}>
          <ShoppingCart size={22} />
          <span className="cart-fab-badge">{cart.reduce((s, ci) => s + ci.qty, 0)}</span>
        </button>
      )}

      {/* ── Cart Panel ── */}
      {showCart && (
        <>
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)', zIndex: 190 }} onClick={() => setShowCart(false)} />
          <div className="cart-panel">
            <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontWeight: 900, fontSize: 18, color: '#0f172a' }}>{t('cart_title')}</h3>
                <p style={{ fontSize: 12, color: '#6b7280' }}>{cart.reduce((s, ci) => s + ci.qty, 0)} items</p>
              </div>
              <button onClick={() => setShowCart(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}><X size={16} /></button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {cartDone ? (
                <div className="success-panel">
                  <div className="success-icon"><CheckCircle size={32} /></div>
                  <p style={{ fontWeight: 800, fontSize: 18, color: '#0f172a' }}>All Rentals Confirmed! 🎉</p>
                </div>
              ) : showRegisterInCart ? (
                /* ── Inline Customer Registration inside Cart Panel ── */
                <div className="fade-up">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                    <button type="button" onClick={() => setShowRegisterInCart(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: 0 }}>← Back to Cart</button>
                    <h4 style={{ fontWeight: 800, color: '#0f172a', fontSize: 15 }}>Register Customer</h4>
                  </div>
                  <form onSubmit={handleInlineRegister} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {inlineCError && <p style={{ color: 'var(--red)', fontSize: 12, fontWeight: 600 }}>{inlineCError}</p>}
                    <input type="text" className="form-input" placeholder={t('full_name') + ' *'} value={inlineCName} onChange={e => setInlineCName(e.target.value)} required />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <input type="tel" className="form-input" placeholder={t('primary_mob') + ' *'} value={inlineCPhone} onChange={e => setInlineCPhone(e.target.value)} required />
                      <input type="tel" className="form-input" placeholder={t('sec_mob')} value={inlineCPhone2} onChange={e => setInlineCPhone2(e.target.value)} />
                    </div>
                    <textarea className="form-input" placeholder={t('address') + ' *'} rows={2} value={inlineCAddress} onChange={e => setInlineCAddress(e.target.value)} style={{ resize: 'none' }} required />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>NIC Front *</label>
                        {inlineCNicFront ? (
                          <div style={{ position: 'relative', height: 80, borderRadius: 8, overflow: 'hidden' }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={inlineCNicFront} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <button type="button" onClick={() => setInlineCNicFront('')} style={{ position: 'absolute', top: 4, right: 4, background: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%', width: 16, height: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={9} /></button>
                          </div>
                        ) : (
                          <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, height: 80, border: '2px dashed #cbd5e1', borderRadius: 8, cursor: 'pointer', background: '#f8fafc', textAlign: 'center' }} className="upload-box-hover">
                            <Camera size={16} style={{ color: '#64748b' }} />
                            <span style={{ fontSize: 10, fontWeight: 700, color: '#475569' }}>Front</span>
                            <input type="file" accept="image/*" onChange={e => processImage(e.target.files?.[0], setInlineCNicFront)} style={{ display: 'none' }} required={!inlineCNicFront} />
                          </label>
                        )}
                      </div>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>NIC Back</label>
                        {inlineCNicBack ? (
                          <div style={{ position: 'relative', height: 80, borderRadius: 8, overflow: 'hidden' }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={inlineCNicBack} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <button type="button" onClick={() => setInlineCNicBack('')} style={{ position: 'absolute', top: 4, right: 4, background: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%', width: 16, height: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={9} /></button>
                          </div>
                        ) : (
                          <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, height: 80, border: '2px dashed #cbd5e1', borderRadius: 8, cursor: 'pointer', background: '#f8fafc', textAlign: 'center' }} className="upload-box-hover">
                            <Camera size={16} style={{ color: '#64748b' }} />
                            <span style={{ fontSize: 10, fontWeight: 700, color: '#475569' }}>Back</span>
                            <input type="file" accept="image/*" onChange={e => processImage(e.target.files?.[0], setInlineCNicBack)} style={{ display: 'none' }} />
                          </label>
                        )}
                      </div>
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 8 }}>Register & Select Customer</button>
                  </form>
                </div>
              ) : (
                <>
                  {cart.map(ci => (
                    <div key={ci.item.id} style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#f8fafc', borderRadius: 12, padding: '10px 12px', border: '1px solid #e2e8f0' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={ci.item.image} alt={ci.item.name} style={{ width: 50, height: 50, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 700, fontSize: 13, color: '#0f172a', marginBottom: 2 }}>{ci.item.name}</p>
                        <p style={{ fontSize: 12, color: '#6b7280' }}>Rs.{ci.item.pricePerDay.toLocaleString()}/day × {ci.qty}</p>
                      </div>
                      <button onClick={() => removeFromCart(ci.item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 4 }}><X size={16} /></button>
                    </div>
                  ))}

                  <form onSubmit={handleRentAll} style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
                    {cartError && <p style={{ color: 'var(--red)', fontSize: 12, fontWeight: 600 }}>{cartError}</p>}

                    <div>
                      <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>{t('select_cust')} *</label>
                      <select className="form-input" value={cartCustomer} onChange={e => setCartCustomer(e.target.value)} required>
                        <option value="">-- {t('select_cust')} --</option>
                        {customers.map(c => <option key={c.id} value={c.name}>{c.name} ({c.phone})</option>)}
                      </select>
                      <button type="button" onClick={() => setShowRegisterInCart(true)} style={{ marginTop: 8, background: 'none', border: 'none', cursor: 'pointer', color: '#2563eb', fontSize: 12, fontWeight: 700, padding: 0, display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'inherit' }}>
                        <PlusCircle size={13} />{t('register_cust_btn')}
                      </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
                      <div>
                        <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>{t('start_date')} *</label>
                        <input className="form-input" type="date" value={cartStart} onChange={e => setCartStart(e.target.value)} min={today} required />
                      </div>
                      <div>
                        <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>{t('end_date')} *</label>
                        <input className="form-input" type="date" value={cartEnd} onChange={e => setCartEnd(e.target.value)} min={cartStart || today} required />
                      </div>
                    </div>

                    {cartStart && cartEnd && (
                      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 13, color: '#374151' }}>{daysBetween(cartStart, cartEnd)} day(s)</span>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ fontSize: 11, color: '#6b7280' }}>{t('cart_total')}</p>
                          <p style={{ fontSize: 18, fontWeight: 900, color: '#16a34a' }}>Rs.{cartTotal.toLocaleString()}</p>
                        </div>
                      </div>
                    )}

                    <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }}>
                      <CheckCircle size={16} />{t('rent_all')}
                    </button>
                    <button type="button" onClick={() => setCart([])} className="btn btn-ghost" style={{ width: '100%', fontSize: 12 }}>
                      Clear Cart
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── Booking Modal (single item) ── */}
      {bookingItem && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) { setBookingItem(null); setShowRegisterInBooking(false); } }}>
          <div className="modal-box fade-up" style={{ maxWidth: 500 }}>
            <div style={{ position: 'relative', aspectRatio: '16/8', overflow: 'hidden', background: '#e8f0fe', borderRadius: '20px 20px 0 0' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={bookingItem.image} alt={bookingItem.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.55), transparent)' }} />
              <button onClick={() => { setBookingItem(null); setShowRegisterInBooking(false); }} style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(255,255,255,0.9)', border: 'none', cursor: 'pointer', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#374151' }}><X size={16} /></button>
              <div style={{ position: 'absolute', bottom: 12, left: 14 }}>
                <h3 style={{ color: 'white', fontWeight: 800, fontSize: 18, lineHeight: 1.2 }}>{bookingItem.name}</h3>
              </div>
            </div>

            <div style={{ padding: 20 }}>
              {bDone ? (
                <div className="success-panel" style={{ padding: '32px 20px' }}>
                  <div className="success-icon"><CheckCircle size={32} /></div>
                  <p style={{ fontWeight: 800, fontSize: 18, color: '#0f172a' }}>Booking Confirmed! 🎉</p>
                </div>
              ) : showRegisterInBooking ? (
                /* ── Inline customer registration ── */
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                    <button type="button" onClick={() => setShowRegisterInBooking(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: 0 }}>← Back</button>
                    <h4 style={{ fontWeight: 800, color: '#0f172a', fontSize: 15 }}>Register Customer</h4>
                  </div>
                  <form onSubmit={handleInlineRegister} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {inlineCError && <p style={{ color: 'var(--red)', fontSize: 12, fontWeight: 600 }}>{inlineCError}</p>}
                    <input type="text" className="form-input" placeholder={t('full_name') + ' *'} value={inlineCName} onChange={e => setInlineCName(e.target.value)} required />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <input type="tel" className="form-input" placeholder={t('primary_mob') + ' *'} value={inlineCPhone} onChange={e => setInlineCPhone(e.target.value)} required />
                      <input type="tel" className="form-input" placeholder={t('sec_mob')} value={inlineCPhone2} onChange={e => setInlineCPhone2(e.target.value)} />
                    </div>
                    <textarea className="form-input" placeholder={t('address') + ' *'} rows={2} value={inlineCAddress} onChange={e => setInlineCAddress(e.target.value)} style={{ resize: 'none' }} required />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>NIC Front *</label>
                        {inlineCNicFront ? (
                          <div style={{ position: 'relative', height: 80, borderRadius: 8, overflow: 'hidden' }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={inlineCNicFront} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <button type="button" onClick={() => setInlineCNicFront('')} style={{ position: 'absolute', top: 4, right: 4, background: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%', width: 16, height: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={9} /></button>
                          </div>
                        ) : (
                          <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, height: 80, border: '2px dashed #cbd5e1', borderRadius: 8, cursor: 'pointer', background: '#f8fafc', textAlign: 'center' }} className="upload-box-hover">
                            <Camera size={16} style={{ color: '#64748b' }} />
                            <span style={{ fontSize: 10, fontWeight: 700, color: '#475569' }}>Front</span>
                            <input type="file" accept="image/*" onChange={e => processImage(e.target.files?.[0], setInlineCNicFront)} style={{ display: 'none' }} required={!inlineCNicFront} />
                          </label>
                        )}
                      </div>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>NIC Back</label>
                        {inlineCNicBack ? (
                          <div style={{ position: 'relative', height: 80, borderRadius: 8, overflow: 'hidden' }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={inlineCNicBack} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <button type="button" onClick={() => setInlineCNicBack('')} style={{ position: 'absolute', top: 4, right: 4, background: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%', width: 16, height: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={9} /></button>
                          </div>
                        ) : (
                          <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, height: 80, border: '2px dashed #cbd5e1', borderRadius: 8, cursor: 'pointer', background: '#f8fafc', textAlign: 'center' }} className="upload-box-hover">
                            <Camera size={16} style={{ color: '#64748b' }} />
                            <span style={{ fontSize: 10, fontWeight: 700, color: '#475569' }}>Back</span>
                            <input type="file" accept="image/*" onChange={e => processImage(e.target.files?.[0], setInlineCNicBack)} style={{ display: 'none' }} />
                          </label>
                        )}
                      </div>
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Register & Select Customer</button>
                  </form>
                </div>
              ) : (
                <form onSubmit={handleBook} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ background: '#eff6ff', border: '1px solid #dbeafe', borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 13, color: '#6b7280' }}>{t('daily_rate')}</span>
                    <span style={{ fontWeight: 800, fontSize: 18, color: '#1e40af' }}>Rs.{(bookingItem.pricePerDay).toLocaleString()}<span style={{ fontSize: 12, fontWeight: 500, color: '#6b7280' }}>/day</span></span>
                  </div>

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 5 }}>{t('select_cust')} *</label>
                    <select className="form-input" value={bName} onChange={e => { setBName(e.target.value); const c = customers.find(c => c.name === e.target.value); setBPhone(c?.phone || ''); }} required>
                      <option value="">-- {t('select_cust')} --</option>
                      {customers.map(c => <option key={c.id} value={c.name}>{c.name} ({c.phone})</option>)}
                    </select>
                    <button type="button" onClick={() => setShowCustRegModal(true)} style={{ marginTop: 8, background: 'none', border: 'none', cursor: 'pointer', color: '#2563eb', fontSize: 12, fontWeight: 700, padding: 0, display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'inherit' }}>
                      <PlusCircle size={13} />{t('register_cust_btn')}
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
                    <div><label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 5 }}>{t('start_date')} *</label><input className="form-input" type="date" required min={today} value={bStart} onChange={e => setBStart(e.target.value)} /></div>
                    <div><label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 5 }}>{t('end_date')} *</label><input className="form-input" type="date" required min={bStart || today} value={bEnd} onChange={e => setBEnd(e.target.value)} /></div>
                  </div>

                  {bStart && bEnd && (
                    <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#374151' }}>
                        <Clock size={14} style={{ color: '#16a34a' }} />
                        <span>{daysBetween(bStart, bEnd)} day{daysBetween(bStart, bEnd) > 1 ? 's' : ''}</span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: 11, color: '#6b7280' }}>{t('total_est')}</p>
                        <p style={{ fontSize: 18, fontWeight: 900, color: '#16a34a' }}>Rs.{(daysBetween(bStart, bEnd) * bookingItem.pricePerDay).toLocaleString()}</p>
                      </div>
                    </div>
                  )}

                  <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }}>
                    <CheckCircle size={18} />{t('confirm_booking')}
                  </button>
                  <p style={{ fontSize: 11, color: '#9ca3af', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    <Shield size={12} /> All bookings are safely stored
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Rental Detail Popup ── */}
      {selectedRental && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) { setSelectedRental(null); setShowRentalEdit(false); setRentalEdit({}); } }}>
          <div className="modal-box fade-up" style={{ maxWidth: 520 }}>
            {/* Image header */}
            <div style={{ position: 'relative', aspectRatio: '16/7', overflow: 'hidden', borderRadius: '20px 20px 0 0', background: '#e8f0fe' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={selectedRental.equipmentImage || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80'} alt={selectedRental.equipmentName} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)' }} />
              <button onClick={() => { setSelectedRental(null); setShowRentalEdit(false); setRentalEdit({}); }} style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(255,255,255,0.9)', border: 'none', cursor: 'pointer', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#374151' }}><X size={16} /></button>
              <div style={{ position: 'absolute', bottom: 12, left: 14 }}>
                <h3 style={{ color: 'white', fontWeight: 800, fontSize: 18, lineHeight: 1.2 }}>{selectedRental.equipmentName}</h3>
                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 2 }}>{t('rented_by')}: <strong>{selectedRental.renterName}</strong></p>
              </div>
            </div>

            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Status badges */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {(() => {
                  const effEnd = selectedRental.extendedEndDate || selectedRental.endDate;
                  const isOverdue = !selectedRental.returnedDate && selectedRental.status !== 'completed' && effEnd < today;
                  return (
                    <>
                      {isOverdue && <span className="overdue-badge"><AlertTriangle size={9} />{t('overdue')}</span>}
                      {selectedRental.returnedDate && <span className="badge badge-amber">{t('returned')}: {selectedRental.returnedDate}</span>}
                      <span className={`badge ${selectedRental.status === 'active' ? 'badge-green' : selectedRental.status === 'upcoming' ? 'badge-blue' : 'badge-amber'}`}>{selectedRental.status}</span>
                    </>
                  );
                })()}
              </div>

              {/* Details grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, background: '#f8fafc', padding: 14, borderRadius: 12, border: '1px solid #e2e8f0' }}>
                {[
                  [t('start_date'), selectedRental.startDate],
                  [t('end_date'), selectedRental.extendedEndDate ? `${selectedRental.endDate} → ${selectedRental.extendedEndDate}` : selectedRental.endDate],
                  [t('revenue'), `Rs.${(selectedRental.totalCost).toLocaleString()}`],
                  ['Phone', selectedRental.renterPhone || '—'],
                ].map(([label, val]) => (
                  <div key={label}>
                    <p style={{ fontSize: 10, textTransform: 'uppercase', color: '#94a3b8', fontWeight: 700, letterSpacing: 0.5, marginBottom: 2 }}>{label}</p>
                    <p style={{ fontSize: 13, color: '#334155', fontWeight: 700 }}>{val}</p>
                  </div>
                ))}
                {selectedRental.notes && (
                  <div style={{ gridColumn: 'span 2' }}>
                    <p style={{ fontSize: 10, textTransform: 'uppercase', color: '#94a3b8', fontWeight: 700, marginBottom: 2 }}>Notes</p>
                    <p style={{ fontSize: 13, color: '#374151' }}>{selectedRental.notes}</p>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              {!selectedRental.returnedDate && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button onClick={() => handleTogglePayment(selectedRental)} className={`action-btn-green ${selectedRental.paymentReceived ? 'active' : ''}`}>
                    <Check size={13} />{selectedRental.paymentReceived ? t('payment_received') : t('payment_received')}
                  </button>
                  <button onClick={() => handleMarkReturned(selectedRental)} className="action-btn-amber">
                    <RotateCcw size={13} />{t('mark_returned')}
                  </button>
                  <button onClick={() => { setShowRentalEdit(!showRentalEdit); setRentalEdit({ extendedEndDate: selectedRental.extendedEndDate || selectedRental.endDate, notes: selectedRental.notes || '', renterName: selectedRental.renterName, totalCost: selectedRental.totalCost }); }} className="action-btn-amber">
                    <Edit3 size={13} />{t('extend_rental')}
                  </button>
                </div>
              )}

              {/* Extended edit form */}
              {showRentalEdit && !rentalEditDone && (
                <form onSubmit={handleUpdateRental} style={{ display: 'flex', flexDirection: 'column', gap: 12, background: '#f8fafc', padding: 14, borderRadius: 12, border: '1px solid #e2e8f0' }}>
                  <h4 style={{ fontWeight: 800, fontSize: 14, color: '#0f172a' }}>{t('extend_rental')} / {t('edit_rental')}</h4>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>{t('new_ext_date')}</label>
                    <input type="date" className="form-input" value={rentalEdit.extendedEndDate || ''} min={selectedRental.endDate} onChange={e => setRentalEdit(p => ({ ...p, extendedEndDate: e.target.value }))} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>Price (Rs)</label>
                    <input type="number" className="form-input" value={rentalEdit.totalCost || ''} onChange={e => setRentalEdit(p => ({ ...p, totalCost: Number(e.target.value) }))} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>{t('notes')}</label>
                    <textarea className="form-input" rows={2} value={rentalEdit.notes || ''} onChange={e => setRentalEdit(p => ({ ...p, notes: e.target.value }))} style={{ resize: 'none' }} />
                  </div>
                  <button type="submit" className="btn btn-primary">{t('update_rental')}</button>
                </form>
              )}
              {rentalEditDone && <div className="success-panel" style={{ padding: '12px' }}><CheckCircle size={20} style={{ color: '#16a34a' }} /><p style={{ fontWeight: 700 }}>Updated!</p></div>}

              {/* Delete */}
              <button onClick={() => handleDeleteRental(selectedRental)} className="action-btn-red" style={{ width: '100%', justifyContent: 'center' }}>
                <Trash2 size={14} />{t('delete_rental')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Equipment Modal ── */}
      {showAddGearModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowAddGearModal(false); }}>
          <div className="modal-box fade-up" style={{ padding: 24, maxWidth: 500 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>{t('add_equip_title')}</h3>
              <button onClick={() => setShowAddGearModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}><X size={18} /></button>
            </div>

            {gearDone ? (
              <div className="success-panel" style={{ padding: '20px 10px' }}>
                <div className="success-icon"><CheckCircle size={28} /></div>
                <p style={{ fontWeight: 700, fontSize: 16, color: '#0f172a' }}>Item Added! 🎉</p>
              </div>
            ) : (
              <form onSubmit={handleAddGear} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div><label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>{t('equip_name')} *</label><input className="form-input" placeholder="e.g. Canon EOS 90D" required value={gear.name} onChange={e => setGear(g => ({ ...g, name: e.target.value }))} /></div>
                {sCategoriesEnabled && (
                  <div><label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>{t('category')} *</label>
                    <select className="form-input" value={gear.category} onChange={e => setGear(g => ({ ...g, category: e.target.value }))} required>
                      {sCategories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                )}
                <div><label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>{t('description')}</label><textarea className="form-input" placeholder="Condition, lenses included..." rows={3} value={gear.description} onChange={e => setGear(g => ({ ...g, description: e.target.value }))} style={{ resize: 'none' }} /></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div><label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>{t('price_day')} *</label><input className="form-input" type="number" required min={1} placeholder="2500" value={gear.pricePerDay || ''} onChange={e => setGear(g => ({ ...g, pricePerDay: Number(e.target.value) }))} /></div>
                  <div><label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>{t('units')} *</label><input className="form-input" type="number" required min={1} placeholder="1" value={gear.units || 1} onChange={e => setGear(g => ({ ...g, units: Number(e.target.value) }))} /></div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>{t('photo')} *</label>
                  {gear.image ? (
                    <div style={{ position: 'relative', width: '100%', height: 140, borderRadius: 12, overflow: 'hidden', border: '1px solid #cbd5e1' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={gear.image} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button type="button" onClick={() => setGear(g => ({ ...g, image: '' }))} style={{ position: 'absolute', top: 8, right: 8, background: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%', width: 24, height: 24, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={14} /></button>
                    </div>
                  ) : (
                    <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '24px 16px', border: '2px dashed #cbd5e1', borderRadius: 12, cursor: 'pointer', background: '#f8fafc', textAlign: 'center' }} className="upload-box-hover">
                      <Camera size={24} style={{ color: '#64748b' }} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>Upload Photo</span>
                      <span style={{ fontSize: 11, color: '#94a3b8' }}>PNG, JPG</span>
                      <input type="file" accept="image/*" onChange={e => processImage(e.target.files?.[0], base64 => setGear(g => ({ ...g, image: base64 })))} style={{ display: 'none' }} required />
                    </label>
                  )}
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 8 }}>{t('publish')}</button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── Edit Equipment Modal ── */}
      {editingItem && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setEditingItem(null); }}>
          <div className="modal-box fade-up" style={{ padding: 24, maxWidth: 500 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>{t('edit_equip_title')}</h3>
              <button onClick={() => setEditingItem(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}><X size={18} /></button>
            </div>
            {editGearDone ? (
              <div className="success-panel" style={{ padding: '20px 10px' }}>
                <div className="success-icon"><CheckCircle size={28} /></div>
                <p style={{ fontWeight: 700, fontSize: 16, color: '#0f172a' }}>Updated! 🎉</p>
              </div>
            ) : (
              <form onSubmit={handleEditGear} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div><label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>{t('equip_name')} *</label><input className="form-input" required value={editingItem.name} onChange={e => setEditingItem(g => g ? ({ ...g, name: e.target.value }) : null)} /></div>
                {sCategoriesEnabled && (
                  <div><label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>{t('category')}</label>
                    <select className="form-input" value={editingItem.category} onChange={e => setEditingItem(g => g ? ({ ...g, category: e.target.value }) : null)}>
                      {sCategories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                )}
                <div><label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>{t('description')}</label><textarea className="form-input" rows={3} value={editingItem.description} onChange={e => setEditingItem(g => g ? ({ ...g, description: e.target.value }) : null)} style={{ resize: 'none' }} /></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div><label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>{t('price_day')} *</label><input className="form-input" type="number" required min={1} value={editingItem.pricePerDay || ''} onChange={e => setEditingItem(g => g ? ({ ...g, pricePerDay: Number(e.target.value) }) : null)} /></div>
                  <div><label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>{t('units')}</label><input className="form-input" type="number" min={1} value={editingItem.units || 1} onChange={e => setEditingItem(g => g ? ({ ...g, units: Number(e.target.value) }) : null)} /></div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>{t('photo')}</label>
                  {editingItem.image ? (
                    <div style={{ position: 'relative', width: '100%', height: 140, borderRadius: 12, overflow: 'hidden', border: '1px solid #cbd5e1' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={editingItem.image} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button type="button" onClick={() => setEditingItem(g => g ? ({ ...g, image: '' }) : null)} style={{ position: 'absolute', top: 8, right: 8, background: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%', width: 24, height: 24, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={14} /></button>
                    </div>
                  ) : (
                    <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '24px 16px', border: '2px dashed #cbd5e1', borderRadius: 12, cursor: 'pointer', background: '#f8fafc', textAlign: 'center' }} className="upload-box-hover">
                      <Camera size={24} style={{ color: '#64748b' }} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>Upload Photo</span>
                      <input type="file" accept="image/*" onChange={e => processImage(e.target.files?.[0], base64 => setEditingItem(g => g ? ({ ...g, image: base64 }) : null))} style={{ display: 'none' }} required />
                    </label>
                  )}
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 8 }}>{t('save_changes')}</button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── Customer Detail Modal ── */}
      {selectedCustomer && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setSelectedCustomer(null); }}>
          <div className="modal-box fade-up" style={{ padding: 24, maxWidth: 600 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottom: '1px solid #e2e8f0', paddingBottom: 14 }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', lineHeight: 1.2 }}>{selectedCustomer.name}</h3>
                <p style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>Registered Shop Client</p>
              </div>
              <button onClick={() => setSelectedCustomer(null)} style={{ background: '#f1f5f9', border: 'none', cursor: 'pointer', color: '#6b7280', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, background: '#f8fafc', padding: 16, borderRadius: 12, border: '1px solid #cbd5e1' }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <p style={{ fontSize: 10, textTransform: 'uppercase', color: '#94a3b8', fontWeight: 800, letterSpacing: 0.5, marginBottom: 2 }}>{t('address')}</p>
                  <p style={{ fontSize: 13, color: '#334155', fontWeight: 600, lineHeight: 1.5 }}>{selectedCustomer.address}</p>
                </div>
                <div>
                  <p style={{ fontSize: 10, textTransform: 'uppercase', color: '#94a3b8', fontWeight: 800, letterSpacing: 0.5, marginBottom: 2 }}>{t('primary_mob')}</p>
                  <p style={{ fontSize: 14, color: '#2563eb', fontWeight: 800 }}>{selectedCustomer.phone}</p>
                </div>
                <div>
                  <p style={{ fontSize: 10, textTransform: 'uppercase', color: '#94a3b8', fontWeight: 800, letterSpacing: 0.5, marginBottom: 2 }}>{t('sec_mob')}</p>
                  <p style={{ fontSize: 14, color: '#475569', fontWeight: 700 }}>{selectedCustomer.phone2 || 'Not provided'}</p>
                </div>
              </div>

              <div>
                <p style={{ fontSize: 12, fontWeight: 800, color: '#475569', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Shield size={14} style={{ color: '#2563eb' }} /> NIC Verification Documents
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {[
                    { label: 'NIC FRONT SIDE', photo: selectedCustomer.nicFrontPhoto },
                    { label: 'NIC BACK SIDE', photo: selectedCustomer.nicBackPhoto },
                  ].map(({ label, photo }) => (
                    <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textAlign: 'center' }}>{label}</span>
                      <div style={{ border: '1px solid #cbd5e1', borderRadius: 10, overflow: 'hidden', aspectRatio: '1.6/1', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {photo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={photo} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'zoom-in' }} onClick={() => { const w = window.open(); if (w) w.document.write(`<img src="${photo}" style="max-width:100%;max-height:100%;position:absolute;inset:0;margin:auto;" />`); }} />
                        ) : (
                          <span style={{ fontSize: 11, color: '#94a3b8', fontStyle: 'italic' }}>No photo</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <a href={`tel:${selectedCustomer.phone}`} className="btn btn-primary" style={{ flex: 1, padding: '10px 14px', fontSize: 13, textDecoration: 'none', textAlign: 'center', fontWeight: 700 }}>
                  <Phone size={14} style={{ marginRight: 6 }} />{t('call_client')}
                </a>
                <button onClick={() => setSelectedCustomer(null)} className="btn-ghost btn" style={{ flex: 1, padding: '10px 14px', fontSize: 13, background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', fontWeight: 700 }}>
                  {t('close')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ── Global Customer Registration Modal ── */}
      {showCustRegModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowCustRegModal(false); }}>
          <div className="modal-box fade-up" style={{ padding: 24, maxWidth: 500 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontWeight: 800, color: '#0f172a', fontSize: 16 }}>Register New Customer</h3>
              <button onClick={() => setShowCustRegModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}><X size={18} /></button>
            </div>
            <form onSubmit={handleInlineRegister} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {inlineCError && <p style={{ color: 'var(--red)', fontSize: 12, fontWeight: 600 }}>{inlineCError}</p>}
              <input type="text" className="form-input" placeholder={t('full_name') + ' *'} value={inlineCName} onChange={e => setInlineCName(e.target.value)} required />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <input type="tel" className="form-input" placeholder={t('primary_mob') + ' *'} value={inlineCPhone} onChange={e => setInlineCPhone(e.target.value)} required />
                <input type="tel" className="form-input" placeholder={t('sec_mob')} value={inlineCPhone2} onChange={e => setInlineCPhone2(e.target.value)} />
              </div>
              <textarea className="form-input" placeholder={t('address') + ' *'} rows={2} value={inlineCAddress} onChange={e => setInlineCAddress(e.target.value)} style={{ resize: 'none' }} required />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>NIC Front *</label>
                  {inlineCNicFront ? (
                    <div style={{ position: 'relative', height: 80, borderRadius: 8, overflow: 'hidden' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={inlineCNicFront} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button type="button" onClick={() => setInlineCNicFront('')} style={{ position: 'absolute', top: 4, right: 4, background: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%', width: 16, height: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={9} /></button>
                    </div>
                  ) : (
                    <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, height: 80, border: '2px dashed #cbd5e1', borderRadius: 8, cursor: 'pointer', background: '#f8fafc', textAlign: 'center' }} className="upload-box-hover">
                      <Camera size={16} style={{ color: '#64748b' }} />
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#475569' }}>Front</span>
                      <input type="file" accept="image/*" onChange={e => processImage(e.target.files?.[0], setInlineCNicFront)} style={{ display: 'none' }} required={!inlineCNicFront} />
                    </label>
                  )}
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>NIC Back</label>
                  {inlineCNicBack ? (
                    <div style={{ position: 'relative', height: 80, borderRadius: 8, overflow: 'hidden' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={inlineCNicBack} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button type="button" onClick={() => setInlineCNicBack('')} style={{ position: 'absolute', top: 4, right: 4, background: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%', width: 16, height: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={9} /></button>
                    </div>
                  ) : (
                    <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, height: 80, border: '2px dashed #cbd5e1', borderRadius: 8, cursor: 'pointer', background: '#f8fafc', textAlign: 'center' }} className="upload-box-hover">
                      <Camera size={16} style={{ color: '#64748b' }} />
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#475569' }}>Back</span>
                      <input type="file" accept="image/*" onChange={e => processImage(e.target.files?.[0], setInlineCNicBack)} style={{ display: 'none' }} />
                    </label>
                  )}
                </div>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 8 }}>Register & Select Customer</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
