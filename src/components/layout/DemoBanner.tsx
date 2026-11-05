import React from 'react';
import { Layers, RotateCcw, UserCheck, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';

export const DemoBanner: React.FC = () => {
  const { currentUser, demoUsers, switchUser } = useAuth();
  const { resetToDemoDefaults, setIsArchitectureModalOpen } = useApp();

  const handleReset = () => {
    if (window.confirm('Reset all demo data back to default state (85 students, 6 batches, ₹32k collected, ₹18.5k pending)?')) {
      resetToDemoDefaults();
    }
  };

  return (
    <header className="demo-banner" role="banner">
      <div className="demo-banner-left">
        <span className="demo-badge-pill">DEMO PROTOTYPE</span>
        <span className="demo-banner-text">
          Local In-Memory / Browser State &bull; Mathura–Vrindavan Pilot Setup
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
          title="View future multi-tenant SaaS architecture blueprint"
        >
          <Layers size={13} />
          <span>SaaS Architecture Blueprint</span>
        </button>

        {/* Reset State Button */}
        <button
          type="button"
          className="demo-banner-btn"
          onClick={handleReset}
          title="Reset all modifications back to factory demo dataset"
        >
          <RotateCcw size={12} />
          <span>Reset Demo</span>
        </button>
      </div>
    </header>
  );
};
