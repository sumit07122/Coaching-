import React from 'react';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  children,
  icon,
  className = '',
}) => {
  return (
    <span className={`badge badge-${variant} ${className}`}>
      {icon && <span style={{ display: 'inline-flex', alignItems: 'center' }}>{icon}</span>}
      {children}
    </span>
  );
};

export const FeeStatusBadge: React.FC<{ status: 'paid' | 'partial' | 'overdue' }> = ({ status }) => {
  if (status === 'paid') {
    return <Badge variant="success">Fully Paid</Badge>;
  }
  if (status === 'partial') {
    return <Badge variant="warning">Partial Dues</Badge>;
  }
  return <Badge variant="danger">Overdue</Badge>;
};

export const AttendanceStatusBadge: React.FC<{ status: 'present' | 'absent' | 'late' }> = ({ status }) => {
  if (status === 'present') {
    return <Badge variant="success">Present</Badge>;
  }
  if (status === 'late') {
    return <Badge variant="warning">Late</Badge>;
  }
  return <Badge variant="danger">Absent</Badge>;
};
