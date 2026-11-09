import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  GraduationCap,
  History,
  User,
  LogOut,
  ArrowLeftRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { DemoBanner } from './DemoBanner';

export const TeacherLayout: React.FC = () => {
  const { currentUser, logout, isOwner, isAdmin } = useAuth();
  const { instituteConfig } = useApp();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="teacher-layout-shell">
      <DemoBanner />

      {/* Header */}
      <header className="teacher-header">
        <div className="teacher-brand-group">
          <div className="teacher-logo-badge">F</div>
          <div className="teacher-header-titles">
            <span className="teacher-app-title">Teacher Class Portal</span>
            <span className="teacher-institute-title">{instituteConfig.name}</span>
          </div>

          {/* Desktop Navigation */}
          <nav className="teacher-desktop-nav" aria-label="Teacher navigation">
            <NavLink
              to="/teacher"
              end
              className={({ isActive }) => `teacher-nav-link ${isActive ? 'active' : ''}`}
            >
              <LayoutDashboard size={18} />
              <span>Today's Classes</span>
            </NavLink>
            <NavLink
              to="/teacher/classes"
              className={({ isActive }) => `teacher-nav-link ${isActive ? 'active' : ''}`}
            >
              <GraduationCap size={18} />
              <span>My Batches</span>
            </NavLink>
            <NavLink
              to="/teacher/history"
              className={({ isActive }) => `teacher-nav-link ${isActive ? 'active' : ''}`}
            >
              <History size={18} />
              <span>Attendance History</span>
            </NavLink>
            <NavLink
              to="/teacher/profile"
              className={({ isActive }) => `teacher-nav-link ${isActive ? 'active' : ''}`}
            >
              <User size={18} />
              <span>Profile</span>
            </NavLink>
          </nav>
        </div>

        {/* Header Right Actions */}
        <div className="teacher-header-actions">
          {(isOwner || isAdmin) && (
            <button
              onClick={() => navigate('/')}
              className="teacher-nav-link"
              style={{
                backgroundColor: '#eff6ff',
                color: '#2563eb',
                border: '1px solid #bfdbfe',
                fontWeight: 600,
                cursor: 'pointer',
              }}
              title="Return to Owner & Administrative Portal"
            >
              <ArrowLeftRight size={16} />
              <span className="hide-on-mobile">Owner Portal</span>
            </button>
          )}

          <div className="teacher-profile-pill hide-on-mobile">
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: '50%',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {currentUser.name.charAt(0)}
            </div>
            <span>{currentUser.name}</span>
          </div>

          <button
            onClick={handleLogout}
            className="teacher-nav-link"
            style={{
              color: '#dc2626',
              cursor: 'pointer',
              minWidth: 44,
              justifyContent: 'center',
            }}
            title="Log out of Teacher Portal"
            aria-label="Log out"
          >
            <LogOut size={18} />
            <span className="hide-on-mobile">Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="teacher-main-container">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation Bar (min 48px touch targets) */}
      <nav className="teacher-bottom-nav" aria-label="Mobile teacher navigation">
        <NavLink
          to="/teacher"
          end
          className={({ isActive }) => `teacher-bottom-nav-item ${isActive ? 'active' : ''}`}
        >
          <LayoutDashboard size={20} />
          <span>Today</span>
        </NavLink>

        <NavLink
          to="/teacher/classes"
          className={({ isActive }) => `teacher-bottom-nav-item ${isActive ? 'active' : ''}`}
        >
          <GraduationCap size={20} />
          <span>Classes</span>
        </NavLink>

        <NavLink
          to="/teacher/history"
          className={({ isActive }) => `teacher-bottom-nav-item ${isActive ? 'active' : ''}`}
        >
          <History size={20} />
          <span>History</span>
        </NavLink>

        <NavLink
          to="/teacher/profile"
          className={({ isActive }) => `teacher-bottom-nav-item ${isActive ? 'active' : ''}`}
        >
          <User size={20} />
          <span>Profile</span>
        </NavLink>
      </nav>
    </div>
  );
};
