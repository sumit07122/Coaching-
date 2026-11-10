import React from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Loader2, ShieldCheck, GraduationCap, UserCheck, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../common/Button';
import { UserRole } from '../../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, currentUser, isLoading, switchUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          gap: '12px',
          color: 'var(--color-text-muted)',
        }}
      >
        <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} />
        <span style={{ fontSize: '13px' }}>Verifying authenticated session...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role permissions if specified
  if (allowedRoles && allowedRoles.length > 0) {
    const rawRole = (currentUser?.role || 'staff') as string;
    const isTeacher = rawRole === 'teacher' || rawRole === 'faculty';
    const isSuperAdmin = rawRole === 'super_admin';

    // If teacher attempts to access an owner/admin restricted route, redirect directly to /teacher
    if (isTeacher && !allowedRoles.includes(rawRole as UserRole) && !allowedRoles.includes('staff')) {
      return <Navigate to="/teacher" replace />;
    }

    // Special isolation: Super Admin portal (/superadmin) requires super_admin role
    if (allowedRoles.includes('super_admin') && !isSuperAdmin) {
      if (isTeacher) {
        return <Navigate to="/teacher" replace />;
      }
      return (
        <div
          style={{
            maxWidth: '560px',
            margin: '80px auto',
            padding: '36px',
            backgroundColor: '#ffffff',
            border: '2px solid #e2e8f0',
            borderRadius: '16px',
            textAlign: 'center',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: '#fef2f2',
              color: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 18px auto',
              border: '2px solid #fecaca',
            }}
          >
            <ShieldAlert size={32} />
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
            Platform Governance Access Blocked
          </h2>
          <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6, marginBottom: '24px' }}>
            The <code>/superadmin</code> management portal is strictly isolated for <strong>FIXIA Platform Operations</strong> personnel. Institute owners and academy staff do not have authorization to modify SaaS subscriptions, commercial quotas, or cross-tenant records.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <Button
              variant="primary"
              icon={<ArrowLeft size={16} />}
              onClick={() => navigate('/')}
            >
              Return to Institute Dashboard
            </Button>
            <Button
              variant="outline"
              icon={<ShieldCheck size={16} />}
              onClick={() => {
                switchUser('USR-SUPERADMIN-01');
                navigate('/superadmin');
              }}
            >
              Log in as Super Admin
            </Button>
          </div>
        </div>
      );
    }

    const normalizedRole = rawRole === 'faculty' ? 'staff' : rawRole;
    const normalizedAllowed: string[] = allowedRoles.map(r => (r === 'faculty' ? 'staff' : r));

    if (!normalizedAllowed.includes(normalizedRole)) {
      return (
        <div
          style={{
            maxWidth: '540px',
            margin: '80px auto',
            padding: '36px',
            backgroundColor: '#ffffff',
            border: '1px solid var(--color-border)',
            borderRadius: '16px',
            textAlign: 'center',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.08)',
          }}
        >
          <div
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              backgroundColor: '#fef2f2',
              color: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
            }}
          >
            <ShieldAlert size={30} />
          </div>
          <h2 style={{ fontSize: '19px', fontWeight: 700, marginBottom: '8px', color: '#0f172a' }}>
            Access Restricted: {currentUser?.roleTitle || 'Current User'}
          </h2>
          <p style={{ fontSize: '13.5px', color: 'var(--color-text-secondary)', lineHeight: 1.5, marginBottom: '24px' }}>
            Your account role (<strong>{(currentUser?.role || 'staff').toUpperCase()}</strong>) does not have authorization to view or manage this administrative section. Only institute owners and administrative coordinators can access this area.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {isSuperAdmin && (
              <Button
                variant="primary"
                icon={<ShieldCheck size={16} />}
                onClick={() => navigate('/superadmin')}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                Go to Super Admin Platform
              </Button>
            )}

            {isTeacher && (
              <Button
                variant="primary"
                icon={<GraduationCap size={16} />}
                onClick={() => navigate('/teacher')}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                Go to Teacher Class Portal
              </Button>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
              <Button
                variant="outline"
                icon={<UserCheck size={15} />}
                onClick={() => {
                  switchUser('USR-01'); // Er. Rakesh Sharma (Owner)
                  navigate('/');
                }}
                style={{ flex: 1, justifyContent: 'center' }}
                title="Switch to Institute Owner profile to access this dashboard"
              >
                Switch to Owner
              </Button>

              <Button
                variant="outline"
                icon={<LogOut size={15} />}
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                style={{ flex: 1, justifyContent: 'center', color: '#ef4444' }}
              >
                Log Out
              </Button>
            </div>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};
