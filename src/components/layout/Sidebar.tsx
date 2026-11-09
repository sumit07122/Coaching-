import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  CalendarCheck,
  CreditCard,
  BarChart3,
  Settings,
  UserCog,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { students, batches, instituteConfig } = useApp();
  const { currentUser } = useAuth();

  return (
    <>
      {isOpen && <div className="sidebar-backdrop" onClick={onClose} />}
      <aside className={`app-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="brand-logo-mark">F</div>
          <div className="brand-details">
            <span className="brand-title">FIXIA CoachingOS</span>
            <span className="brand-subtitle">{instituteConfig.name}</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <span className="nav-section-title">Operations</span>

          <NavLink
            to="/"
            end
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/students"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <Users size={18} />
            <span>Students</span>
            <span className="nav-badge-count">{students.length}</span>
          </NavLink>

          <NavLink
            to="/batches"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <GraduationCap size={18} />
            <span>Batches</span>
            <span className="nav-badge-count">{batches.length}</span>
          </NavLink>

          <NavLink
            to="/attendance"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <CalendarCheck size={18} />
            <span>Attendance</span>
          </NavLink>

          <span className="nav-section-title" style={{ marginTop: '12px' }}>
            Finance & Intelligence
          </span>

          <NavLink
            to="/fees"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <CreditCard size={18} />
            <span>Fees & Receipts</span>
            <span
              className="nav-badge-count"
              style={{
                backgroundColor: '#fef2f2',
                color: '#dc2626',
                border: '1px solid #fecaca',
              }}
            >
              Dues
            </span>
          </NavLink>

          <NavLink
            to="/reports"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <BarChart3 size={18} />
            <span>Reports & Exports</span>
          </NavLink>

          <span className="nav-section-title" style={{ marginTop: '12px' }}>
            Administration
          </span>

          <NavLink
            to="/staff"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <UserCog size={18} />
            <span>Staff & Faculty</span>
          </NavLink>

          <NavLink
            to="/settings"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <Settings size={18} />
            <span>Institute Settings</span>
          </NavLink>

          <span className="nav-section-title" style={{ marginTop: '12px' }}>
            Portals & Access
          </span>

          <NavLink
            to="/teacher"
            className="nav-item"
            onClick={onClose}
            style={{
              backgroundColor: '#eff6ff',
              color: '#2563eb',
              fontWeight: 600,
            }}
          >
            <GraduationCap size={18} />
            <span>Teacher Portal View</span>
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile-tile">
            <div className="user-avatar">
              {currentUser.name
                .split(' ')
                .map(n => n[0])
                .slice(0, 2)
                .join('')}
            </div>
            <div className="user-info">
              <span className="user-name">{currentUser.name}</span>
              <span className="user-role">{currentUser.roleTitle}</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
