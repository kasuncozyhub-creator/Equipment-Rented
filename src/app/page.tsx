'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { db, Equipment, Rental, supabase, Customer, ShopProfile } from '@/lib/supabase';
import {
  Search,
  PlusCircle,
  Compass,
  BookOpen,
  MapPin,
  Star,
  Calendar,
  WifiOff,
  X,
  Camera,
  User,
  Shield,
  CheckCircle,
  Smartphone,
  Phone,
  Clock,
  Wrench,
  Truck,
  Zap,
  Package,
  TrendingUp,
  Activity,
  Lock,
  Mail,
  LogOut,
  Users,
  Store,
} from 'lucide-react';

/* ──────────────────────────────────────────────
   Types & Helpers
────────────────────────────────────────────── */
const categories = [
  { label: 'All',       value: 'All',           icon: Compass },
  { label: 'Camera',    value: 'Camera & Video', icon: Camera  },
  { label: 'Drone',     value: 'Drones',         icon: Zap     },
  { label: 'Tools',     value: 'Power Tools',    icon: Wrench  },
  { label: 'Audio',     value: 'Audio & Music',  icon: Phone   },
  { label: 'Transport', value: 'Transport',      icon: Truck   },
];

function daysBetween(start: string, end: string): number {
  const s = new Date(start);
  const e = new Date(end);
  return Math.max(1, Math.ceil(Math.abs(e.getTime() - s.getTime()) / 86400000));
}

function statusColor(status: Rental['status']): string {
  if (status === 'active')    return 'badge-green';
  if (status === 'upcoming')  return 'badge-blue';
  return 'badge-amber';
}
function statusLabel(status: Rental['status']): string {
  if (status === 'active')   return 'Active';
  if (status === 'upcoming') return 'Coming Soon';
  return 'Completed';
}

/* ──────────────────────────────────────────────
   Logo
────────────────────────────────────────────── */
function Logo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{
        width: 38, height: 38, borderRadius: 12,
        background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontWeight: 900, fontSize: 18, letterSpacing: -1,
        boxShadow: '0 4px 12px rgba(37,99,235,0.25)',
        flexShrink: 0,
      }}>R</div>
      <div>
        <div style={{ fontWeight: 900, fontSize: 18, letterSpacing: -0.5, color: '#1e40af', lineHeight: 1.1 }}>Rented</div>
        <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 500, lineHeight: 1 }}>Equipment Rental</div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Main Page
────────────────────────────────────────────── */
export default function RentedApp() {
  // Auth state
  const [user, setUser] = useState<{ phone: string; name: string } | null>(null);
  const [authView, setAuthView] = useState<'login' | 'signup' | 'verify_login' | 'verify_signup'>('login');
  const [authPhone, setAuthPhone] = useState('');
  const [authName, setAuthName] = useState('');
  const [authOtp, setAuthOtp] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const [tab, setTab] = useState<'catalog' | 'rentals' | 'customers' | 'profile'>('catalog');
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [shopProfile, setShopProfile] = useState<ShopProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [bookingItem, setBookingItem] = useState<Equipment | null>(null);
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  // Booking form (Admin assigns an item to a customer manually)
  const [bStart, setBStart] = useState('');
  const [bEnd,   setBEnd]   = useState('');
  const [bName,  setBName]  = useState('');
  const [bPhone, setBPhone] = useState('');
  const [bDone,  setBDone]  = useState(false);

  // Add customer form
  const [cName, setCName] = useState('');
  const [cPhone, setCPhone] = useState('');
  const [cPhone2, setCPhone2] = useState('');
  const [cAddress, setCAddress] = useState('');
  const [cNicFront, setCNicFront] = useState('');
  const [cNicBack, setCNicBack] = useState('');
  const [cDone, setCDone] = useState(false);
  const [cError, setCError] = useState('');

  // Shop Profile edit form
  const [sName, setSName] = useState('');
  const [sAddress, setSAddress] = useState('');
  const [sPhone, setSPhone] = useState('');
  const [sDescription, setSDescription] = useState('');
  const [sDone, setSDone] = useState(false);

  // Record rental form (active lease assignment)
  const [rEquipId, setREquipId] = useState('');
  const [rCustName, setRCustName] = useState('');
  const [rStart, setRStart] = useState('');
  const [rEnd, setREnd] = useState('');
  const [rDone, setRDone] = useState(false);
  const [rError, setRError] = useState('');

  // Add gear form
  const [gear, setGear] = useState({
    name: '', category: 'Power Tools', description: '',
    pricePerDay: 0, image: '', location: '', owner: '', phone: '',
  });
  const [gearDone, setGearDone] = useState(false);
  const [showAddGearModal, setShowAddGearModal] = useState(false);

  /* ── Load Data ── */
  const loadData = useCallback(async () => {
    try {
      const [equip, rents, custs, profile] = await Promise.all([
        db.getEquipment(),
        db.getRentals(),
        db.getCustomers(),
        db.getShopProfile()
      ]);
      setEquipment(equip);
      setRentals(rents);
      setCustomers(custs);
      setShopProfile(profile);
      
      // Seed shop forms
      setSName(profile.name);
      setSAddress(profile.address);
      setSPhone(profile.phone);
      setSDescription(profile.description);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    // Recover session
    const stored = localStorage.getItem('rented_user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch (_) {}
    }

    setOffline(!navigator.onLine);
    const on  = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    const beforeInstall = (e: Event) => { e.preventDefault(); setInstallPrompt(e); };
    window.addEventListener('beforeinstallprompt', beforeInstall);

    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
      window.removeEventListener('beforeinstallprompt', beforeInstall);
    };
  }, [loadData]);

  // Synchronize user profile into forms automatically
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

  /* ── Auth Actions ── */
  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');
    setAuthLoading(true);

    const phone = authPhone.trim();
    const name = authName.trim();

    if (authView === 'signup') {
      if (!name || !phone) {
        setAuthError('Please fill in all fields.');
        setAuthLoading(false);
        return;
      }
      if (phone.length < 6) {
        setAuthError('Please enter a valid mobile number.');
        setAuthLoading(false);
        return;
      }

      // Check uniqueness: One mobile number can only create one account
      const localUsers = JSON.parse(localStorage.getItem('rented_local_users') || '[]');
      const exists = localUsers.some((u: any) => u.phone === phone);
      if (exists) {
        setAuthError('This mobile number is already registered. Please sign in instead.');
        setAuthLoading(false);
        return;
      }

      // Transition to verification stage
      setAuthSuccess('Verification code sent! For testing, use the last 4 digits of your number.');
      setAuthView('verify_signup');
      setAuthLoading(false);

    } else if (authView === 'verify_signup') {
      if (!authOtp) {
        setAuthError('Please enter the verification code.');
        setAuthLoading(false);
        return;
      }

      const correctOtp = phone.slice(-4);
      if (authOtp !== correctOtp) {
        setAuthError('Incorrect verification code. Please try again.');
        setAuthLoading(false);
        return;
      }

      // Create local user (Unique constraint already checked)
      const localUsers = JSON.parse(localStorage.getItem('rented_local_users') || '[]');
      const newUser = { phone, name };
      localStorage.setItem('rented_local_users', JSON.stringify([...localUsers, newUser]));

      setAuthSuccess('Account created successfully! Logging you in...');
      setTimeout(() => {
        localStorage.setItem('rented_user', JSON.stringify(newUser));
        setUser(newUser);
        setAuthLoading(false);
        // Clear auth inputs
        setAuthPhone('');
        setAuthName('');
        setAuthOtp('');
      }, 1000);

    } else if (authView === 'login') {
      if (!phone) {
        setAuthError('Please enter your mobile number.');
        setAuthLoading(false);
        return;
      }

      // Check if registered
      const localUsers = JSON.parse(localStorage.getItem('rented_local_users') || '[]');
      const exists = localUsers.find((u: any) => u.phone === phone);
      
      // Support a default sandbox admin out-of-the-box
      if (!exists && phone === '0777777777') {
        // Let them verify and create automatically
        const adminUser = { phone: '0777777777', name: 'Rented Admin' };
        localStorage.setItem('rented_local_users', JSON.stringify([...localUsers, adminUser]));
      } else if (!exists) {
        setAuthError('This mobile number is not registered. Please create an account first.');
        setAuthLoading(false);
        return;
      }

      setAuthSuccess('Verification code sent! For testing, use the last 4 digits of your number.');
      setAuthView('verify_login');
      setAuthLoading(false);

    } else if (authView === 'verify_login') {
      if (!authOtp) {
        setAuthError('Please enter the verification code.');
        setAuthLoading(false);
        return;
      }

      const correctOtp = phone.slice(-4);
      if (authOtp !== correctOtp) {
        setAuthError('Incorrect verification code. Please try again.');
        setAuthLoading(false);
        return;
      }

      // Find user
      const localUsers = JSON.parse(localStorage.getItem('rented_local_users') || '[]');
      const matched = localUsers.find((u: any) => u.phone === phone);
      if (!matched) {
        setAuthError('User not found.');
        setAuthLoading(false);
        return;
      }

      setAuthSuccess('Verification successful! Logging you in...');
      setTimeout(() => {
        localStorage.setItem('rented_user', JSON.stringify(matched));
        setUser(matched);
        setAuthLoading(false);
        // Clear auth inputs
        setAuthPhone('');
        setAuthName('');
        setAuthOtp('');
      }, 1000);
    }
  }

  function handleLogout() {
    localStorage.removeItem('rented_user');
    setUser(null);
    setAuthPhone('');
    setAuthName('');
    setAuthOtp('');
    setAuthError('');
    setAuthSuccess('');
    setAuthView('login');
    setTab('catalog');
  }

  /* ── Filters ── */
  const filtered = equipment.filter(it => {
    const q = search.toLowerCase();
    const matchQ = !q || it.name.toLowerCase().includes(q) || it.location.toLowerCase().includes(q);
    const matchC = category === 'All' || it.category === category;
    return matchQ && matchC;
  });

  /* ── Book Submit (Admin registers a lease from catalog) ── */
  async function handleBook(e: React.FormEvent) {
    e.preventDefault();
    if (!bookingItem || !bStart || !bEnd || !bName) return;
    try {
      await db.rentEquipment(bookingItem.id, bStart, bEnd, bName);
      await loadData();
      setBDone(true);
      setTimeout(() => {
        setBDone(false);
        setBookingItem(null);
        setBStart('');
        setBEnd('');
        setBName('');
      }, 1500);
    } catch {}
  }

  /* ── Add Customer Submit ── */
  async function handleAddCustomer(e: React.FormEvent) {
    e.preventDefault();
    setCError('');
    const name = cName.trim();
    const phone = cPhone.trim();
    const phone2 = cPhone2.trim();
    const address = cAddress.trim();

    if (!name || !phone || !address) {
      setCError('Please fill in all required text fields.');
      return;
    }

    if (!cNicFront) {
      setCError('National Identity Card (NIC) Front Photo is required.');
      return;
    }

    // Check unique customer phone
    const exists = customers.some(c => c.phone === phone);
    if (exists) {
      setCError('A customer with this mobile number is already registered.');
      return;
    }

    await db.addCustomer({ 
      name, 
      phone, 
      phone2: phone2 || undefined, 
      address, 
      nicFrontPhoto: cNicFront, 
      nicBackPhoto: cNicBack || undefined 
    });
    await loadData();
    setCDone(true);
    setTimeout(() => {
      setCDone(false);
      setCName('');
      setCPhone('');
      setCPhone2('');
      setCAddress('');
      setCNicFront('');
      setCNicBack('');
    }, 1500);
  }

  /* Helper to process selected image file into base64 data string */
  function processImage(file: File | undefined, callback: (base64: string) => void) {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        callback(reader.result);
      }
    };
    reader.readAsDataURL(file);
  }

  /* ── Save Shop Profile Submit ── */
  async function handleSaveShopProfile(e: React.FormEvent) {
    e.preventDefault();
    await db.saveShopProfile({
      name: sName,
      address: sAddress,
      phone: sPhone,
      description: sDescription,
    });
    await loadData();
    setSDone(true);
    setTimeout(() => {
      setSDone(false);
    }, 1500);
  }

  /* ── Record Rental Submit ── */
  async function handleRecordRental(e: React.FormEvent) {
    e.preventDefault();
    setRError('');
    if (!rEquipId || !rCustName || !rStart || !rEnd) {
      setRError('Please select equipment, customer, and dates.');
      return;
    }

    try {
      await db.rentEquipment(rEquipId, rStart, rEnd, rCustName);
      await loadData();
      setRDone(true);
      setTimeout(() => {
        setRDone(false);
        setREquipId('');
        setRCustName('');
        setRStart('');
        setREnd('');
      }, 1500);
    } catch (err: any) {
      setRError(err.message || 'An error occurred while recording lease.');
    }
  }

  /* ── Add Gear Submit ── */
  async function handleAddGear(e: React.FormEvent) {
    e.preventDefault();
    await db.addEquipment({
      name: gear.name,
      category: gear.category,
      description: gear.description || 'No description.',
      pricePerDay: Number(gear.pricePerDay),
      image: gear.image || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
      location: gear.location || (shopProfile?.address || 'Main Shop'),
      owner: gear.owner || (shopProfile?.name || 'Rented Owner'),
    });
    await loadData();
    setGearDone(true);
    setTimeout(() => {
      setGearDone(false);
      setShowAddGearModal(false);
      setGear({ name: '', category: 'Power Tools', description: '', pricePerDay: 0, image: '', location: '', owner: '', phone: '' });
    }, 1500);
  }

  /* ── PWA Install ── */
  async function handleInstall() {
    if (!installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  }

  const activeRentalsCount = rentals.filter(r => r.status !== 'completed').length;
  const today = new Date().toISOString().split('T')[0];
  const availableCount = equipment.filter(e => e.available).length;

  /* ──────────────────────────────────────────────
     RENDER
  ────────────────────────────────────────────── */
  if (!user) {
    const isVerificationStep = authView === 'verify_login' || authView === 'verify_signup';
    
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
              {isVerificationStep && 'Verify Code'}
            </h2>
            <p className="auth-subtitle">
              {authView === 'login' && 'Enter your mobile number to sign in.'}
              {authView === 'signup' && 'Register your mobile number to get started.'}
              {isVerificationStep && `We've sent a 4-digit verification code to ${authPhone}.`}
            </p>
          </div>

          <form onSubmit={handleAuth} className="auth-form">
            {authError && (
              <div className="auth-error-alert">
                <X size={16} style={{ flexShrink: 0 }} />
                <span>{authError}</span>
              </div>
            )}
            {authSuccess && (
              <div className="auth-success-alert">
                <CheckCircle size={16} style={{ flexShrink: 0 }} />
                <span>{authSuccess}</span>
              </div>
            )}

            {!isVerificationStep ? (
              <>
                {authView === 'signup' && (
                  <div className="auth-field-group">
                    <label className="auth-label">Full Name</label>
                    <div className="auth-input-wrapper">
                      <User size={18} className="auth-input-icon" />
                      <input
                        type="text"
                        className="auth-input"
                        placeholder="John Doe"
                        value={authName}
                        onChange={(e) => setAuthName(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                )}

                <div className="auth-field-group">
                  <label className="auth-label">Mobile Number</label>
                  <div className="auth-input-wrapper">
                    <Smartphone size={18} className="auth-input-icon" />
                    <input
                      type="tel"
                      className="auth-input"
                      placeholder="e.g. 0777777777"
                      value={authPhone}
                      onChange={(e) => setAuthPhone(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: 8 }}
                  disabled={authLoading}
                >
                  {authLoading ? 'Please wait...' : 'Send Verification Code'}
                </button>
              </>
            ) : (
              <>
                <div className="auth-field-group">
                  <label className="auth-label">
                    <span>Verification Code</span>
                    <span style={{ fontSize: 11, color: 'var(--blue-500)', fontWeight: 700 }}>
                      Hint: {authPhone.slice(-4)}
                    </span>
                  </label>
                  <div className="auth-input-wrapper">
                    <Lock size={18} className="auth-input-icon" />
                    <input
                      type="text"
                      className="auth-input"
                      placeholder="Enter 4-digit code"
                      maxLength={4}
                      value={authOtp}
                      onChange={(e) => setAuthOtp(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: 8 }}
                  disabled={authLoading}
                >
                  {authLoading ? 'Verifying...' : 'Verify & Log In'}
                </button>
              </>
            )}
          </form>

          <div className="auth-footer">
            {authView === 'login' && (
              <>
                Don't have an account?
                <span className="auth-link" onClick={() => { setAuthView('signup'); setAuthError(''); setAuthSuccess(''); }}>
                  Create Account
                </span>
              </>
            )}
            {authView === 'signup' && (
              <>
                Already have an account?
                <span className="auth-link" onClick={() => { setAuthView('login'); setAuthError(''); setAuthSuccess(''); }}>
                  Sign In
                </span>
              </>
            )}
            {isVerificationStep && (
              <span 
                className="auth-link" 
                style={{ cursor: 'pointer', fontWeight: 600 }}
                onClick={() => { 
                  setAuthView(authView === 'verify_login' ? 'login' : 'signup'); 
                  setAuthError(''); 
                  setAuthSuccess('');
                  setAuthOtp('');
                }}
              >
                ← Back to enter details
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-root">

      {/* ── Top Banners ── */}
      {offline && (
        <div className="banner-offline">
          <WifiOff size={16} />
          Offline mode — Using cached data
        </div>
      )}
      {installPrompt && !offline && (
        <div className="banner-install">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Smartphone size={18} style={{ flexShrink: 0 }} />
            <span>Install <strong>Rented</strong> as an app on your phone — works offline too!</span>
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <button onClick={handleInstall} className="btn btn-primary btn-sm">Install</button>
            <button onClick={() => setInstallPrompt(null)} className="btn-ghost btn btn-sm" style={{ padding: '7px 8px' }}><X size={14} /></button>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <header className="header">
        <div className="header-inner">
          <Logo />
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span className="header-user-name" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-600)' }}>
                Hi, {user.name || user.phone}
              </span>
              <button 
                onClick={handleLogout} 
                className="btn-ghost btn btn-sm" 
                style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-600)', background: 'var(--bg)', borderRadius: 'var(--radius-sm)', padding: '6px 12px' }}
                title="Log Out"
              >
                <LogOut size={14} style={{ color: 'var(--red)' }} />
                <span style={{ fontWeight: 600 }}>Log Out</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ── Body: Sidebar + Main ── */}
      <div className="body-layout">

        {/* ── Desktop Sidebar Nav ── */}
        <nav className="sidebar" aria-label="Main navigation">
          <span className="sidebar-label">Navigation</span>
          <button
            id="sidebar-catalog"
            className={`sidebar-item ${tab === 'catalog' ? 'active' : ''}`}
            onClick={() => setTab('catalog')}
          >
            <Compass size={18} />
            Browse Catalog
          </button>
          <button
            id="sidebar-rentals"
            className={`sidebar-item ${tab === 'rentals' ? 'active' : ''}`}
            onClick={() => setTab('rentals')}
          >
            <BookOpen size={18} />
            Rentals Manager
            {activeRentalsCount > 0 && (
              <span className="sidebar-badge">{activeRentalsCount}</span>
            )}
          </button>
          <button
            id="sidebar-customers"
            className={`sidebar-item ${tab === 'customers' ? 'active' : ''}`}
            onClick={() => setTab('customers')}
          >
            <Users size={18} />
            Customers
          </button>
          <button
            id="sidebar-profile"
            className={`sidebar-item ${tab === 'profile' ? 'active' : ''}`}
            onClick={() => setTab('profile')}
          >
            <Store size={18} />
            Shop Profile
          </button>

          <div className="sidebar-divider" />
          <span className="sidebar-label">Overview</span>

          <div style={{ padding: '6px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: '#6b7280' }}>Available</span>
              <span style={{ fontWeight: 700, color: '#2563eb' }}>{availableCount}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: '#6b7280' }}>Total Items</span>
              <span style={{ fontWeight: 700, color: '#1e40af' }}>{equipment.length}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: '#6b7280' }}>Active Rentals</span>
              <span style={{ fontWeight: 700, color: '#16a34a' }}>{activeRentalsCount}</span>
            </div>
          </div>

          {user && (
            <>
              <div className="sidebar-divider" />
              <span className="sidebar-label">Account</span>
              <button
                className="sidebar-item"
                style={{ color: 'var(--red)', marginTop: 4 }}
                onClick={handleLogout}
              >
                <LogOut size={18} />
                Log Out
              </button>
            </>
          )}
        </nav>

        {/* ── Main Content ── */}
        <main className="main-content">
          <div className="page-wrap" style={{ paddingTop: 20, paddingBottom: 20 }}>

            {/* ─── CATALOG TAB ─── */}
            {tab === 'catalog' && (
              <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* Desktop Stats Row */}
                <div className="stats-row">
                  <div className="stat-card">
                    <div className="stat-icon"><Package size={20} /></div>
                    <div>
                      <div className="stat-label">Total Equipment</div>
                      <div className="stat-value">{equipment.length}</div>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon" style={{ background: '#dcfce7', color: '#16a34a' }}><Activity size={20} /></div>
                    <div>
                      <div className="stat-label">Ready to Rent</div>
                      <div className="stat-value" style={{ color: '#16a34a' }}>{availableCount}</div>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon" style={{ background: '#fef3c7', color: '#d97706' }}><TrendingUp size={20} /></div>
                    <div>
                      <div className="stat-label">Active Rentals</div>
                      <div className="stat-value" style={{ color: '#d97706' }}>{activeRentalsCount}</div>
                    </div>
                  </div>
                </div>

                {/* Hero */}
                <div className="hero-banner">
                  {/* Decorative circles */}
                  <div style={{ position: 'absolute', top: -20, right: -20, width: 140, height: 140, background: 'rgba(255,255,255,0.06)', borderRadius: '50%' }} />
                  <div style={{ position: 'absolute', bottom: -30, right: 60, width: 90, height: 90, background: 'rgba(255,255,255,0.04)', borderRadius: '50%' }} />

                  <div className="hero-text" style={{ position: 'relative' }}>
                    <p style={{ fontSize: 11, fontWeight: 700, opacity: 0.7, marginBottom: 6, letterSpacing: 1, textTransform: 'uppercase' }}>WELCOME TO RENTED</p>
                    <h2 style={{ fontSize: 22, fontWeight: 900, letterSpacing: -0.5, lineHeight: 1.2, marginBottom: 8 }}>
                      Rent Equipment<br />Easily
                    </h2>
                    <p style={{ fontSize: 13, opacity: 0.8, marginBottom: 18, lineHeight: 1.5 }}>
                      Cameras, tools, audio gear & more
                    </p>
                    <button className="btn hero-cta" onClick={() => setShowAddGearModal(true)} style={{
                      background: 'white', color: '#2563eb', padding: '10px 20px', fontSize: 13,
                      borderRadius: 10, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6,
                    }}>
                      <PlusCircle size={15} />
                      Add New Equipment
                    </button>
                  </div>
                </div>

                {/* Search */}
                <div className="search-wrap">
                  <Search size={18} className="search-icon" />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Camera, Drill, Generator... Search"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    id="equipment-search"
                  />
                </div>

                {/* Category chips */}
                <div className="chip-group">
                  {categories.map(c => (
                    <button
                      key={c.value}
                      className={`chip ${category === c.value ? 'chip-active' : 'chip-default'}`}
                      onClick={() => setCategory(c.value)}
                    >
                      <c.icon size={13} />
                      {c.label}
                    </button>
                  ))}
                </div>

                {/* Results count */}
                <div style={{ fontSize: 13, color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span><strong style={{ color: '#1e40af' }}>{filtered.length}</strong> items available</span>
                  {filtered.filter(e => e.available).length > 0 && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span className="dot dot-green" />
                      {filtered.filter(e => e.available).length} ready to rent
                    </span>
                  )}
                </div>

                {/* Equipment Grid */}
                {loading ? (
                  <div className="loading-wrap">
                    <div className="spinner" />
                    <p style={{ fontSize: 14, color: '#6b7280' }}>Loading equipment...</p>
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon"><Search size={28} /></div>
                    <p style={{ fontWeight: 700, fontSize: 16, color: '#374151' }}>No equipment found</p>
                    <p style={{ fontSize: 14 }}>Try a different search or category</p>
                  </div>
                ) : (
                  <div className="equip-grid">
                    {filtered.map(item => (
                      <article key={item.id} className="equip-card">
                        {/* Image */}
                        <div className="equip-img">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={item.image} alt={item.name} />
                          <div style={{ position: 'absolute', top: 10, left: 10 }}>
                            <span className={`badge ${item.available ? 'badge-green' : 'badge-red'}`}>
                              <span className={`dot ${item.available ? 'dot-green' : 'dot-red'}`} style={{ width: 6, height: 6 }} />
                              {item.available ? 'Available' : 'Rented'}
                            </span>
                          </div>
                          <div style={{ position: 'absolute', top: 10, right: 10 }}>
                            <span className="badge badge-blue">{item.category}</span>
                          </div>
                        </div>

                        {/* Body */}
                        <div className="equip-body">
                          <div>
                            <h3 style={{ fontWeight: 800, fontSize: 15, color: '#0f172a', lineHeight: 1.3, marginBottom: 4 }}>{item.name}</h3>
                            <p style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              {item.description}
                            </p>
                          </div>

                          {/* Meta row */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#6b7280' }}>
                              <MapPin size={13} style={{ color: '#2563eb' }} />
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 130 }}>{item.location}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, color: '#6b7280' }}>
                              <Star size={13} style={{ fill: '#fbbf24', color: '#fbbf24' }} />
                              <span style={{ fontWeight: 700, color: '#374151' }}>{item.rating.toFixed(1)}</span>
                            </div>
                          </div>

                          {/* Price + CTA */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                            <div className="equip-price">
                              Rs.{(item.pricePerDay * 330).toLocaleString()}
                              <span> /day</span>
                            </div>
                            <button
                              disabled={!item.available}
                              onClick={() => setBookingItem(item)}
                              className={`btn btn-sm ${item.available ? 'btn-primary' : 'btn-secondary'}`}
                              style={{ fontSize: 12 }}
                            >
                              {item.available ? (
                                <><Calendar size={13} /> Rent Now</>
                              ) : (
                                'Unavailable'
                              )}
                            </button>
                          </div>

                          {/* Owner */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingTop: 8, borderTop: '1px solid #f0f6ff' }}>
                            <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <User size={13} style={{ color: '#2563eb' }} />
                            </div>
                            <span style={{ fontSize: 12, color: '#6b7280' }}>
                              by <strong style={{ color: '#374151' }}>{item.owner}</strong>
                            </span>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ─── RENTALS TAB ─── */}
            {tab === 'rentals' && (
              <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <div className="section-title">Rentals Manager</div>
                  <div className="section-sub">Track active leases and record new rentals directly.</div>
                </div>

                <div className="form-layout">
                  {/* Left: Active Rentals list */}
                  <div className="form-main" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {loading ? (
                      <div className="loading-wrap"><div className="spinner" /></div>
                    ) : rentals.length === 0 ? (
                      <div className="empty-state">
                        <div className="empty-icon"><BookOpen size={28} /></div>
                        <p style={{ fontWeight: 700, fontSize: 16, color: '#374151' }}>No rentals logged</p>
                        <p style={{ fontSize: 14 }}>Assign equipment to a customer to see rentals here</p>
                      </div>
                    ) : (
                      rentals.map(r => (
                        <div key={r.id} className="rental-card">
                          <div className="rental-thumb">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={r.equipmentImage} alt={r.equipmentName} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                          </div>
                          <div className="rental-details">
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                              <h4 style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', lineHeight: 1.3 }}>{r.equipmentName}</h4>
                              <span className={`badge ${statusColor(r.status)}`}>
                                {statusLabel(r.status)}
                              </span>
                            </div>

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 14px', margin: '8px 0' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#6b7280' }}>
                                <Calendar size={12} style={{ color: '#2563eb' }} />
                                <span>{r.startDate} to {r.endDate}</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#6b7280' }}>
                                <User size={12} style={{ color: '#2563eb' }} />
                                <span>Rented by: <strong>{r.renterName}</strong></span>
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid #f0f6ff', marginTop: 'auto' }}>
                              <div>
                                <p style={{ fontSize: 11, color: '#9ca3af' }}>Revenue</p>
                                <p style={{ fontWeight: 800, fontSize: 16, color: '#2563eb' }}>Rs.{(r.totalCost * 330).toLocaleString()}</p>
                              </div>
                              <div style={{ fontSize: 11, fontWeight: 600, color: '#16a34a', background: '#dcfce7', padding: '4px 10px', borderRadius: 99, border: '1px solid #bbf7d0' }}>
                                Confirmed Lease
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Right: Record Rental Form */}
                  <div className="form-side">
                    <div className="card-flat" style={{ padding: 20 }}>
                      <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>Record Rental</h3>
                      <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 16 }}>Log a new manual equipment lease contract.</p>

                      {rDone ? (
                        <div className="success-panel" style={{ padding: '20px 10px' }}>
                          <div className="success-icon"><CheckCircle size={28} /></div>
                          <p style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>Rental Recorded! 🎉</p>
                          <p style={{ fontSize: 13, color: '#6b7280' }}>Database has been successfully updated.</p>
                        </div>
                      ) : (
                        <form onSubmit={handleRecordRental} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                          {rError && <p style={{ color: 'var(--red)', fontSize: 12, fontWeight: 600 }}>{rError}</p>}

                          <div>
                            <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>Select Equipment</label>
                            <select 
                              className="form-input" 
                              value={rEquipId} 
                              onChange={e => setREquipId(e.target.value)}
                              required
                            >
                              <option value="">-- Choose Equipment --</option>
                              {equipment.map(e => (
                                <option key={e.id} value={e.id}>
                                  {e.name} ({e.available ? 'Available' : 'Rented'})
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>Select Customer</label>
                            <select 
                              className="form-input" 
                              value={rCustName} 
                              onChange={e => setRCustName(e.target.value)}
                              required
                            >
                              <option value="">-- Choose Registered Customer --</option>
                              {customers.map(c => (
                                <option key={c.id} value={c.name}>{c.name} ({c.phone})</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>Start Date</label>
                            <input 
                              type="date" 
                              className="form-input" 
                              value={rStart} 
                              onChange={e => setRStart(e.target.value)} 
                              required 
                            />
                          </div>

                          <div>
                            <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>End Date</label>
                            <input 
                              type="date" 
                              className="form-input" 
                              value={rEnd} 
                              onChange={e => setREnd(e.target.value)} 
                              required 
                            />
                          </div>

                          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 4 }}>
                            Record Rental Log
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ─── CUSTOMERS TAB ─── */}
            {tab === 'customers' && (
              <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <div className="section-title">Customers Directory</div>
                  <div className="section-sub">Register and view your shop's rental clients.</div>
                </div>

                <div className="form-layout">
                  {/* Left: Customers List */}
                  <div className="form-main">
                    <div className="card-flat" style={{ overflow: 'hidden', padding: 0 }}>
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                          <thead>
                            <tr style={{ background: 'var(--surface-alt)', borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                              <th style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-700)' }}>Name</th>
                              <th style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-700)' }}>Contact Info</th>
                              <th style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-700)' }}>Address</th>
                              <th style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-700)' }}>NIC Documents</th>
                            </tr>
                          </thead>
                          <tbody>
                            {customers.length === 0 ? (
                              <tr>
                                <td colSpan={4} style={{ padding: '40px 16px', textAlign: 'center', color: '#9ca3af' }}>
                                  No registered customers found. Add your first customer on the right.
                                </td>
                              </tr>
                            ) : (
                              customers.map(c => (
                                <tr key={c.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                  <td style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--text-900)' }}>{c.name}</td>
                                  <td style={{ padding: '14px 16px' }}>
                                    <div style={{ color: 'var(--blue-600)', fontWeight: 600 }}>{c.phone}</div>
                                    {c.phone2 && <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>Sec: {c.phone2}</div>}
                                  </td>
                                  <td style={{ padding: '14px 16px', color: 'var(--text-600)' }}>{c.address}</td>
                                  <td style={{ padding: '14px 16px' }}>
                                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                      {c.nicFrontPhoto && (
                                        <a href={c.nicFrontPhoto} target="_blank" rel="noreferrer" title="Click to view full image" style={{ fontSize: 11, background: '#2563eb', color: '#fff', padding: '4px 8px', borderRadius: 4, textDecoration: 'none', fontWeight: 600, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>Front Side</a>
                                      )}
                                      {c.nicBackPhoto ? (
                                        <a href={c.nicBackPhoto} target="_blank" rel="noreferrer" title="Click to view full image" style={{ fontSize: 11, background: '#f1f5f9', color: '#475569', padding: '4px 8px', borderRadius: 4, textDecoration: 'none', fontWeight: 600, border: '1px solid #cbd5e1' }}>Back Side</a>
                                      ) : (
                                        <span style={{ fontSize: 11, color: '#9ca3af', fontStyle: 'italic', padding: '4px 0' }}>No Back</span>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* Right: Add Customer Form */}
                  <div className="form-side">
                    <div className="card-flat" style={{ padding: 20 }}>
                      <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>Add Customer</h3>
                      <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 16 }}>Register a new customer profile in your database.</p>

                      {cDone ? (
                        <div className="success-panel" style={{ padding: '20px 10px' }}>
                          <div className="success-icon"><CheckCircle size={28} /></div>
                          <p style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>Customer Registered! 🎉</p>
                          <p style={{ fontSize: 13, color: '#6b7280' }}>Customer profile was created.</p>
                        </div>
                      ) : (
                        <form onSubmit={handleAddCustomer} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                          {cError && <p style={{ color: 'var(--red)', fontSize: 12, fontWeight: 600 }}>{cError}</p>}
                          
                          <div>
                            <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>Full Name <span style={{ color: 'red' }}>*</span></label>
                            <input 
                              type="text" 
                              className="form-input" 
                              placeholder="Sarah Jenkins"
                              value={cName} 
                              onChange={e => setCName(e.target.value)} 
                              required 
                            />
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                            <div>
                              <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>Primary Mobile <span style={{ color: 'red' }}>*</span></label>
                              <input 
                                type="tel" 
                                className="form-input" 
                                placeholder="e.g. 0771234567"
                                value={cPhone} 
                                onChange={e => setCPhone(e.target.value)} 
                                required 
                              />
                            </div>
                            <div>
                              <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>Secondary Mobile</label>
                              <input 
                                type="tel" 
                                className="form-input" 
                                placeholder="e.g. 0777654321"
                                value={cPhone2} 
                                onChange={e => setCPhone2(e.target.value)} 
                              />
                            </div>
                          </div>

                          <div>
                            <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>Business / Personal Address <span style={{ color: 'red' }}>*</span></label>
                            <textarea 
                              className="form-input" 
                              placeholder="12 Main Street, Colombo..."
                              rows={2}
                              value={cAddress} 
                              onChange={e => setCAddress(e.target.value)} 
                              style={{ resize: 'none' }}
                              required 
                            />
                          </div>

                          <div>
                            <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>NIC Front Photo <span style={{ color: 'red' }}>*</span></label>
                            <input 
                              type="file" 
                              accept="image/*"
                              className="form-input" 
                              onChange={e => processImage(e.target.files?.[0], setCNicFront)}
                              required={!cNicFront} 
                            />
                            {cNicFront && (
                              <div style={{ marginTop: 8, position: 'relative', display: 'inline-block' }}>
                                <img src={cNicFront} alt="NIC Front Preview" style={{ maxHeight: 80, borderRadius: 6, border: '1px solid #e2e8f0' }} />
                                <button type="button" onClick={() => setCNicFront('')} style={{ position: 'absolute', top: -6, right: -6, background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: 18, height: 18, fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>×</button>
                              </div>
                            )}
                          </div>

                          <div>
                            <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>NIC Back Photo (Optional)</label>
                            <input 
                              type="file" 
                              accept="image/*"
                              className="form-input" 
                              onChange={e => processImage(e.target.files?.[0], setCNicBack)}
                            />
                            {cNicBack && (
                              <div style={{ marginTop: 8, position: 'relative', display: 'inline-block' }}>
                                <img src={cNicBack} alt="NIC Back Preview" style={{ maxHeight: 80, borderRadius: 6, border: '1px solid #e2e8f0' }} />
                                <button type="button" onClick={() => setCNicBack('')} style={{ position: 'absolute', top: -6, right: -6, background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: 18, height: 18, fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>×</button>
                              </div>
                            )}
                          </div>

                          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 4 }}>
                            Register Customer
                          </button>
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
                  <div className="section-title">Shop Profile Details</div>
                  <div className="section-sub">Configure your business identity and store contact options.</div>
                </div>

                <div className="form-layout">
                  {/* Left: View Details */}
                  <div className="form-main">
                    <div className="card-flat" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ width: 64, height: 64, borderRadius: 16, background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 900, boxShadow: 'var(--shadow-md)' }}>
                          {sName ? sName.charAt(0) : 'R'}
                        </div>
                        <div>
                          <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>{sName || 'Rented Store'}</h3>
                          <p style={{ fontSize: 13, color: '#6b7280' }}>Mobile Rental Hub Account</p>
                        </div>
                      </div>

                      <div className="divider" />

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
                        <div>
                          <p style={{ fontSize: 11, textTransform: 'uppercase', color: '#9ca3af', fontWeight: 700, letterSpacing: 0.5, marginBottom: 4 }}>Business Address</p>
                          <p style={{ fontSize: 14, color: '#374151', fontWeight: 600 }}>{sAddress || 'Not set'}</p>
                        </div>
                        <div>
                          <p style={{ fontSize: 11, textTransform: 'uppercase', color: '#9ca3af', fontWeight: 700, letterSpacing: 0.5, marginBottom: 4 }}>Contact Phone Number</p>
                          <p style={{ fontSize: 14, color: '#2563eb', fontWeight: 700 }}>{sPhone || 'Not set'}</p>
                        </div>
                        <div>
                          <p style={{ fontSize: 11, textTransform: 'uppercase', color: '#9ca3af', fontWeight: 700, letterSpacing: 0.5, marginBottom: 4 }}>About Store / Terms</p>
                          <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.6 }}>{sDescription || 'No description provided.'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Edit Form */}
                  <div className="form-side">
                    <div className="card-flat" style={{ padding: 20 }}>
                      <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>Edit Details</h3>
                      <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 16 }}>Update public information for this store profile.</p>

                      {sDone ? (
                        <div className="success-panel" style={{ padding: '20px 10px' }}>
                          <div className="success-icon"><CheckCircle size={28} /></div>
                          <p style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>Profile Saved! 🎉</p>
                          <p style={{ fontSize: 13, color: '#6b7280' }}>Your shop details have been updated.</p>
                        </div>
                      ) : (
                        <form onSubmit={handleSaveShopProfile} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                          <div>
                            <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>Shop Name</label>
                            <input 
                              type="text" 
                              className="form-input" 
                              value={sName} 
                              onChange={e => setSName(e.target.value)} 
                              required 
                            />
                          </div>

                          <div>
                            <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>Business Location Address</label>
                            <input 
                              type="text" 
                              className="form-input" 
                              value={sAddress} 
                              onChange={e => setSAddress(e.target.value)} 
                              required 
                            />
                          </div>

                          <div>
                            <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>Business Hotline Phone</label>
                            <input 
                              type="tel" 
                              className="form-input" 
                              value={sPhone} 
                              onChange={e => setSPhone(e.target.value)} 
                              required 
                            />
                          </div>

                          <div>
                            <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>Store Intro Description</label>
                            <textarea 
                              className="form-input" 
                              rows={4}
                              value={sDescription} 
                              onChange={e => setSDescription(e.target.value)} 
                              style={{ resize: 'none' }}
                            />
                          </div>

                          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 4 }}>
                            Save Profile Updates
                          </button>
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

      {/* ── Mobile Bottom Navigation ── */}
      <nav className="bottom-nav" aria-label="Mobile navigation">
        <button
          id="nav-catalog"
          className={`bottom-nav-item ${tab === 'catalog' ? 'active' : ''}`}
          onClick={() => setTab('catalog')}
        >
          <Compass size={22} />
          <span>Catalog</span>
        </button>
        <button
          id="nav-rentals"
          className={`bottom-nav-item ${tab === 'rentals' ? 'active' : ''}`}
          onClick={() => setTab('rentals')}
        >
          <BookOpen size={22} />
          <span>Rentals</span>
          {activeRentalsCount > 0 && <span className="nav-dot" />}
        </button>
        <button
          id="nav-customers"
          className={`bottom-nav-item ${tab === 'customers' ? 'active' : ''}`}
          onClick={() => setTab('customers')}
        >
          <Users size={22} />
          <span>Customers</span>
        </button>
        <button
          id="nav-profile"
          className={`bottom-nav-item ${tab === 'profile' ? 'active' : ''}`}
          onClick={() => setTab('profile')}
        >
          <Store size={22} />
          <span>Profile</span>
        </button>
      </nav>

      {/* ── Booking Modal ── */}
      {bookingItem && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setBookingItem(null); }}>
          <div className="modal-box fade-up">
            {/* Image header */}
            <div style={{ position: 'relative', aspectRatio: '16/8', overflow: 'hidden', background: '#e8f0fe', borderRadius: '20px 20px 0 0' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={bookingItem.image} alt={bookingItem.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.55), transparent)' }} />
              <button
                onClick={() => setBookingItem(null)}
                style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(255,255,255,0.9)', border: 'none', cursor: 'pointer', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#374151' }}
              >
                <X size={16} />
              </button>
              <div style={{ position: 'absolute', bottom: 12, left: 14, right: 14 }}>
                <h3 style={{ color: 'white', fontWeight: 800, fontSize: 18, lineHeight: 1.2 }}>{bookingItem.name}</h3>
                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <MapPin size={11} /> {bookingItem.location}
                </p>
              </div>
            </div>

            {/* Form content */}
            <div style={{ padding: 20 }}>
              {bDone ? (
                <div className="success-panel" style={{ padding: '32px 20px' }}>
                  <div className="success-icon">
                    <CheckCircle size={32} />
                  </div>
                  <p style={{ fontWeight: 800, fontSize: 18, color: '#0f172a' }}>Booking Confirmed! 🎉</p>
                  <p style={{ fontSize: 14, color: '#6b7280', textAlign: 'center' }}>Your rental has been saved. Good luck with your project!</p>
                </div>
              ) : (
                <form onSubmit={handleBook} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {/* Price highlight */}
                  <div style={{ background: '#eff6ff', border: '1px solid #dbeafe', borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 13, color: '#6b7280' }}>Daily Rate</span>
                    <span style={{ fontWeight: 800, fontSize: 18, color: '#1e40af' }}>
                      Rs.{(bookingItem.pricePerDay * 330).toLocaleString()}<span style={{ fontSize: 12, fontWeight: 500, color: '#6b7280' }}>/day</span>
                    </span>
                  </div>

                  {/* Select Customer */}
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 5 }}>Select Customer *</label>
                    <select
                      className="form-input"
                      value={bName}
                      onChange={e => setBName(e.target.value)}
                      required
                    >
                      <option value="">-- Choose Registered Customer --</option>
                      {customers.map(c => (
                        <option key={c.id} value={c.name}>{c.name} ({c.phone})</option>
                      ))}
                    </select>
                  </div>

                  {/* Dates */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 5 }}>Start Date *</label>
                      <input className="form-input" type="date" required min={today} value={bStart} onChange={e => setBStart(e.target.value)} />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 5 }}>End Date *</label>
                      <input className="form-input" type="date" required min={bStart || today} value={bEnd} onChange={e => setBEnd(e.target.value)} />
                    </div>
                  </div>

                  {/* Cost Summary */}
                  {bStart && bEnd && (
                    <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#374151' }}>
                        <Clock size={14} style={{ color: '#16a34a' }} />
                        <span>{daysBetween(bStart, bEnd)} day{daysBetween(bStart, bEnd) > 1 ? 's' : ''}</span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: 11, color: '#6b7280' }}>Total Estimate</p>
                        <p style={{ fontSize: 18, fontWeight: 900, color: '#16a34a' }}>
                          Rs.{(daysBetween(bStart, bEnd) * bookingItem.pricePerDay * 330).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}

                  <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }}>
                    <CheckCircle size={18} />
                    Confirm Rental Booking
                  </button>

                  <p style={{ fontSize: 11, color: '#9ca3af', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    <Shield size={12} /> All bookings are safely stored and verifiable
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Add Equipment Modal (Admins only) ── */}
      {showAddGearModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowAddGearModal(false); }}>
          <div className="modal-box fade-up" style={{ padding: 24, maxWidth: 500 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>Add Catalog Equipment</h3>
              <button 
                onClick={() => setShowAddGearModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}
              >
                <X size={18} />
              </button>
            </div>

            {gearDone ? (
              <div className="success-panel" style={{ padding: '20px 10px' }}>
                <div className="success-icon"><CheckCircle size={28} /></div>
                <p style={{ fontWeight: 700, fontSize: 16, color: '#0f172a' }}>Item Added Successfully! 🎉</p>
                <p style={{ fontSize: 13, color: '#6b7280' }}>Your new equipment is live in your catalog.</p>
              </div>
            ) : (
              <form onSubmit={handleAddGear} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>Equipment Name *</label>
                  <input
                    className="form-input"
                    placeholder="e.g. Canon EOS 90D DSLR"
                    required
                    value={gear.name}
                    onChange={e => setGear(g => ({ ...g, name: e.target.value }))}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>Category *</label>
                  <select
                    className="form-input"
                    value={gear.category}
                    onChange={e => setGear(g => ({ ...g, category: e.target.value }))}
                  >
                    {categories.slice(1).map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>Description</label>
                  <textarea
                    className="form-input"
                    placeholder="Condition, lenses included, extra tools..."
                    rows={3}
                    value={gear.description}
                    onChange={e => setGear(g => ({ ...g, description: e.target.value }))}
                    style={{ resize: 'none' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>Price (Rs/day) *</label>
                    <input
                      className="form-input"
                      type="number"
                      required min={1}
                      placeholder="2500"
                      value={gear.pricePerDay || ''}
                      onChange={e => setGear(g => ({ ...g, pricePerDay: Number(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>Location *</label>
                    <input
                      className="form-input"
                      placeholder="Colombo, Kandy..."
                      required
                      value={gear.location}
                      onChange={e => setGear(g => ({ ...g, location: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>Photo URL (Optional)</label>
                  <input
                    className="form-input"
                    placeholder="https://..."
                    type="url"
                    value={gear.image}
                    onChange={e => setGear(g => ({ ...g, image: e.target.value }))}
                  />
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 8 }}>
                  Publish to Catalog
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
