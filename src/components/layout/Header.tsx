import React, { useState } from 'react';
import { Menu, Plus, Calendar, IndianRupee, Bell, Check, ExternalLink, X, GraduationCap } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../common/Button';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const {
    instituteConfig,
    notifications,
    markNotificationRead,
    clearAllNotifications,
    setIsPaymentModalOpen,
    setSelectedStudentForPayment,
    setIsNotificationModalOpen,
  } = useApp();
  const { currentUser, canManageFinances } = useAuth();
  const navigate = useNavigate();

  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleQuickPayment = () => {
    setSelectedStudentForPayment(null);
    setIsPaymentModalOpen(true);
  };

  const handleNotificationClick = (notif: any) => {
    markNotificationRead(notif.id);
    if (notif.actionUrl) {
      navigate(notif.actionUrl);
      setIsNotifOpen(false);
    }
  };

  return (
    <header className="app-header">
      <div className="header-left">
        <button
          type="button"
          className="mobile-menu-toggle"
          onClick={onToggleSidebar}
          aria-label="Open sidebar"
        >
          <Menu size={20} />
        </button>

        <div className="institute-status-badge">
          <span className="status-dot-active" />
          <span style={{ fontWeight: 500 }}>{instituteConfig.city}, {instituteConfig.state}</span>
          <span style={{ color: 'var(--color-border-strong)' }}>•</span>
          <span style={{ color: 'var(--color-text-muted)', fontSize: '11px' }}>
            {instituteConfig.categoryLabel}
          </span>
        </div>
      </div>

      <div className="header-right">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            color: 'var(--color-text-secondary)',
            marginRight: '4px',
          }}
        >
          <Calendar size={14} style={{ color: 'var(--color-primary)' }} />
          <span>Tuesday, 3 Nov 2026</span>
        </div>

        {/* In-App Notifications Bell Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            className="btn btn-outline btn-icon-only"
            style={{ position: 'relative' }}
            onClick={() => setIsNotifOpen(prev => !prev)}
            title="Institute Notifications"
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-3px',
                  right: '-3px',
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  fontSize: '10px',
                  fontWeight: 700,
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  lineHeight: 1,
                }}
              >
                {unreadCount}
              </span>
            )}
          </button>

          {isNotifOpen && (
            <div
              style={{
                position: 'absolute',
                top: '40px',
                right: '0',
                width: '320px',
                backgroundColor: '#ffffff',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                boxShadow: 'var(--shadow-lg)',
                zIndex: 1000,
                overflow: 'hidden',
                animation: 'fadeIn 0.15s ease',
              }}
            >
              <div
                style={{
                  padding: '10px 14px',
                  borderBottom: '1px solid var(--color-border)',
                  backgroundColor: '#f8fafc',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <strong style={{ fontSize: '13px' }}>Notifications ({unreadCount} new)</strong>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={clearAllNotifications}
                    style={{ fontSize: '11px', color: 'var(--color-primary)', cursor: 'pointer' }}
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>
                    No active notifications.
                  </div>
                ) : (
                  notifications.map(notif => (
                    <div
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      style={{
                        padding: '10px 14px',
                        borderBottom: '1px solid #f1f5f9',
                        cursor: 'pointer',
                        backgroundColor: notif.read ? '#ffffff' : '#f0f9ff',
                        transition: 'background-color 0.1s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <strong style={{ fontSize: '12px', color: '#0f172a' }}>{notif.title}</strong>
                        <span style={{ fontSize: '10px', color: '#94a3b8' }}>{notif.createdAt}</span>
                      </div>
                      <p style={{ fontSize: '11.5px', color: '#475569', margin: '3px 0 0 0', lineHeight: 1.35 }}>
                        {notif.message}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {/* View Full History Footer */}
              <div
                style={{
                  padding: '8px 14px',
                  borderTop: '1px solid var(--color-border)',
                  backgroundColor: '#f8fafc',
                  textAlign: 'center',
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setIsNotifOpen(false);
                    setIsNotificationModalOpen(true);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    color: 'var(--color-primary)',
                    cursor: 'pointer',
                  }}
                >
                  Open Notification & Announcement Center &rarr;
                </button>
              </div>
            </div>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          icon={<GraduationCap size={14} />}
          onClick={() => navigate('/teacher')}
          title="Switch to Teacher Class Portal"
        >
          Teacher Portal
        </Button>

        {canManageFinances && (
          <Button
            variant="outline"
            size="sm"
            icon={<IndianRupee size={14} />}
            onClick={handleQuickPayment}
          >
            Record Fee
          </Button>
        )}

        {canManageFinances && (
          <Button
            variant="primary"
            size="sm"
            icon={<Plus size={14} />}
            onClick={() => navigate('/students?action=new')}
          >
            New Admission
          </Button>
        )}
      </div>
    </header>
  );
};
