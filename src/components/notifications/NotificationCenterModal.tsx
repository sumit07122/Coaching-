import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  Trash2,
  Megaphone,
  IndianRupee,
  CalendarCheck,
  AlertCircle,
  ExternalLink,
  Plus,
  Send,
  CheckCircle2,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { InAppNotification } from '../../types';

export const NotificationCenterModal: React.FC = () => {
  const {
    notifications,
    isNotificationModalOpen,
    setIsNotificationModalOpen,
    markNotificationRead,
    clearAllNotifications,
    deleteNotification,
    addAnnouncement,
  } = useApp();
  const { userRole, currentUser } = useAuth();
  const navigate = useNavigate();

  const canBroadcast = userRole === 'owner' || userRole === 'admin';
  const currentInstId = currentUser?.instituteId || 'INST-MTH-01';

  // Filter notifications for current institute
  const instituteNotifs = notifications.filter(
    n => !n.instituteId || n.instituteId === currentInstId
  );

  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'fee_due' | 'announcement' | 'attendance'>(
    'all'
  );
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementMsg, setAnnouncementMsg] = useState('');
  const [announcementPriority, setAnnouncementPriority] = useState<'normal' | 'high'>('normal');
  const [announcementError, setAnnouncementError] = useState('');
  const [announcementSuccess, setAnnouncementSuccess] = useState('');

  const unreadCount = instituteNotifs.filter(n => !n.read).length;

  const filteredNotifs = instituteNotifs.filter(n => {
    if (activeTab === 'unread') return !n.read;
    if (activeTab === 'fee_due') return n.type === 'fee_due' || n.type === 'overdue';
    if (activeTab === 'announcement') return n.type === 'announcement';
    if (activeTab === 'attendance') return n.type === 'attendance_alert';
    return true;
  });

  const handleActionClick = (notif: InAppNotification) => {
    markNotificationRead(notif.id);
    if (notif.actionUrl) {
      setIsNotificationModalOpen(false);
      navigate(notif.actionUrl);
    }
  };

  const handleBroadcastSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementTitle.trim() || !announcementMsg.trim()) {
      setAnnouncementError('Announcement title and message content are required.');
      return;
    }

    try {
      addAnnouncement(announcementTitle.trim(), announcementMsg.trim(), announcementPriority);
      setAnnouncementSuccess('Announcement broadcasted to all institute staff and dashboard!');
      setAnnouncementTitle('');
      setAnnouncementMsg('');
      setAnnouncementError('');
      setTimeout(() => {
        setAnnouncementSuccess('');
        setShowAnnouncementForm(false);
      }, 1500);
    } catch (err: any) {
      setAnnouncementError(err.message || 'Failed to post announcement.');
    }
  };

  if (!isNotificationModalOpen) return null;

  return (
    <Modal
      isOpen={isNotificationModalOpen}
      onClose={() => {
        setIsNotificationModalOpen(false);
        setShowAnnouncementForm(false);
      }}
      title="Institute Notifications & Announcement Center"
      size="large"
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
            {instituteNotifs.length} total updates &bull; {unreadCount} unread
          </span>
          <Button variant="secondary" onClick={() => setIsNotificationModalOpen(false)}>
            Close
          </Button>
        </div>
      }
    >
      {/* Top Controls: Mark All Read & Broadcast Announcement */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px',
          paddingBottom: '14px',
          borderBottom: '1px solid var(--color-border)',
          marginBottom: '16px',
        }}
      >
        <div style={{ display: 'flex', gap: '8px' }}>
          {canBroadcast && (
            <Button
              variant={showAnnouncementForm ? 'secondary' : 'primary'}
              size="sm"
              icon={showAnnouncementForm ? undefined : <Megaphone size={14} />}
              onClick={() => {
                setShowAnnouncementForm(prev => !prev);
                setAnnouncementError('');
                setAnnouncementSuccess('');
              }}
            >
              {showAnnouncementForm ? 'Cancel Announcement' : 'Broadcast Announcement'}
            </Button>
          )}

          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              icon={<CheckCheck size={14} />}
              onClick={clearAllNotifications}
            >
              Mark All as Read ({unreadCount})
            </Button>
          )}
        </div>
      </div>

      {/* Broadcast Announcement Form */}
      {showAnnouncementForm && (
        <form
          onSubmit={handleBroadcastSubmit}
          style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #cbd5e1',
            borderRadius: 'var(--radius-md)',
            padding: '16px',
            marginBottom: '18px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Megaphone size={16} color="var(--color-primary)" />
            <strong style={{ fontSize: '14px', color: '#0f172a' }}>Post New Institute Announcement</strong>
          </div>

          {announcementError && (
            <div
              style={{
                padding: '8px 12px',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '4px',
                color: '#dc2626',
                fontSize: '12.5px',
                marginBottom: '12px',
              }}
            >
              {announcementError}
            </div>
          )}

          {announcementSuccess && (
            <div
              style={{
                padding: '8px 12px',
                backgroundColor: '#ecfdf5',
                border: '1px solid #a7f3d0',
                borderRadius: '4px',
                color: '#059669',
                fontSize: '12.5px',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <CheckCircle2 size={15} />
              <span>{announcementSuccess}</span>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px', marginBottom: '10px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                Announcement Headline / Title *
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. CBSE Mock Test Series 2 Schedule"
                value={announcementTitle}
                onChange={e => setAnnouncementTitle(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                Priority Level
              </label>
              <select
                className="form-select"
                value={announcementPriority}
                onChange={e => setAnnouncementPriority(e.target.value as any)}
              >
                <option value="normal">Normal Broadcast</option>
                <option value="high">Urgent / Important Notice</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
              Announcement Message Body *
            </label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="Provide full details, timing, venue, or syllabus instructions for students and staff..."
              value={announcementMsg}
              onChange={e => setAnnouncementMsg(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setShowAnnouncementForm(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              icon={<Send size={13} />}
            >
              Broadcast Now
            </Button>
          </div>
        </form>
      )}

      {/* Filter Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '6px',
          borderBottom: '1px solid var(--color-border)',
          marginBottom: '14px',
          flexWrap: 'wrap',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          style={{
            padding: '8px 12px',
            fontSize: '12.5px',
            fontWeight: activeTab === 'all' ? 600 : 500,
            borderBottom: activeTab === 'all' ? '2px solid var(--color-primary)' : '2px solid transparent',
            color: activeTab === 'all' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          All ({instituteNotifs.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('unread')}
          style={{
            padding: '8px 12px',
            fontSize: '12.5px',
            fontWeight: activeTab === 'unread' ? 600 : 500,
            borderBottom: activeTab === 'unread' ? '2px solid var(--color-primary)' : '2px solid transparent',
            color: activeTab === 'unread' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Unread Only ({unreadCount})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('fee_due')}
          style={{
            padding: '8px 12px',
            fontSize: '12.5px',
            fontWeight: activeTab === 'fee_due' ? 600 : 500,
            borderBottom: activeTab === 'fee_due' ? '2px solid var(--color-primary)' : '2px solid transparent',
            color: activeTab === 'fee_due' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Fee Dues & Overdue ({instituteNotifs.filter(n => n.type === 'fee_due' || n.type === 'overdue').length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('announcement')}
          style={{
            padding: '8px 12px',
            fontSize: '12.5px',
            fontWeight: activeTab === 'announcement' ? 600 : 500,
            borderBottom: activeTab === 'announcement' ? '2px solid var(--color-primary)' : '2px solid transparent',
            color: activeTab === 'announcement' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Announcements ({instituteNotifs.filter(n => n.type === 'announcement').length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('attendance')}
          style={{
            padding: '8px 12px',
            fontSize: '12.5px',
            fontWeight: activeTab === 'attendance' ? 600 : 500,
            borderBottom: activeTab === 'attendance' ? '2px solid var(--color-primary)' : '2px solid transparent',
            color: activeTab === 'attendance' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Attendance ({instituteNotifs.filter(n => n.type === 'attendance_alert').length})
        </button>
      </div>

      {/* Notifications List */}
      <div style={{ maxHeight: '380px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {filteredNotifs.length === 0 ? (
          <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '13px' }}>
            No notifications in this category.
          </div>
        ) : (
          filteredNotifs.map(notif => {
            const isFee = notif.type === 'fee_due' || notif.type === 'overdue';
            const isAnnouncement = notif.type === 'announcement';
            const isAttendance = notif.type === 'attendance_alert';

            return (
              <div
                key={notif.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  backgroundColor: notif.read ? '#ffffff' : '#f0f9ff',
                  border: `1px solid ${notif.read ? 'var(--color-border)' : '#bae6fd'}`,
                  borderRadius: 'var(--radius-md)',
                  transition: 'background-color 0.15s ease',
                  gap: '12px',
                }}
              >
                {/* Icon Column */}
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: isFee ? '#fef2f2' : isAnnouncement ? '#eff6ff' : '#ecfdf5',
                    color: isFee ? '#dc2626' : isAnnouncement ? '#2563eb' : '#059669',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '2px',
                  }}
                >
                  {isFee ? (
                    <IndianRupee size={16} />
                  ) : isAnnouncement ? (
                    <Megaphone size={16} />
                  ) : isAttendance ? (
                    <CalendarCheck size={16} />
                  ) : (
                    <Bell size={16} />
                  )}
                </div>

                {/* Content Column */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '3px' }}>
                    <strong style={{ fontSize: '13px', color: '#0f172a' }}>{notif.title}</strong>
                    {notif.priority === 'high' && (
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          backgroundColor: '#fef2f2',
                          color: '#dc2626',
                          border: '1px solid #fecaca',
                          padding: '1px 5px',
                          borderRadius: '3px',
                        }}
                      >
                        IMPORTANT
                      </span>
                    )}
                    {!notif.read && (
                      <span
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          backgroundColor: '#2563eb',
                          display: 'inline-block',
                        }}
                      />
                    )}
                  </div>

                  <p style={{ margin: '0 0 6px 0', fontSize: '12.5px', color: '#334155', lineHeight: 1.4 }}>
                    {notif.message}
                  </p>

                  <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                    {notif.createdAt}
                  </span>
                </div>

                {/* Actions Column */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                  {notif.actionUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      icon={<ExternalLink size={12} />}
                      onClick={() => handleActionClick(notif)}
                    >
                      View
                    </Button>
                  )}

                  <button
                    type="button"
                    onClick={() => markNotificationRead(notif.id)}
                    title={notif.read ? 'Mark as Unread' : 'Mark as Read'}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: '4px',
                      cursor: 'pointer',
                      color: notif.read ? '#94a3b8' : 'var(--color-primary)',
                    }}
                  >
                    <CheckCheck size={16} />
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteNotification(notif.id)}
                    title="Dismiss Notification"
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: '4px',
                      cursor: 'pointer',
                      color: '#94a3b8',
                    }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </Modal>
  );
};