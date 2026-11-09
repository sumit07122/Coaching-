import React, { useState } from 'react';
import {
  FileText,
  Filter,
  Download,
  Shield,
  Search,
  Calendar,
  User,
  Building,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PlatformAuditAction } from '../../types';
import { Card, CardHeader, CardBody } from '../../components/common/Card';
import { Button } from '../../components/common/Button';

export const SuperAdminAudit: React.FC = () => {
  const { platformAuditLogs } = useApp();
  const [selectedAction, setSelectedAction] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLogs = platformAuditLogs.filter(log => {
    const matchesAction = selectedAction === 'ALL' || log.action === selectedAction;
    const matchesSearch =
      log.targetInstituteName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.targetInstituteId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.actorEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.reason.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesAction && matchesSearch;
  });

  const handleExportCSV = () => {
    const headers = ['Log ID', 'Timestamp', 'Action', 'Target Institute', 'Institute ID', 'Actor Email', 'Reason', 'Details'];
    const rows = filteredLogs.map(l => [
      l.id,
      l.timestamp,
      l.action,
      `"${l.targetInstituteName.replace(/"/g, '""')}"`,
      l.targetInstituteId,
      l.actorEmail,
      `"${l.reason.replace(/"/g, '""')}"`,
      `"${JSON.stringify(l.details).replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fixia-platform-audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const getActionBadgeColor = (action: PlatformAuditAction) => {
    switch (action) {
      case 'CREATE_INSTITUTE':
        return { bg: '#ecfdf5', color: '#047857', border: '#a7f3d0' };
      case 'ACTIVATE_INSTITUTE':
        return { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' };
      case 'SUSPEND_INSTITUTE':
        return { bg: '#fef2f2', color: '#b91c1c', border: '#fecaca' };
      case 'UPDATE_QUOTA':
        return { bg: '#f5f3ff', color: '#6d28d9', border: '#ddd6fe' };
      case 'MODIFY_SUBSCRIPTION':
        return { bg: '#fffbeb', color: '#b45309', border: '#fde68a' };
      case 'ISSUE_LICENSE':
        return { bg: '#e0f2fe', color: '#0369a1', border: '#bae6fd' };
      case 'REVOKE_LICENSE':
        return { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' };
      default:
        return { bg: '#f1f5f9', color: '#475569', border: '#cbd5e1' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0', letterSpacing: '-0.5px' }}>
            Platform Governance Audit Logs
          </h1>
          <p style={{ fontSize: '13.5px', color: '#64748b', margin: 0 }}>
            Immutable administrative event ledger tracking quota modifications, tenant status transitions, and commercial licenses.
          </p>
        </div>

        <Button
          variant="outline"
          icon={<Download size={15} />}
          onClick={handleExportCSV}
          disabled={filteredLogs.length === 0}
        >
          Export Audit Trail (.csv)
        </Button>
      </div>

      {/* Main Table Card */}
      <Card>
        <CardHeader
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={18} style={{ color: '#4f46e5' }} />
              <span style={{ fontSize: '16px', fontWeight: 700 }}>Privileged Action History</span>
              <span className="badge badge-default" style={{ fontSize: '12px' }}>
                {filteredLogs.length} Records
              </span>
            </div>
          }
          action={
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ position: 'relative', minWidth: '220px' }}>
                <Search
                  size={15}
                  style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}
                />
                <input
                  type="text"
                  placeholder="Search logs by keyword..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{
                    height: '36px',
                    paddingLeft: '32px',
                    paddingRight: '12px',
                    fontSize: '13px',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border)',
                    outline: 'none',
                    width: '100%',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <select
                value={selectedAction}
                onChange={e => setSelectedAction(e.target.value)}
                style={{
                  height: '36px',
                  padding: '0 10px',
                  fontSize: '13px',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border)',
                  backgroundColor: '#ffffff',
                }}
              >
                <option value="ALL">All Actions</option>
                <option value="UPDATE_QUOTA">Quota Updates</option>
                <option value="SUSPEND_INSTITUTE">Suspensions</option>
                <option value="ACTIVATE_INSTITUTE">Activations</option>
                <option value="ISSUE_LICENSE">License Issuances</option>
                <option value="REVOKE_LICENSE">License Revocations</option>
                <option value="CREATE_INSTITUTE">Institute Creations</option>
              </select>
            </div>
          }
        />

        <div className="sa-table-container" style={{ border: 'none', borderRadius: 0 }}>
          <table className="sa-table">
            <thead>
              <tr>
                <th>Timestamp & ID</th>
                <th>Privileged Action</th>
                <th>Target Institute</th>
                <th>Super Admin Actor</th>
                <th>Audit Justification Reason</th>
                <th>Payload Diff</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                    No audit records match the current filters.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => {
                  const badgeStyle = getActionBadgeColor(log.action);
                  return (
                    <tr key={log.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>
                          {new Date(log.timestamp).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                          {new Date(log.timestamp).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                        <div style={{ fontSize: '10px', color: '#94a3b8', fontFamily: 'monospace' }}>
                          {log.id}
                        </div>
                      </td>
                      <td>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 700,
                            backgroundColor: badgeStyle.bg,
                            color: badgeStyle.color,
                            border: `1px solid ${badgeStyle.border}`,
                          }}
                        >
                          {log.action.replace('_', ' ')}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#1e293b' }}>{log.targetInstituteName}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{log.targetInstituteId}</div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px' }}>
                          <User size={13} style={{ color: '#4f46e5' }} />
                          <span style={{ fontWeight: 500 }}>{log.actorEmail}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '12.5px', color: '#334155', maxWidth: '320px', lineHeight: 1.4 }}>
                          {log.reason}
                        </div>
                      </td>
                      <td>
                        <div
                          style={{
                            backgroundColor: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            borderRadius: '6px',
                            padding: '6px 8px',
                            fontSize: '11px',
                            fontFamily: 'monospace',
                            color: '#475569',
                            maxWidth: '240px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                          title={JSON.stringify(log.details, null, 2)}
                        >
                          {JSON.stringify(log.details)}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
