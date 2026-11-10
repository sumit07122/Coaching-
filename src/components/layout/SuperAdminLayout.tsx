import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Building2,
  CreditCard,
  KeyRound,
  FileText,
  Activity,
  LogOut,
  ArrowRightLeft,
  Menu,
  X,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { Button } from '../common/Button';
import '../../styles/superadmin.css';

export const SuperAdminLayout: React.FC = () => {
  const { currentUser, logout, switchUser } = useAuth();
  const { platformInstitutes, softwareLicenses } = useApp();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const activeInstitutesCount = platformInstitutes.filter(i => i.status === 'active').length;

  return (
    <div className="sa-container">
      {/* Sidebar Overlay for Mobile */}
      {mobileMenuOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 45,
          }}
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Super Admin Platform Sidebar */}
      <aside className={`sa-sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="sa-sidebar-brand">
          <div className="sa-brand-icon">
            <ShieldCheck size={22} />
          </div>
          <div className="sa-brand-text">
            <h1>FIXIA Platform</h1>
            <span>Super Admin Operations</span>
          </div>
        </div>

        <nav className="sa-nav">
          <NavLink
            to="/superadmin"
            end
            className={({ isActive }) => `sa-nav-item ${isActive ? 'active' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            <Activity size={18} />
            <span>Platform Overview</span>
          </NavLink>

          <NavLink
            to="/superadmin/institutes"
            className={({ isActive }) => `sa-nav-item ${isActive ? 'active' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            <Building2 size={18} />
            <span>Institutes & Tenancy</span>
            <span className="sa-nav-badge">{platformInstitutes.length}</span>
          </NavLink>

          <NavLink
            to="/superadmin/subscriptions"
            className={({ isActive }) => `sa-nav-item ${isActive ? 'active' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            <CreditCard size={18} />
            <span>Subscriptions & Quotas</span>
          </NavLink>

          <NavLink
            to="/superadmin/licenses"
            className={({ isActive }) => `sa-nav-item ${isActive ? 'active' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            <KeyRound size={18} />
            <span>License Keys (Model B)</span>
            <span className="sa-nav-badge">{softwareLicenses.length}</span>
          </NavLink>

          <NavLink
            to="/superadmin/audit"
            className={({ isActive }) => `sa-nav-item ${isActive ? 'active' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            <FileText size={18} />
            <span>Platform Audit Logs</span>
          </NavLink>
        </nav>

        {/* Sidebar Footer with Quick Actions */}
        <div
          style={{
            padding: '16px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <button
            onClick={() => {
              switchUser('USR-01');
              navigate('/');
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              color: '#cbd5e1',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '12.5px',
              width: '100%',
              justifyContent: 'center',
              fontWeight: 500,
            }}
          >
            <ArrowRightLeft size={14} />
            <span>Switch to Institute View</span>
          </button>

          <button
            onClick={logout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              backgroundColor: 'transparent',
              color: '#f87171',
              borderRadius: '6px',
              border: '1px solid rgba(248, 113, 113, 0.2)',
              cursor: 'pointer',
              fontSize: '12.5px',
              width: '100%',
              justifyContent: 'center',
              fontWeight: 500,
            }}
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="sa-main">
        {/* Top Header */}
        <header className="sa-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{
                display: 'none',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '6px',
              }}
              className="sa-mobile-toggle"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            <div className="sa-header-status">
              <span className="sa-status-dot" />
              <span className="sa-status-text">
                Platform Operations: <strong>Operational</strong> (ap-south-1)
              </span>
            </div>
          </div>

          <div className="sa-header-actions">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                backgroundColor: '#f1f5f9',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: 600,
                color: '#334155',
              }}
            >
              <ShieldCheck size={14} style={{ color: '#4f46e5' }} />
              <span>{currentUser?.name || 'Super Admin'}</span>
              <span style={{ color: '#94a3b8' }}>•</span>
              <span style={{ color: '#6366f1' }}>ROOT</span>
            </div>

            <Button
              variant="outline"
              size="sm"
              icon={<ExternalLink size={13} />}
              onClick={() => window.open('https://supabase.com/dashboard/project/xruokhpngwzlodpgmsui', '_blank')}
            >
              Supabase Backend
            </Button>
          </div>
        </header>

        {/* Child Views */}
        <main className="sa-body">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
