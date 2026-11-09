import React, { useState } from 'react';
import {
  Building2,
  Plus,
  Search,
  Filter,
  Eye,
  Power,
  ShieldCheck,
  AlertTriangle,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Users,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PlatformInstituteRecord, CoachingCategory, CommercialModelType } from '../../types';
import { Card, CardHeader, CardBody } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';

export const SuperAdminInstitutes: React.FC = () => {
  const {
    platformInstitutes,
    createPlatformInstitute,
    updateInstituteStatus,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'trial' | 'suspended'>('all');
  const [selectedInstitute, setSelectedInstitute] = useState<PlatformInstituteRecord | null>(null);

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [statusActionTarget, setStatusActionTarget] = useState<PlatformInstituteRecord | null>(null);
  const [targetNewStatus, setTargetNewStatus] = useState<'active' | 'suspended' | 'trial'>('active');
  const [statusChangeReason, setStatusChangeReason] = useState('');
  const [statusError, setStatusError] = useState('');

  // Form State for Creating New Institute
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<CoachingCategory>('academic_k12');
  const [formCity, setFormCity] = useState('');
  const [formState, setFormState] = useState('Uttar Pradesh');
  const [formDirectorName, setFormDirectorName] = useState('');
  const [formDirectorEmail, setFormDirectorEmail] = useState('');
  const [formDirectorPhone, setFormDirectorPhone] = useState('');
  const [formPlanName, setFormPlanName] = useState('Growth Plan (Up to 100 Students)');
  const [formModelType, setFormModelType] = useState<CommercialModelType>('saas_subscription');
  const [formStudentLimit, setFormStudentLimit] = useState(100);
  const [formRecurringAmount, setFormRecurringAmount] = useState(1499);
  const [createError, setCreateError] = useState('');

  // Filtered List
  const filteredInstitutes = platformInstitutes.filter(inst => {
    const matchesSearch =
      inst.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inst.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inst.directorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inst.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inst.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || inst.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOpenStatusModal = (inst: PlatformInstituteRecord, newStatus: 'active' | 'suspended' | 'trial') => {
    setStatusActionTarget(inst);
    setTargetNewStatus(newStatus);
    setStatusChangeReason('');
    setStatusError('');
    setIsStatusModalOpen(true);
  };

  const handleConfirmStatusChange = () => {
    if (!statusChangeReason.trim()) {
      setStatusError('Mandatory administrative reason required for audit compliance.');
      return;
    }
    if (statusActionTarget) {
      updateInstituteStatus(statusActionTarget.id, targetNewStatus, statusChangeReason.trim());
      setIsStatusModalOpen(false);
      if (selectedInstitute?.id === statusActionTarget.id) {
        setSelectedInstitute(prev => (prev ? { ...prev, status: targetNewStatus } : null));
      }
    }
  };

  const handleCreateInstitute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formCity.trim() || !formDirectorName.trim() || !formDirectorEmail.trim()) {
      setCreateError('Please complete all mandatory institute and director fields.');
      return;
    }

    createPlatformInstitute({
      name: formName.trim(),
      category: formCategory,
      city: formCity.trim(),
      state: formState.trim(),
      directorName: formDirectorName.trim(),
      directorEmail: formDirectorEmail.trim(),
      directorPhone: formDirectorPhone.trim() || '+91 98000 00000',
      planName: formPlanName,
      modelType: formModelType,
      studentLimit: Number(formStudentLimit),
      recurringAmount: Number(formRecurringAmount),
      status: 'active',
    });

    setIsCreateModalOpen(false);
    // Reset form
    setFormName('');
    setFormCity('');
    setFormDirectorName('');
    setFormDirectorEmail('');
    setFormDirectorPhone('');
    setCreateError('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0', letterSpacing: '-0.5px' }}>
            Institutes & Multi-Tenancy Management
          </h1>
          <p style={{ fontSize: '13.5px', color: '#64748b', margin: 0 }}>
            Provision, monitor student capacity, view owner details, and administer institute lifecycle states.
          </p>
        </div>

        <Button
          variant="primary"
          icon={<Plus size={16} />}
          onClick={() => setIsCreateModalOpen(true)}
        >
          Provision New Institute
        </Button>
      </div>

      {/* Main Table Card */}
      <Card>
        <CardHeader
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building2 size={18} style={{ color: '#4f46e5' }} />
              <span style={{ fontSize: '16px', fontWeight: 700 }}>Tenant Coaching Institutes</span>
              <span className="badge badge-default" style={{ fontSize: '12px' }}>
                {filteredInstitutes.length} of {platformInstitutes.length}
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
                  placeholder="Search by name, city, director..."
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
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as any)}
                style={{
                  height: '36px',
                  padding: '0 10px',
                  fontSize: '13px',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border)',
                  backgroundColor: '#ffffff',
                }}
              >
                <option value="all">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="trial">Trial Only</option>
                <option value="suspended">Suspended Only</option>
              </select>
            </div>
          }
        />

        <div className="sa-table-container" style={{ border: 'none', borderRadius: 0 }}>
          <table className="sa-table">
            <thead>
              <tr>
                <th>Institute Details</th>
                <th>Director & Contact</th>
                <th>Commercial Model</th>
                <th>Student Quota Usage</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInstitutes.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                    No coaching institutes match the selected filter criteria.
                  </td>
                </tr>
              ) : (
                filteredInstitutes.map(inst => {
                  const limit = inst.subscription?.studentLimit || 100;
                  const ratio = Math.round(((inst.studentCount || 0) / limit) * 100);

                  return (
                    <tr key={inst.id}>
                      <td>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{inst.name}</div>
                        <div style={{ fontSize: '11.5px', color: '#64748b', display: 'flex', gap: '8px' }}>
                          <span>ID: {inst.id}</span>
                          <span>•</span>
                          <span>{inst.city}, {inst.state}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{inst.directorName}</div>
                        <div style={{ fontSize: '11.5px', color: '#64748b' }}>{inst.email}</div>
                      </td>
                      <td>
                        <span className="sa-badge sa-badge-model" style={{ marginBottom: '4px' }}>
                          {inst.subscription?.modelType === 'saas_subscription'
                            ? 'Model A (SaaS)'
                            : inst.subscription?.modelType === 'one_time_licence'
                            ? 'Model B (License)'
                            : 'Model C (Custom)'}
                        </span>
                        <div style={{ fontSize: '12px', color: '#334155' }}>{inst.subscription?.planName}</div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div className="sa-quota-bar">
                            <div
                              className={`sa-quota-fill ${ratio > 90 ? 'danger' : ratio > 75 ? 'warn' : ''}`}
                              style={{ width: `${Math.min(ratio, 100)}%` }}
                            />
                          </div>
                          <span style={{ fontSize: '12px', fontWeight: 600 }}>
                            {inst.studentCount} / {limit}
                          </span>
                        </div>
                        {ratio >= 80 && (
                          <div style={{ fontSize: '11px', color: ratio >= 100 ? '#dc2626' : '#d97706', fontWeight: 600, marginTop: '2px' }}>
                            {ratio >= 100 ? 'Quota Full (Blocks Admissions)' : 'Approaching Plan Limit (>80%)'}
                          </div>
                        )}
                      </td>
                      <td>
                        <span
                          className={`sa-badge ${
                            inst.status === 'active'
                              ? 'sa-badge-active'
                              : inst.status === 'trial'
                              ? 'sa-badge-trial'
                              : 'sa-badge-suspended'
                          }`}
                        >
                          {inst.status}
                        </span>
                        {inst.status === 'suspended' && inst.suspensionReason && (
                          <div style={{ fontSize: '10.5px', color: '#b91c1c', maxWidth: '140px', marginTop: '2px', lineHeight: 1.2 }}>
                            {inst.suspensionReason}
                          </div>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <Button
                            variant="outline"
                            size="sm"
                            icon={<Eye size={13} />}
                            onClick={() => setSelectedInstitute(inst)}
                          >
                            Details
                          </Button>

                          {inst.status === 'active' || inst.status === 'trial' ? (
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleOpenStatusModal(inst, 'suspended')}
                            >
                              Suspend
                            </Button>
                          ) : (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleOpenStatusModal(inst, 'active')}
                            >
                              Activate
                            </Button>
                          )}
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

      {/* Institute Details Drawer / Modal */}
      {selectedInstitute && (
        <Modal
          isOpen={!!selectedInstitute}
          onClose={() => setSelectedInstitute(null)}
          title={`Institute Overview: ${selectedInstitute.name}`}
          size="large"
          footer={
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
              <div>
                {selectedInstitute.status === 'active' ? (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      const target = selectedInstitute;
                      setSelectedInstitute(null);
                      handleOpenStatusModal(target, 'suspended');
                    }}
                  >
                    Suspend Institute Account
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      const target = selectedInstitute;
                      setSelectedInstitute(null);
                      handleOpenStatusModal(target, 'active');
                    }}
                  >
                    Reactivate Institute Account
                  </Button>
                )}
              </div>
              <Button variant="outline" onClick={() => setSelectedInstitute(null)}>
                Close
              </Button>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Quick Banner */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px',
                backgroundColor: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
              }}
            >
              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 800 }}>{selectedInstitute.name}</h3>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                  {selectedInstitute.tagline || 'Registered Coaching Institute'}
                </p>
              </div>
              <span
                className={`sa-badge ${
                  selectedInstitute.status === 'active'
                    ? 'sa-badge-active'
                    : selectedInstitute.status === 'trial'
                    ? 'sa-badge-trial'
                    : 'sa-badge-suspended'
                }`}
                style={{ fontSize: '13px', padding: '5px 12px' }}
              >
                {selectedInstitute.status.toUpperCase()}
              </span>
            </div>

            {/* Grid of info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ padding: '16px', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 12px 0', color: '#1e293b' }}>
                  Tenant Metadata & Contact
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                  <div><strong>Tenant ID:</strong> <code>{selectedInstitute.id}</code></div>
                  <div><strong>Reg Number:</strong> {selectedInstitute.regNumber}</div>
                  <div><strong>Academic Session:</strong> {selectedInstitute.academicSession}</div>
                  <div><strong>Director:</strong> {selectedInstitute.directorName}</div>
                  <div><strong>Email:</strong> {selectedInstitute.email}</div>
                  <div><strong>Phone:</strong> {selectedInstitute.phone}</div>
                  <div><strong>Location:</strong> {selectedInstitute.city}, {selectedInstitute.state}</div>
                </div>
              </div>

              <div style={{ padding: '16px', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 12px 0', color: '#1e293b' }}>
                  Commercial Plan & Capacity
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                  <div><strong>Model Type:</strong> {selectedInstitute.subscription?.modelType}</div>
                  <div><strong>Plan Name:</strong> {selectedInstitute.subscription?.planName}</div>
                  <div><strong>Student Quota Limit:</strong> {selectedInstitute.subscription?.studentLimit || 100} students</div>
                  <div><strong>Enrolled Active:</strong> {selectedInstitute.studentCount} students</div>
                  <div><strong>Batches:</strong> {selectedInstitute.batchCount} active cohorts</div>
                  <div><strong>Renewal / Expiry:</strong> {selectedInstitute.subscription?.renewalDate || 'N/A'}</div>
                  <div><strong>Hosting:</strong> {selectedInstitute.subscription?.hostingResponsibility || 'FIXIA Cloud'}</div>
                </div>
              </div>
            </div>

            {selectedInstitute.status === 'suspended' && (
              <div
                style={{
                  padding: '12px 16px',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  color: '#991b1b',
                  fontSize: '13px',
                }}
              >
                <strong>Suspension Audit Reason:</strong> {selectedInstitute.suspensionReason || 'Account suspended by platform admin.'}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Provision New Institute Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Provision New Coaching Institute"
        size="large"
        footer={
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreateInstitute}>
              Provision Tenant Institute
            </Button>
          </div>
        }
      >
        <form onSubmit={handleCreateInstitute} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {createError && (
            <div style={{ padding: '10px 14px', backgroundColor: '#fef2f2', color: '#dc2626', borderRadius: '6px', fontSize: '13px' }}>
              {createError}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px' }}>
                Institute Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Apex IIT-JEE Academy"
                value={formName}
                onChange={e => setFormName(e.target.value)}
                required
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px' }}>
                Coaching Category
              </label>
              <select
                value={formCategory}
                onChange={e => setFormCategory(e.target.value as any)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
              >
                <option value="academic_k12">School Academic (Class 9-12 CBSE/ICSE)</option>
                <option value="engineering_medical">Engineering & Medical (JEE / NEET)</option>
                <option value="commerce_professional">Commerce & Professional (CA/CS/CMA)</option>
                <option value="skills_languages">Skills & Spoken English</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px' }}>
                City *
              </label>
              <input
                type="text"
                placeholder="e.g. Varanasi"
                value={formCity}
                onChange={e => setFormCity(e.target.value)}
                required
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px' }}>
                State
              </label>
              <input
                type="text"
                value={formState}
                onChange={e => setFormState(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
              />
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '4px 0' }} />

          <h4 style={{ fontSize: '13.5px', fontWeight: 700, margin: '0', color: '#1e293b' }}>
            Director & Primary Owner Credentials
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px' }}>
                Director Full Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Dr. Rajesh Mishra"
                value={formDirectorName}
                onChange={e => setFormDirectorName(e.target.value)}
                required
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px' }}>
                Director Official Email *
              </label>
              <input
                type="email"
                placeholder="director@apexacademy.org"
                value={formDirectorEmail}
                onChange={e => setFormDirectorEmail(e.target.value)}
                required
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px' }}>
                Director Phone Number
              </label>
              <input
                type="tel"
                placeholder="+91 98390 11223"
                value={formDirectorPhone}
                onChange={e => setFormDirectorPhone(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px' }}>
                Commercial Model
              </label>
              <select
                value={formModelType}
                onChange={e => setFormModelType(e.target.value as any)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
              >
                <option value="saas_subscription">Model A: SaaS Subscription</option>
                <option value="one_time_licence">Model B: One-Time License</option>
                <option value="custom_development">Model C: Custom Development</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px' }}>
                Plan Name
              </label>
              <input
                type="text"
                value={formPlanName}
                onChange={e => setFormPlanName(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px' }}>
                Initial Student Quota Limit
              </label>
              <input
                type="number"
                min="10"
                max="5000"
                value={formStudentLimit}
                onChange={e => setFormStudentLimit(Number(e.target.value))}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* Status Modification (Activate / Suspend) Reason Modal */}
      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        title={`${targetNewStatus === 'suspended' ? 'Suspend' : 'Activate'} Institute: ${statusActionTarget?.name}`}
        size="normal"
        footer={
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <Button variant="outline" onClick={() => setIsStatusModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={targetNewStatus === 'suspended' ? 'danger' : 'primary'}
              onClick={handleConfirmStatusChange}
            >
              Confirm {targetNewStatus === 'suspended' ? 'Suspension' : 'Activation'}
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <p style={{ fontSize: '13.5px', color: '#475569', margin: 0 }}>
            {targetNewStatus === 'suspended'
              ? 'Suspending an institute immediately halts student admissions and blocks owner portal login until reinstated.'
              : 'Reactivating this institute will immediately restore portal access and academic operations.'}
          </p>

          {statusError && (
            <div style={{ padding: '8px 12px', backgroundColor: '#fef2f2', color: '#dc2626', borderRadius: '6px', fontSize: '12.5px' }}>
              {statusError}
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px' }}>
              Administrative Reason *
            </label>
            <textarea
              rows={3}
              placeholder={
                targetNewStatus === 'suspended'
                  ? 'e.g. Monthly SaaS renewal overdue by 45 days. Three dunning reminders ignored.'
                  : 'e.g. Account reinstated after wire transfer verification of outstanding invoice.'
              }
              value={statusChangeReason}
              onChange={e => setStatusChangeReason(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};
