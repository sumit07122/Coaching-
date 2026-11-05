import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  UserCog,
  Plus,
  Mail,
  Phone,
  Shield,
  GraduationCap,
  Edit2,
  Trash2,
  CheckCircle,
  AlertCircle,
  Calendar,
  UserCheck,
  UserX,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Card, CardHeader, CardBody } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Badge } from '../components/common/Badge';
import { StaffMember } from '../types';

// Zod Schema for Staff Member validation
const staffSchema = z.object({
  name: z.string().min(3, 'Full name must be at least 3 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(10, 'Please enter a valid 10-digit mobile number'),
  role: z.enum(['owner', 'admin', 'faculty']),
  roleTitle: z.string().min(3, 'Designation / Title is required'),
  subjectsString: z.string().optional(),
  assignedBatchIds: z.array(z.string()).optional(),
  joiningDate: z.string().min(1, 'Joining date is required'),
});

type StaffFormData = z.infer<typeof staffSchema>;

export const Staff: React.FC = () => {
  const { staff, batches, addStaff, updateStaff, deleteStaff, toggleStaffStatus } = useApp();
  const { userRole } = useAuth();
  const canManageStaff = userRole === 'owner' || userRole === 'admin';

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('ALL');

  // React Hook Form setup with Zod resolver
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<StaffFormData>({
    resolver: zodResolver(staffSchema) as any,
    defaultValues: {
      name: '',
      email: '',
      phone: '+91 9',
      role: 'faculty',
      roleTitle: 'Faculty Instructor',
      subjectsString: '',
      assignedBatchIds: [],
      joiningDate: '2026-04-01',
    },
  });

  const selectedBatches = watch('assignedBatchIds') || [];

  const handleOpenAdd = () => {
    setEditingStaff(null);
    reset({
      name: '',
      email: '',
      phone: '+91 94120 ',
      role: 'faculty',
      roleTitle: 'Faculty Instructor',
      subjectsString: 'Physics, Mathematics',
      assignedBatchIds: [batches[0]?.id || ''],
      joiningDate: '2026-04-01',
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (member: StaffMember) => {
    setEditingStaff(member);
    reset({
      name: member.name,
      email: member.email,
      phone: member.phone,
      role: member.role,
      roleTitle: member.roleTitle,
      subjectsString: (member.subjects || []).join(', '),
      assignedBatchIds: member.assignedBatchIds,
      joiningDate: member.joiningDate,
    });
    setIsAddModalOpen(true);
  };

  const onSubmit = (data: StaffFormData) => {
    const subjects = data.subjectsString
      ? data.subjectsString.split(',').map(s => s.trim()).filter(Boolean)
      : [];

    if (editingStaff) {
      updateStaff(editingStaff.id, {
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: data.role,
        roleTitle: data.roleTitle,
        subjects,
        assignedBatchIds: data.assignedBatchIds || [],
        joiningDate: data.joiningDate,
      });
    } else {
      addStaff({
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: data.role,
        roleTitle: data.roleTitle,
        subjects,
        assignedBatchIds: data.assignedBatchIds || [],
        joiningDate: data.joiningDate,
        status: 'active',
      });
    }

    setIsAddModalOpen(false);
    setEditingStaff(null);
  };

  const handleDelete = (id: string, name: string) => {
    if (staff.length <= 1) {
      alert('Cannot delete the sole administrator profile.');
      return;
    }
    if (window.confirm(`Are you sure you want to remove staff member "${name}"?`)) {
      deleteStaff(id);
    }
  };

  const filteredStaff = staff.filter(m => {
    if (selectedRoleFilter !== 'ALL' && m.role !== selectedRoleFilter) {
      return false;
    }
    return true;
  });

  return (
    <div className="staff-page">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1>Staff & Faculty Directory</h1>
          <p>
            Manage institute operators, coordinators, instructors, and batch assignments
          </p>
        </div>

        <div className="page-actions-group">
          {canManageStaff && (
            <Button variant="primary" icon={<Plus size={16} />} onClick={handleOpenAdd}>
              Add Staff Member
            </Button>
          )}
        </div>
      </div>

      {/* Filter and Overview Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '16px',
          marginBottom: '20px',
        }}
      >
        <div
          onClick={() => setSelectedRoleFilter('ALL')}
          style={{
            padding: '14px 18px',
            backgroundColor: selectedRoleFilter === 'ALL' ? '#eff6ff' : '#ffffff',
            border: selectedRoleFilter === 'ALL' ? '2px solid #2563eb' : '1px solid var(--color-border)',
            borderRadius: '8px',
            cursor: 'pointer',
          }}
        >
          <span style={{ fontSize: '11.5px', color: 'var(--color-text-muted)', display: 'block' }}>
            Total Institute Team
          </span>
          <strong style={{ fontSize: '20px' }}>{staff.length} Members</strong>
        </div>

        <div
          onClick={() => setSelectedRoleFilter('faculty')}
          style={{
            padding: '14px 18px',
            backgroundColor: selectedRoleFilter === 'faculty' ? '#eff6ff' : '#ffffff',
            border: selectedRoleFilter === 'faculty' ? '2px solid #2563eb' : '1px solid var(--color-border)',
            borderRadius: '8px',
            cursor: 'pointer',
          }}
        >
          <span style={{ fontSize: '11.5px', color: 'var(--color-text-muted)', display: 'block' }}>
            Teaching Faculty
          </span>
          <strong style={{ fontSize: '20px', color: '#1d4ed8' }}>
            {staff.filter(s => s.role === 'faculty').length} Teachers
          </strong>
        </div>

        <div
          onClick={() => setSelectedRoleFilter('admin')}
          style={{
            padding: '14px 18px',
            backgroundColor: selectedRoleFilter === 'admin' ? '#eff6ff' : '#ffffff',
            border: selectedRoleFilter === 'admin' ? '2px solid #2563eb' : '1px solid var(--color-border)',
            borderRadius: '8px',
            cursor: 'pointer',
          }}
        >
          <span style={{ fontSize: '11.5px', color: 'var(--color-text-muted)', display: 'block' }}>
            Front-Desk & Leadership
          </span>
          <strong style={{ fontSize: '20px', color: '#047857' }}>
            {staff.filter(s => s.role === 'owner' || s.role === 'admin').length} Operations
          </strong>
        </div>
      </div>

      {/* Staff Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Staff Member</th>
              <th>System Role</th>
              <th>Contact Details</th>
              <th>Assigned Batches</th>
              <th>Joining Date</th>
              <th>Status</th>
              <th style={{ textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStaff.map(member => {
              const assignedBatches = batches.filter(b => member.assignedBatchIds.includes(b.id));

              return (
                <tr key={member.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '34px',
                          height: '34px',
                          borderRadius: '50%',
                          backgroundColor: member.role === 'owner' ? '#dbeafe' : member.role === 'admin' ? '#d1fae5' : '#f3e8ff',
                          color: member.role === 'owner' ? '#1e40af' : member.role === 'admin' ? '#065f46' : '#6b21a8',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '12.5px',
                          flexShrink: 0,
                        }}
                      >
                        {member.name
                          .split(' ')
                          .map(n => n[0])
                          .slice(0, 2)
                          .join('')}
                      </div>

                      <div>
                        <strong style={{ fontSize: '13.5px' }}>{member.name}</strong>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                          {member.roleTitle}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td>
                    <Badge
                      variant={
                        member.role === 'owner'
                          ? 'primary'
                          : member.role === 'admin'
                          ? 'success'
                          : 'info'
                      }
                    >
                      {member.role.toUpperCase()}
                    </Badge>
                  </td>

                  <td>
                    <div style={{ fontSize: '12.5px' }}>{member.email}</div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                      {member.phone}
                    </div>
                  </td>

                  <td>
                    {assignedBatches.length === 0 ? (
                      <span style={{ fontSize: '11.5px', color: 'var(--color-text-muted)' }}>
                        All Batches (Admin)
                      </span>
                    ) : (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {assignedBatches.map(b => (
                          <span
                            key={b.id}
                            style={{
                              fontSize: '10.5px',
                              fontWeight: 600,
                              backgroundColor: '#f1f5f9',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              border: '1px solid #e2e8f0',
                            }}
                          >
                            {b.name.split('-')[0].trim()}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>

                  <td style={{ fontSize: '12.5px', color: 'var(--color-text-secondary)' }}>
                    {member.joiningDate}
                  </td>

                  <td>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '11.5px',
                        color: member.status === 'active' ? '#047857' : '#94a3b8',
                        fontWeight: 600,
                      }}
                    >
                      <span
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          backgroundColor: member.status === 'active' ? '#10b981' : '#94a3b8',
                        }}
                      />
                      {member.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </td>

                  <td style={{ textAlign: 'center' }}>
                    {canManageStaff ? (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-icon-only"
                          title="Edit Staff Member"
                          onClick={() => handleOpenEdit(member)}
                        >
                          <Edit2 size={13} />
                        </button>

                        <button
                          type="button"
                          className="btn btn-secondary btn-icon-only"
                          title={member.status === 'active' ? 'Deactivate Staff Member' : 'Activate Staff Member'}
                          onClick={() => {
                            const action = member.status === 'active' ? 'deactivate' : 'activate';
                            if (window.confirm(`Are you sure you want to ${action} staff member "${member.name}"?`)) {
                              toggleStaffStatus(member.id);
                            }
                          }}
                        >
                          {member.status === 'active' ? (
                            <UserX size={13} style={{ color: '#b91c1c' }} />
                          ) : (
                            <UserCheck size={13} style={{ color: '#047857' }} />
                          )}
                        </button>

                        {member.role !== 'owner' && (
                          <button
                            type="button"
                            className="btn btn-danger-outline btn-icon-only"
                            title="Remove Staff Member"
                            onClick={() => handleDelete(member.id, member.name)}
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    ) : (
                      <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Read-Only</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Staff Modal with React Hook Form + Zod */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={editingStaff ? `Edit Staff: ${editingStaff.name}` : 'Add New Staff Member'}
        size="large"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', width: '100%' }}>
            <Button variant="secondary" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmit(onSubmit)}>
              {editingStaff ? 'Update Member' : 'Save & Onboard Member'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label required">Full Name</label>
              <input
                type="text"
                className="form-input"
                {...register('name')}
                placeholder="e.g. Dr. Sunita Mishra"
              />
              {errors.name && <p className="form-error">{errors.name.message}</p>}
            </div>

            <div className="form-group">
              <label className="form-label required">Official Email</label>
              <input
                type="email"
                className="form-input"
                {...register('email')}
                placeholder="e.g. sunita@radhakrishna.org"
              />
              {errors.email && <p className="form-error">{errors.email.message}</p>}
            </div>
          </div>

          <div className="form-grid-3">
            <div className="form-group">
              <label className="form-label required">Mobile Phone</label>
              <input
                type="text"
                className="form-input"
                {...register('phone')}
                placeholder="+91 98370 12345"
              />
              {errors.phone && <p className="form-error">{errors.phone.message}</p>}
            </div>

            <div className="form-group">
              <label className="form-label required">System Role</label>
              <select className="form-select" {...register('role')}>
                <option value="faculty">Faculty Instructor</option>
                <option value="admin">Front-Desk Admin / Coordinator</option>
                <option value="owner">Institute Owner / Director</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label required">Designation / Title</label>
              <input
                type="text"
                className="form-input"
                {...register('roleTitle')}
                placeholder="e.g. Senior NEET Biology Faculty"
              />
              {errors.roleTitle && <p className="form-error">{errors.roleTitle.message}</p>}
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Subjects / Specializations (Comma-separated)</label>
              <input
                type="text"
                className="form-input"
                {...register('subjectsString')}
                placeholder="e.g. Zoology, Botany, Cell Biology"
              />
            </div>

            <div className="form-group">
              <label className="form-label required">Joining Date</label>
              <input
                type="date"
                className="form-input"
                {...register('joiningDate')}
              />
              {errors.joiningDate && <p className="form-error">{errors.joiningDate.message}</p>}
            </div>
          </div>

          {/* Batch Assignment Selector */}
          <div className="form-group" style={{ marginTop: '10px' }}>
            <label className="form-label">Assign Teaching Batches</label>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                padding: '10px',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                backgroundColor: '#fafbfc',
                maxHeight: '160px',
                overflowY: 'auto',
              }}
            >
              {batches.map(batch => {
                const isAssigned = selectedBatches.includes(batch.id);
                return (
                  <label
                    key={batch.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isAssigned}
                      onChange={e => {
                        const updated = e.target.checked
                          ? [...selectedBatches, batch.id]
                          : selectedBatches.filter(id => id !== batch.id);
                        setValue('assignedBatchIds', updated);
                      }}
                    />
                    <span>{batch.name}</span>
                  </label>
                );
              })}
            </div>
            <p className="form-helper">
              Faculty members only see rosters and mark attendance for their assigned cohorts.
            </p>
          </div>
        </form>
      </Modal>
    </div>
  );
};

