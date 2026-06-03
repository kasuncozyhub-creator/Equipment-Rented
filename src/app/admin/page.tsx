'use client';

import React, { useState, useEffect } from 'react';
import { db, supabase } from '@/lib/supabase';
import {
  Lock, Mail, LogOut, Trash2, AlertTriangle, X, Smartphone, CheckCircle
} from 'lucide-react';

function Logo({ shopName }: { shopName?: string }) {
  const name = shopName || 'Rented';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ width: 38, height: 38, borderRadius: 12, background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: 18, letterSpacing: -1, boxShadow: '0 4px 12px rgba(37,99,235,0.25)', flexShrink: 0 }}>
        {name.trim().charAt(0).toUpperCase() || 'R'}
      </div>
      <div>
        <div style={{ fontWeight: 900, fontSize: 18, letterSpacing: -0.5, color: '#1e40af', lineHeight: 1.1 }}>{name}</div>
        <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 500, lineHeight: 1 }}>Equipment Rental</div>
      </div>
    </div>
  );
}

export default function AdminPortal() {
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const [tenants, setTenants] = useState<any[]>([]);
  const [loadingTenants, setLoadingTenants] = useState(true);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');

  // Deletion Modal
  const [deleteConfirmStep, setDeleteConfirmStep] = useState<number>(0);
  const [tenantToDelete, setTenantToDelete] = useState<string | null>(null);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');

  useEffect(() => {
    // Load admin user from localStorage
    const stored = localStorage.getItem('rented_user');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.isAdmin) {
          setUser(parsed);
          loadTenants();
        }
      } catch {}
    }
  }, []);

  async function loadTenants() {
    setLoadingTenants(true);
    try {
      const list = await db.adminListTenants();
      setTenants(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTenants(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');
    setAuthLoading(true);

    try {
      // 1. Authenticate with Supabase using email/password
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password,
      });

      if (error) {
        setAuthError(error.message || 'Invalid Admin credentials.');
        setAuthLoading(false);
        return;
      }

      const supabaseUser = data.user;
      // 2. Validate that the logged in user ID is "2a1817ea-83b3-4a2d-a2de-39b7eb6fab81"
      if (!supabaseUser || supabaseUser.id !== '2a1817ea-83b3-4a2d-a2de-39b7eb6fab81') {
        setAuthError('Access Denied. You do not have Super Admin privileges.');
        await supabase.auth.signOut();
        setAuthLoading(false);
        return;
      }

      const adminUser = {
        phone: 'admin',
        name: 'Super Admin',
        id: supabaseUser.id,
        isAdmin: true,
      };

      setAuthSuccess('Admin login successful! Entering dashboard...');
      localStorage.setItem('rented_user', JSON.stringify(adminUser));
      localStorage.setItem('rented_admin_session', 'true');
      setUser(adminUser);
      loadTenants();
    } catch (err: any) {
      setAuthError(err.message || 'An unexpected error occurred.');
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleLogout() {
    try {
      await supabase.auth.signOut();
    } catch {}
    localStorage.removeItem('rented_user');
    localStorage.removeItem('rented_admin_session');
    setUser(null);
    setEmail('');
    setPassword('');
    setAuthError('');
    setAuthSuccess('');
  }

  if (!user) {
    return (
      <div className="auth-container">
        <div className="auth-bg-circle-1" />
        <div className="auth-bg-circle-2" />
        <div className="auth-card">
          <div className="auth-header">
            <Logo shopName="Super Admin Portal" />
            <h2 className="auth-title" style={{ marginTop: 20 }}>Super Admin Portal</h2>
            <p className="auth-subtitle">Log in to manage shop owners and system parameters.</p>
          </div>

          <form onSubmit={handleLogin} className="auth-form">
            {authError && <div className="auth-error-alert"><X size={16} style={{ flexShrink: 0 }} /><span>{authError}</span></div>}
            {authSuccess && <div className="auth-success-alert"><CheckCircle size={16} style={{ flexShrink: 0 }} /><span>{authSuccess}</span></div>}

            <div className="auth-field-group">
              <label className="auth-label">Admin Email</label>
              <div className="auth-input-wrapper">
                <Mail size={18} className="auth-input-icon" />
                <input type="email" className="auth-input" placeholder="admin@rented.com" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
            </div>

            <div className="auth-field-group">
              <label className="auth-label">Password</label>
              <div className="auth-input-wrapper">
                <Lock size={18} className="auth-input-icon" />
                <input type="password" className="auth-input" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 8 }} disabled={authLoading}>
              {authLoading ? 'Signing In...' : 'Admin Sign In'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="app-root">
      {/* Header */}
      <header className="header">
        <div className="header-inner">
          <Logo shopName="Super Admin Portal" />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="header-user-name" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-600)' }}>Hi, Super Admin</span>
            <button onClick={handleLogout} className="btn-ghost btn btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-600)', background: 'var(--bg)', borderRadius: 'var(--radius-sm)', padding: '6px 12px' }}>
              <LogOut size={14} style={{ color: 'var(--red)' }} />
              <span style={{ fontWeight: 600 }}>Log Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="main-content" style={{ padding: '24px 16px', maxWidth: 1080, margin: '0 auto', width: '100%' }}>
        <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: 'var(--text-900)', letterSpacing: '-0.5px' }}>Super Admin Dashboard</h1>
            <p style={{ fontSize: 13, color: 'var(--text-400)' }}>Manage registered rental shops and create new tenant accounts.</p>
          </div>

          {/* Layout Grid */}
          <div className="form-layout">
            {/* Left: Shops Directory */}
            <div className="form-main">
              <div className="card-flat" style={{ padding: 20 }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 14 }}>Registered Rental Shops</h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                    <thead>
                      <tr style={{ background: 'var(--surface-alt)', borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                        <th style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-700)' }}>Shop Name</th>
                        <th style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-700)' }}>Mobile Number</th>
                        <th style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-700)' }}>Verification Code (OTP)</th>
                        <th style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-700)', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loadingTenants ? (
                        <tr><td colSpan={4} style={{ padding: 40, textAlign: 'center' }}><div className="spinner" /></td></tr>
                      ) : tenants.length === 0 ? (
                        <tr><td colSpan={4} style={{ padding: 40, textAlign: 'center', color: 'var(--text-400)' }}>No rental shops registered yet.</td></tr>
                      ) : tenants.map(tenant => (
                        <tr key={tenant.phone} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--text-900)' }}>{tenant.name}</td>
                          <td style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--blue-600)' }}>{tenant.phone}</td>
                          <td style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--green)' }}>{tenant.verification_code || tenant.phone.slice(-4)}</td>
                          <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                            <button
                              onClick={() => {
                                setTenantToDelete(tenant.phone);
                                setDeleteConfirmStep(1);
                                setDeleteConfirmationText('');
                              }}
                              className="btn btn-sm btn-secondary"
                              style={{ color: 'var(--red)', borderColor: 'var(--red-light)', background: '#fff' }}
                            >
                              Delete Shop
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right: Add Tenant Form */}
            <div className="form-side" style={{ width: 320 }}>
              <div className="card-flat" style={{ padding: 20 }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>Create Rental Shop</h3>
                <p style={{ fontSize: 12, color: 'var(--text-400)', marginBottom: 16 }}>Register a new shop owner account.</p>

                {generatedOtp ? (
                  <div style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: 12, padding: 16, textAlign: 'center' }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#16a34a', marginBottom: 8 }}>Account Created Successfully! 🎉</p>
                    <p style={{ fontSize: 11, color: 'var(--text-400)', marginBottom: 4 }}>Give this verification code to the shop owner:</p>
                    <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: 2, color: '#15803d', background: '#dcfce7', padding: '8px 12px', borderRadius: 8, display: 'inline-block', margin: '4px 0' }}>
                      {generatedOtp}
                    </div>
                    <button
                      onClick={() => {
                        setGeneratedOtp('');
                        setNewName('');
                        setNewPhone('');
                      }}
                      className="btn btn-secondary btn-sm"
                      style={{ width: '100%', marginTop: 12 }}
                    >
                      Create Another
                    </button>
                  </div>
                ) : (
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!newName.trim() || !newPhone.trim()) return;
                      setLoadingTenants(true);
                      const res = await db.adminCreateTenant(newPhone.trim(), newName.trim());
                      setGeneratedOtp(res.verification_code);
                      await loadTenants();
                    }}
                    style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
                  >
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>Shop / Owner Name *</label>
                      <input className="form-input" placeholder="e.g. Apex Cameras" value={newName} onChange={e => setNewName(e.target.value)} required />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>Mobile Number *</label>
                      <input className="form-input" placeholder="e.g. 0712345678" value={newPhone} onChange={e => setNewPhone(e.target.value)} required />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 4 }}>
                      Create Tenant Account
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Triple Deletion Confirmation Overlay Modal */}
      {deleteConfirmStep > 0 && tenantToDelete && (
        <div className="modal-overlay" onClick={() => { setDeleteConfirmStep(0); setTenantToDelete(null); }}>
          <div className="modal-box fade-up" style={{ padding: 24, maxWidth: 450 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#dc2626', display: 'flex', alignItems: 'center', gap: 6 }}>
                <AlertTriangle size={20} /> Deletion Confirmation (Step {deleteConfirmStep} of 3)
              </h3>
              <button onClick={() => { setDeleteConfirmStep(0); setTenantToDelete(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}><X size={18} /></button>
            </div>

            {deleteConfirmStep === 1 && (
              <div>
                <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.6, marginBottom: 20 }}>
                  Are you sure you want to delete the rental shop with number <strong>{tenantToDelete}</strong>?
                </p>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => { setDeleteConfirmStep(0); setTenantToDelete(null); }}>Cancel</button>
                  <button className="btn btn-primary btn-sm" style={{ background: '#dc2626' }} onClick={() => setDeleteConfirmStep(2)}>Next Step →</button>
                </div>
              </div>
            )}

            {deleteConfirmStep === 2 && (
              <div>
                <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.6, marginBottom: 20, fontWeight: 600 }}>
                  ⚠️ WARNING: This will permanently remove all equipment catalogs, customer logs, and transaction history belonging to this shop owner. This action CANNOT be undone.
                </p>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => { setDeleteConfirmStep(0); setTenantToDelete(null); }}>Cancel</button>
                  <button className="btn btn-primary btn-sm" style={{ background: '#dc2626' }} onClick={() => setDeleteConfirmStep(3)}>Final Step →</button>
                </div>
              </div>
            )}

            {deleteConfirmStep === 3 && (
              <div>
                <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.6, marginBottom: 12 }}>
                  To confirm the deletion, please type <strong style={{ color: '#dc2626' }}>DELETE</strong> in the box below:
                </p>
                <input
                  className="form-input"
                  placeholder="Type DELETE here"
                  value={deleteConfirmationText}
                  onChange={e => setDeleteConfirmationText(e.target.value)}
                  style={{ marginBottom: 20, borderColor: deleteConfirmationText === 'DELETE' ? '#16a34a' : 'var(--border)' }}
                />
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => { setDeleteConfirmStep(0); setTenantToDelete(null); }}>Cancel</button>
                  <button
                    className="btn btn-primary btn-sm"
                    disabled={deleteConfirmationText !== 'DELETE'}
                    style={{ background: '#dc2626', opacity: deleteConfirmationText === 'DELETE' ? 1 : 0.5 }}
                    onClick={async () => {
                      setLoadingTenants(true);
                      await db.adminDeleteTenant(tenantToDelete);
                      await loadTenants();
                      setDeleteConfirmStep(0);
                      setTenantToDelete(null);
                    }}
                  >
                    Confirm Deletion
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
