import React, { useState } from 'react';
import { Layers, RotateCcw, UserCheck, Trash2, X, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { isProduction } from '../../lib/supabase';

export const DemoBanner: React.FC = () => {
  const { currentUser, demoUsers, switchUser } = useAuth();
  const { resetToDemoDefaults, resetAllDataToZero, setIsArchitectureModalOpen } = useApp();
  
  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    return localStorage.getItem('fixia_hide_demo_banner') === 'true';
  });

  if (isProduction || isDismissed) {
    return null;
  }

  const handleResetToZero = () => {
    if (window.confirm('Reset ALL workspace data to 0 (0 students, 0 batches, ₹0 fees, 0 attendance)? This creates a clean live slate.')) {
      resetAllDataToZero();
      alert('Workspace reset to clean 0 baseline. Ready for live data entry.');
    }
  };

  const handleResetToMock = () => {
    if (window.confirm('Reset all demo data back to default sample state (85 students, 6 batches, ₹32k collected, ₹18.5k pending)?')) {
      resetToDemoDefaults();
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('fixia_hide_demo_banner', 'true');
    setIsDismissed(true);
  };

  return (
    <header className="demo-banner" role="banner">
      <div className="demo-banner-left">
        <span className="demo-badge-pill">PREVIEW MODE</span>
        <span className="demo-banner-text">
          Local Development Preview &bull; Mathura–Vrindavan Pilot
        </span>
      </div>

      <div className="demo-banner-actions">
        {/* Role Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <UserCheck size={13} style={{ color: '#94a3b8' }} />
          <select
            value={currentUser.id}
            onChange={e => switchUser(e.target.value)}
            style={{
              background: '#1e293b',
              color: '#f8fafc',
              border: '1px solid #334155',
              fontSize: '11px',
              padding: '2px 8px',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
            title="Switch demo user profile"
          >
            {demoUsers.map(user => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.roleTitle.split('&')[0].trim()})
              </option>
            ))}
          </select>
        </div>

        {/* Multi-Tenant SaaS Architecture modal opener */}
        <button
          type="button"
          className="demo-banner-btn highlight"
          onClick={() => setIsArchitectureModalOpen(true)}
          title="View multi-tenant SaaS architecture blueprint"
        >
          <Layers size={13} />
          <span>Architecture</span>
        </button>

        {/* Reset to 0 (Clean Slate) */}
        <button
          type="button"
          className="demo-banner-btn"
          onClick={handleResetToZero}
          title="Clear all mock data and reset all counters to 0"
          style={{ color: '#f87171' }}
        >
          <Trash2 size={12} />
          <span>Reset to 0</span>
        </button>

        {/* Reset Demo Data Button */}
        <button
          type="button"
          className="demo-banner-btn"
          onClick={handleResetToMock}
          title="Load sample dataset (85 students, 6 batches)"
        >
          <RotateCcw size={12} />
          <span>Load Samples</span>
        </button>

        {/* Dismiss / Live Look */}
        <button
          type="button"
          className="demo-banner-btn"
          onClick={handleDismiss}
          title="Hide this preview banner for a clean production view"
          style={{ padding: '2px 6px' }}
        >
          <EyeOff size={12} />
          <span>Hide Banner</span>
        </button>
      </div>
    </header>
  );
};
