import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  iconBgColor?: string;
  iconColor?: string;
  footerText?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  iconBgColor = '#eff6ff',
  iconColor = '#2563eb',
  footerText,
  onClick,
}) => {
  return (
    <div
      className="stat-card"
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div className="stat-card-top">
        <span className="stat-label">{label}</span>
        <div
          className="stat-icon-wrap"
          style={{ backgroundColor: iconBgColor, color: iconColor }}
        >
          {icon}
        </div>
      </div>
      <div className="stat-value">{value}</div>
      {footerText && <div className="stat-footer-text">{footerText}</div>}
    </div>
  );
};
