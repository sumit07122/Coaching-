import React, { useState } from 'react';
import {
  CreditCard,
  Edit3,
  CheckCircle2,
  AlertCircle,
  Shield,
  Layers,
  Sparkles,
  Calendar,
  Lock,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PlatformInstituteRecord, CommercialSubscription } from '../../types';
import { Card, CardHeader, CardBody } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';

const STANDARD_MODULES = [
  { key: 'students', label: 'Students & Admissions' },
  { key: 'batches', label: 'Batches & Courses' },
  { key: 'attendance', label: 'Attendance Engine' },
  { key: 'fees', label: 'Fees & Receipts' },
  { key: 'expenses', label: 'Expense Management' },
  { key: 'timetable', label: 'Timetable & Classrooms' },
  { key: 'reports', label: 'Reports & Analytics' },
  { key: 'staff', label: 'Staff & Faculty Management' },
  { key: 'sms', label: 'WhatsApp / SMS Reminders' },
];

export const SuperAdminSubscriptions: React.FC = () => {
  const { platformInstitutes, updateInstituteCommercialPlan } = useApp();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [targetInstitute, setTargetInstitute] = useState<PlatformInstituteRecord | null>(null);

  // Form State for Editing Subscription
  const [editPlanName, setEditPlanName] = useState('');
  const [editStudentLimit, setEditStudentLimit] = useState(100);
  const [editStatus, setEditStatus] = useState<CommercialSubscription['status']>('active');
  const [editBillingCycle, setEditBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [editRecurringAmount, setEditRecurringAmount] = useState(1499);
  const [editRenewalDate, setEditRenewalDate] = useState('');
  const [editModules, setEditModules] = useState<string[]>([]);
  const [auditReason, setAuditReason] = useState('');
  const [formError, setFormError] = useState('');

  const handleOpenEdit = (inst: PlatformInstituteRecord) => {
    const sub = inst.subscription;
    setTargetInstitute(inst);
    setEditPlanName(sub?.planName || 'Growth Plan');
    setEditStudentLimit(sub?.studentLimit || 100);
    setEditStatus(sub?.subscriptionStatus || sub?.status || 'active');
    setEditBillingCycle(sub?.billingCycle || 'monthly');
    setEditRecurringAmount(sub?.recurringAmount || 1499);
    setEditRenewalDate(sub?.renewalDate || new Date().toISOString().split('T')[0]);
    setEditModules(sub?.enabledModules || ['students', 'batches', 'attendance', 'fees']);
    setAuditReason('');
    setFormError('');
    setIsEditModalOpen(true);
  };

  const handleToggleModule = (modKey: string) => {
    setEditModules(prev =>
      prev.includes(modKey) ? prev.filter(m => m !== modKey) : [...prev, modKey]
    );
  };

  const handleSaveSubscription = (e: React.FormEvent) => {
    e.preventDefault();
    if (!auditReason.trim()) {
      setFormError('Mandatory administrative reason required for audit compliance.');
      return;
    }

    if (targetInstitute) {
      updateInstituteCommercialPlan(
        targetInstitute.id,
        {
          planName: editPlanName.trim(),
          studentLimit: Number(editStudentLimit),
          status: editStatus,
          subscriptionStatus: editStatus,
          billingCycle: editBillingCycle,
          recurringAmount: Number(editRecurringAmount),
          renewalDate: editRenewalDate,
          enabledModules: editModules,
        },
        auditReason.trim()
      );
      setIsEditModalOpen(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Header */}
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0', letterSpacing: '-0.5px' }}>
          Subscription & Student Quota Management
        </h1>
        <p style={{ fontSize: '13.5px', color: '#64748b', margin: 0 }}>
          Configure SaaS subscription tiers, adjust student quota caps, configure module entitlements, and govern commercial models.
        </p>
      </div>

      {/* Commercial Plans Blueprint Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        <div style={{ padding: '18px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#4f46e5', textTransform: 'uppercase' }}>Starter</span>
            <span className="sa-badge sa-badge-model">Model A</span>
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>₹999 / mo</div>
          <div style={{ fontSize: '12.5px', color: '#64748b', margin: '4px 0 12px 0' }}>Up to 100 Students</div>
          <div style={{ fontSize: '12px', color: '#475569', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div>• Core Student & Batch Management</div>
            <div>• Attendance Engine</div>
            <div>• Offline / Local Sync</div>
          </div>
        </div>

        <div style={{ padding: '18px', backgroundColor: '#ffffff', border: '2px solid #4f46e5', borderRadius: '10px', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#4f46e5', textTransform: 'uppercase' }}>Growth (Popular)</span>
            <span className="sa-badge sa-badge-model">Model A</span>
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>₹1,999 / mo</div>
          <div style={{ fontSize: '12.5px', color: '#64748b', margin: '4px 0 12px 0' }}>Up to 250 Students</div>
          <div style={{ fontSize: '12px', color: '#475569', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div>• All Starter Features</div>
            <div>• Fee Receipts & Ledger</div>
            <div>• Expense Management & P&L</div>
            <div>• Timetable & Classrooms</div>
          </div>
        </div>

        <div style={{ padding: '18px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#0284c7', textTransform: 'uppercase' }}>One-Time Perpetual</span>
            <span className="sa-badge sa-badge-model">Model B</span>
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>₹49,999</div>
          <div style={{ fontSize: '12.5px', color: '#64748b', margin: '4px 0 12px 0' }}>Up to 500 Students</div>
          <div style={{ fontSize: '12px', color: '#475569', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div>• Lifetime Software License</div>
            <div>• Hardware-bound Offline Mode</div>
            <div>• Source code strictly non-transferred</div>
          </div>
        </div>

        <div style={{ padding: '18px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#059669', textTransform: 'uppercase' }}>Custom Enterprise</span>
            <span className="sa-badge sa-badge-model">Model C</span>
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>Custom Quote</div>
          <div style={{ fontSize: '12.5px', color: '#64748b', margin: '4px 0 12px 0' }}>Unlimited Students</div>
          <div style={{ fontSize: '12px', color: '#475569', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div>• Dedicated Cloud Infrastructure</div>
            <div>• Custom Feature Milestones</div>
            <div>• SLA & 24/7 Dedicated Account Lead</div>
          </div>
        </div>
      </div>

      {/* Subscriptions Table Card */}
      <Card>
        <CardHeader
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CreditCard size={18} style={{ color: '#4f46e5' }} />
              <span style={{ fontSize: '16px', fontWeight: 700 }}>Institute Commercial Subscriptions</span>
            </div>
          }
          subtitle="Institute owners have read-only access to their quotas; changes can only be enacted by Super Admin"
        />

        <div className="sa-table-container" style={{ border: 'none', borderRadius: 0 }}>
          <table className="sa-table">
            <thead>
              <tr>
                <th>Institute</th>
                <th>Model</th>
                <th>Plan Name</th>
                <th>Quota Limit</th>
                <th>Current Usage</th>
                <th>Billing</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {platformInstitutes.map(inst => {
                const sub = inst.subscription;
                const limit = sub?.studentLimit || 100;
                const ratio = Math.round(((inst.studentCount || 0) / limit) * 100);

                return (
                  <tr key={inst.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{inst.name}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{inst.id}</div>
                    </td>
                    <td>
                      <span className="sa-badge sa-badge-model">
                        {sub?.modelType === 'saas_subscription'
                          ? 'SaaS'
                          : sub?.modelType === 'one_time_licence'
                          ? 'Perpetual'
                          : 'Custom'}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{sub?.planName}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        Modules: {sub?.enabledModules?.length || 4} enabled
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '13.5px' }}>
                        {limit} Students
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div className="sa-quota-bar">
                          <div
                            className={`sa-quota-fill ${ratio > 90 ? 'danger' : ratio > 75 ? 'warn' : ''}`}
                            style={{ width: `${Math.min(ratio, 100)}%` }}
                          />
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: 600 }}>
                          {inst.studentCount} ({ratio}%)
                        </span>
                      </div>
                    </td>
                    <td>
                      {sub?.modelType === 'saas_subscription' ? (
                        <div>
                          <div>₹{sub.recurringAmount || 1499} / {sub.billingCycle || 'mo'}</div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>Renews: {sub.renewalDate || 'N/A'}</div>
                        </div>
                      ) : (
                        <div>
                          <div>One-Time Paid</div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>Key: {sub?.licenceKey?.substring(0, 14) || 'Issued'}...</div>
                        </div>
                      )}
                    </td>
                    <td>
                      <span
                        className={`sa-badge ${
                          sub?.subscriptionStatus === 'active' || sub?.status === 'active'
                            ? 'sa-badge-active'
                            : sub?.subscriptionStatus === 'trial' || sub?.status === 'trial'
                            ? 'sa-badge-trial'
                            : 'sa-badge-suspended'
                        }`}
                      >
                        {sub?.subscriptionStatus || sub?.status || 'active'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Button
                        variant="outline"
                        size="sm"
                        icon={<Edit3 size={13} />}
                        onClick={() => handleOpenEdit(inst)}
                      >
                        Modify Quota
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Edit Subscription Modal */}
      {isEditModalOpen && targetInstitute && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title={`Modify Subscription & Quota: ${targetInstitute.name}`}
          size="large"
          footer={
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSaveSubscription}>
                Save Subscription & Quota
              </Button>
            </div>
          }
        >
          <form onSubmit={handleSaveSubscription} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {formError && (
              <div style={{ padding: '10px 14px', backgroundColor: '#fef2f2', color: '#dc2626', borderRadius: '6px', fontSize: '13px' }}>
                {formError}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px' }}>
                  Plan Name
                </label>
                <input
                  type="text"
                  value={editPlanName}
                  onChange={e => setEditPlanName(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px' }}>
                  Authorized Student Quota Limit *
                </label>
                <input
                  type="number"
                  min="10"
                  max="10000"
                  value={editStudentLimit}
                  onChange={e => setEditStudentLimit(Number(e.target.value))}
                  required
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                  PostgreSQL database trigger enforces this barrier on student admissions.
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px' }}>
                  Subscription Status
                </label>
                <select
                  value={editStatus}
                  onChange={e => setEditStatus(e.target.value as any)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                >
                  <option value="active">Active (Paid)</option>
                  <option value="trial">Trial (Evaluation)</option>
                  <option value="past_due">Past Due (Dunning)</option>
                  <option value="canceled">Canceled</option>
                  <option value="expired">Expired</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px' }}>
                  Renewal / Expiry Date
                </label>
                <input
                  type="date"
                  value={editRenewalDate}
                  onChange={e => setEditRenewalDate(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px' }}>
                  Billing Cycle
                </label>
                <select
                  value={editBillingCycle}
                  onChange={e => setEditBillingCycle(e.target.value as any)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                >
                  <option value="monthly">Monthly</option>
                  <option value="annual">Annual</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px' }}>
                  Recurring Fee (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={editRecurringAmount}
                  onChange={e => setEditRecurringAmount(Number(e.target.value))}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '4px 0' }} />

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '8px' }}>
                Feature Module Entitlements
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
                {STANDARD_MODULES.map(m => (
                  <label
                    key={m.key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 10px',
                      backgroundColor: editModules.includes(m.key) ? '#eff6ff' : '#f8fafc',
                      border: editModules.includes(m.key) ? '1px solid #bfdbfe' : '1px solid #e2e8f0',
                      borderRadius: '6px',
                      fontSize: '12.5px',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={editModules.includes(m.key)}
                      onChange={() => handleToggleModule(m.key)}
                    />
                    <span>{m.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '4px 0' }} />

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px' }}>
                Administrative Reason for Change (Mandatory Audit Trail) *
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Approved expansion to 250 students upon receipt of upgraded annual SaaS invoice."
                value={auditReason}
                onChange={e => setAuditReason(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
