import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Phone,
  ShieldCheck,
  Building,
  GraduationCap,
  LogOut,
  Clock,
  MapPin,
  Lock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { getTeacherAssignedBatches } from '../../utils/teacherUtils';

export const TeacherProfile: React.FC = () => {
  const { currentUser, logout, isOwner, isAdmin } = useAuth();
  const { instituteConfig, batches, staff } = useApp();
  const navigate = useNavigate();

  const myBatches = getTeacherAssignedBatches(currentUser, batches, staff);
  const staffRecord = staff.find(
    s =>
      s.id === currentUser.id ||
      (s.email && currentUser.email && s.email.toLowerCase() === currentUser.email.toLowerCase()) ||
      s.name.toLowerCase() === currentUser.name.toLowerCase()
  );

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 4px 0' }}>
          Faculty Profile
        </h1>
        <p style={{ fontSize: '13.5px', color: 'var(--color-text-secondary)', margin: 0 }}>
          Your verified teacher identity and assigned instructional duties.
        </p>
      </div>

      {/* Teacher Identity Card */}
      <div className="teacher-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              backgroundColor: '#eff6ff',
              color: '#2563eb',
              fontSize: 24,
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid #bfdbfe',
            }}
          >
            {currentUser.name.charAt(0)}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>
                {currentUser.name}
              </h2>
              <span
                style={{
                  fontSize: '11.5px',
                  fontWeight: 700,
                  backgroundColor: '#ecfdf5',
                  color: '#065f46',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  border: '1px solid #a7f3d0',
                }}
              >
                Active Faculty
              </span>
            </div>
            <p style={{ fontSize: '13.5px', color: '#64748b', margin: 0 }}>
              {currentUser.roleTitle || 'Faculty Instructor'}
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Mail size={16} style={{ color: '#2563eb' }} />
            <div>
              <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Email Address</span>
              <span style={{ fontSize: '13.5px', fontWeight: 600 }}>{currentUser.email || 'N/A'}</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Phone size={16} style={{ color: '#2563eb' }} />
            <div>
              <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Phone Number</span>
              <span style={{ fontSize: '13.5px', fontWeight: 600 }}>{staffRecord?.phone || '+91 94120 00000'}</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <GraduationCap size={16} style={{ color: '#2563eb' }} />
            <div>
              <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Assigned Batches</span>
              <span style={{ fontSize: '13.5px', fontWeight: 600 }}>{myBatches.length} Cohorts</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldCheck size={16} style={{ color: '#10b981' }} />
            <div>
              <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Role Category</span>
              <span style={{ fontSize: '13.5px', fontWeight: 600 }}>
                {currentUser.role.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Institute Affiliation Card */}
      <div className="teacher-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <Building size={18} style={{ color: '#2563eb' }} />
          <h2 className="teacher-section-title">Institute Information</h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13.5px', color: 'var(--color-text-secondary)' }}>
          <div>
            <strong style={{ color: 'var(--color-text-main)' }}>{instituteConfig.name}</strong>
            <span style={{ display: 'block', fontSize: '12.5px', color: '#64748b' }}>{instituteConfig.tagline}</span>
          </div>

          <div>
            <span style={{ fontSize: '12px', color: '#64748b', display: 'block' }}>Campus Address:</span>
            <span>{instituteConfig.address}, {instituteConfig.city}, {instituteConfig.state} - {instituteConfig.pincode}</span>
          </div>

          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            <div>
              <span style={{ fontSize: '12px', color: '#64748b', display: 'block' }}>Director:</span>
              <span>{instituteConfig.directorName}</span>
            </div>
            <div>
              <span style={{ fontSize: '12px', color: '#64748b', display: 'block' }}>Academic Session:</span>
              <span>{instituteConfig.academicSession}</span>
            </div>
            <div>
              <span style={{ fontSize: '12px', color: '#64748b', display: 'block' }}>Institute Registration:</span>
              <span>{instituteConfig.regNumber}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Security & Access Boundary Notice */}
      <div className="teacher-card" style={{ backgroundColor: '#f8fafc' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
          <Lock size={16} style={{ color: '#475569' }} />
          <h2 style={{ fontSize: '14.5px', fontWeight: 700, margin: 0, color: '#334155' }}>
            Data Privacy & Security Sandbox
          </h2>
        </div>

        <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5, margin: '0 0 10px 0' }}>
          This portal enforces strict Row-Level Security (RLS) under FIXIA CoachingOS. Faculty profiles are restricted to attendance operations for their designated classes. Student billing records, invoice collections, fee discount structures, and administrative settings are sandboxed to maintain student privacy.
        </p>

        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '12.5px' }}>
          <div style={{ color: '#065f46' }}>
            ✓ Roll Call Management
          </div>
          <div style={{ color: '#065f46' }}>
            ✓ Assigned Cohorts
          </div>
          <div style={{ color: '#991b1b' }}>
            ✕ Financial Records Sandboxed
          </div>
          <div style={{ color: '#991b1b' }}>
            ✕ Institute Settings Sandboxed
          </div>
        </div>
      </div>

      {/* Logout Action (min 48px touch target) */}
      <div style={{ marginTop: '24px', textAlign: 'center' }}>
        <button
          onClick={handleLogout}
          style={{
            height: 48,
            minHeight: 48,
            width: '100%',
            maxWidth: '320px',
            borderRadius: '10px',
            border: '1.5px solid #fecaca',
            backgroundColor: '#fef2f2',
            color: '#dc2626',
            fontWeight: 700,
            fontSize: '14.5px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: 'pointer',
          }}
          aria-label="Sign out of Teacher Portal"
        >
          <LogOut size={16} />
          <span>Sign Out of Faculty Portal</span>
        </button>
      </div>
    </div>
  );
};
