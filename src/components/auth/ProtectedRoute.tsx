import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../common/Button';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('owner' | 'admin' | 'staff' | 'faculty')[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, currentUser, isLoading } = useAuth();
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
    const normalizedRole = rawRole === 'faculty' ? 'staff' : rawRole;
    const normalizedAllowed: string[] = allowedRoles.map(r => (r === 'faculty' ? 'staff' : r));

    if (!normalizedAllowed.includes(normalizedRole)) {
      return (
        <div
          style={{
            maxWidth: '540px',
            margin: '80px auto',
            padding: '32px',
            backgroundColor: '#ffffff',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            textAlign: 'center',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: '#fef2f2',
              color: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
            }}
          >
            <ShieldAlert size={28} />
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>
            Access Restricted: {currentUser?.roleTitle || 'Faculty Member'}
          </h2>
          <p style={{ fontSize: '13.5px', color: 'var(--color-text-secondary)', lineHeight: 1.5, marginBottom: '24px' }}>
            Your account role (<strong>{(currentUser?.role || 'staff').toUpperCase()}</strong>) does not have authorization to view or manage this administrative section. Only institute owners and administrative coordinators can access this area.
          </p>
          <Button variant="primary" icon={<ArrowLeft size={16} />} onClick={() => window.history.back()}>
            Return to Authorized Dashboard
          </Button>
        </div>
      );
    }
  }

  return <>{children}</>;
};
