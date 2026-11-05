import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search,
  Filter,
  Plus,
  Eye,
  IndianRupee,
  Edit2,
  Trash2,
  Phone,
  MessageCircle,
  Download,
  AlertCircle,
  CheckCircle,
  Archive,
  ArchiveRestore,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/common/Button';
import { Card, CardHeader, CardBody } from '../components/common/Card';
import { Modal } from '../components/common/Modal';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { FeeStatusBadge } from '../components/common/Badge';
import { Student } from '../types';

export const Students: React.FC = () => {
  const {
    students,
    batches,
    addStudent,
    updateStudent,
    deleteStudent,
    archiveStudent,
    unarchiveStudent,
    setIsPaymentModalOpen,
    setSelectedStudentForPayment,
    todayDate,
  } = useApp();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { userRole } = useAuth();
  const canManageStudents = userRole === 'owner' || userRole === 'admin';

  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBatchFilter, setSelectedBatchFilter] = useState('ALL');
  const [selectedFeeFilter, setSelectedFeeFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'active' | 'archived' | 'ALL'>('active');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Add / Edit Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formGuardianName, setFormGuardianName] = useState('');
  const [formGuardianPhone, setFormGuardianPhone] = useState('');
  const [formGuardianRelation, setFormGuardianRelation] = useState<'Father' | 'Mother' | 'Guardian'>('Father');
  const [formBatchId, setFormBatchId] = useState(batches[0]?.id || '');
  const [formAdmissionDate, setFormAdmissionDate] = useState(todayDate);
  const [formGender, setFormGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [formTotalFee, setFormTotalFee] = useState<number>(10000);
  const [formInitialPayment, setFormInitialPayment] = useState<number>(2500);
  const [formNotes, setFormNotes] = useState('');
  const [formError, setFormError] = useState('');

  // Auto-open modal if URL query param has ?action=new
  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setIsAddModalOpen(true);
      searchParams.delete('action');
      setSearchParams(searchParams);
    }
  }, [searchParams, setSearchParams]);

  // Filtering
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      // Search matches name, student ID, phone, or guardian name
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        student.fullName.toLowerCase().includes(q) ||
        student.studentId.toLowerCase().includes(q) ||
        student.phone.toLowerCase().includes(q) ||
        student.guardianName.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      // Batch filter
      if (selectedBatchFilter !== 'ALL' && student.batchId !== selectedBatchFilter) {
        return false;
      }

      // Fee status filter
      if (selectedFeeFilter !== 'ALL' && student.feeStatus !== selectedFeeFilter) {
        return false;
      }

      // Enrollment status filter
      if (selectedStatusFilter !== 'ALL') {
        const studentStatus = student.status || 'active';
        if (studentStatus !== selectedStatusFilter) {
          return false;
        }
      }

      return true;
    });
  }, [students, searchTerm, selectedBatchFilter, selectedFeeFilter, selectedStatusFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredStudents.length / pageSize) || 1;
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredStudents.slice(start, start + pageSize);
  }, [filteredStudents, currentPage]);

  const handleOpenAdd = () => {
    setFormName('');
    setFormPhone('+91 94120 ');
    setFormEmail('');
    setFormAddress('');
    setFormGuardianName('');
    setFormGuardianPhone('+91 98370 ');
    setFormGuardianRelation('Father');
    setFormBatchId(batches[0]?.id || '');
    setFormAdmissionDate(todayDate);
    setFormGender('Male');
    setFormTotalFee(10000);
    setFormInitialPayment(2500);
    setFormNotes('');
    setFormError('');
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (student: Student) => {
    setEditingStudent(student);
    setFormName(student.fullName);
    setFormPhone(student.phone);
    setFormEmail(student.email || '');
    setFormAddress(student.address || '');
    setFormGuardianName(student.guardianName);
    setFormGuardianPhone(student.guardianPhone);
    setFormGuardianRelation(student.guardianRelation);
    setFormBatchId(student.batchId);
    setFormAdmissionDate(student.admissionDate);
    setFormGender(student.gender);
    setFormTotalFee(student.totalFeeInvoiced);
    setFormNotes(student.notes || '');
    setFormError('');
    setIsEditModalOpen(true);
  };

  const handleExportCSV = () => {
    const headers = [
      'Student ID',
      'Full Name',
      'Phone',
      'Guardian Name',
      'Guardian Phone',
      'Relation',
      'Email',
      'Address',
      'Admission Date',
      'Course',
      'Batch',
      'Gender',
      'Status',
      'Fee Status',
      'Total Invoiced (INR)',
      'Total Paid (INR)',
      'Balance Due (INR)',
    ];

    const rows = filteredStudents.map(s => [
      `"${s.studentId}"`,
      `"${s.fullName.replace(/"/g, '""')}"`,
      `"${s.phone}"`,
      `"${s.guardianName.replace(/"/g, '""')}"`,
      `"${s.guardianPhone}"`,
      `"${s.guardianRelation}"`,
      `"${s.email || ''}"`,
      `"${(s.address || '').replace(/"/g, '""')}"`,
      `"${s.admissionDate}"`,
      `"${s.course.replace(/"/g, '""')}"`,
      `"${s.batchName.replace(/"/g, '""')}"`,
      `"${s.gender}"`,
      `"${s.status || 'active'}"`,
      `"${s.feeStatus}"`,
      s.totalFeeInvoiced,
      s.totalFeePaid,
      s.balanceFee,
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `fixia_students_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('Student full name is required');
      return;
    }
    if (!formPhone.trim() || formPhone.length < 10) {
      setFormError('Please enter a valid 10-digit phone number');
      return;
    }
    if (!formGuardianName.trim()) {
      setFormError('Guardian name is required');
      return;
    }

    try {
      const selectedBatch = batches.find(b => b.id === formBatchId);
      addStudent({
        fullName: formName.trim(),
        phone: formPhone.trim(),
        email: formEmail.trim() || undefined,
        address: formAddress.trim() || undefined,
        guardianName: formGuardianName.trim(),
        guardianPhone: formGuardianPhone.trim(),
        guardianRelation: formGuardianRelation,
        course: selectedBatch ? selectedBatch.course : 'General Coaching',
        batchId: formBatchId,
        admissionDate: formAdmissionDate,
        gender: formGender,
        totalFeeInvoiced: Number(formTotalFee) || 0,
        initialPayment: Number(formInitialPayment) || 0,
        notes: formNotes.trim(),
      });

      setIsAddModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Error creating student');
    }
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    if (!formName.trim()) {
      setFormError('Student full name is required');
      return;
    }

    const selectedBatch = batches.find(b => b.id === formBatchId);
    updateStudent(editingStudent.id, {
      fullName: formName.trim(),
      phone: formPhone.trim(),
      email: formEmail.trim() || undefined,
      address: formAddress.trim() || undefined,
      guardianName: formGuardianName.trim(),
      guardianPhone: formGuardianPhone.trim(),
      guardianRelation: formGuardianRelation,
      batchId: formBatchId,
      batchName: selectedBatch?.name || editingStudent.batchName,
      course: selectedBatch?.course || editingStudent.course,
      admissionDate: formAdmissionDate,
      gender: formGender,
      totalFeeInvoiced: Number(formTotalFee),
      notes: formNotes.trim(),
    });

    setIsEditModalOpen(false);
    setEditingStudent(null);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to remove student "${name}"? This action will remove their attendance records.`)) {
      deleteStudent(id);
    }
  };

  const handleArchive = (id: string, name: string) => {
    if (window.confirm(`Archive student "${name}"? Archived students are hidden from active rosters and attendance rolls.`)) {
      archiveStudent(id);
    }
  };

  const handleUnarchive = (id: string, name: string) => {
    if (window.confirm(`Restore student "${name}" to active status?`)) {
      unarchiveStudent(id);
    }
  };

  return (
    <div className="students-page">
      {/* Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1>Student Directory</h1>
          <p>
            Showing {filteredStudents.length} of {students.length} enrolled students
          </p>
        </div>

        <div className="page-actions-group">
          <Button variant="outline" icon={<Download size={16} />} onClick={handleExportCSV}>
            Export CSV
          </Button>
          {canManageStudents && (
            <Button variant="primary" icon={<Plus size={16} />} onClick={handleOpenAdd}>
              Add New Student
            </Button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card style={{ marginBottom: '20px' }}>
        <CardBody style={{ padding: '16px' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px',
              alignItems: 'center',
            }}
          >
            {/* Search Input */}
            <div style={{ position: 'relative' }}>
              <Search
                size={16}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--color-text-muted)',
                }}
              />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '36px' }}
                placeholder="Search by name, ID, phone..."
                value={searchTerm}
                onChange={e => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            {/* Batch Filter Dropdown */}
            <select
              className="form-select"
              value={selectedBatchFilter}
              onChange={e => {
                setSelectedBatchFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="ALL">All Batches ({batches.length})</option>
              {batches.map(b => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.studentCount} stu)
                </option>
              ))}
            </select>

            {/* Fee Status Filter */}
            <select
              className="form-select"
              value={selectedFeeFilter}
              onChange={e => {
                setSelectedFeeFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="ALL">All Fee Statuses</option>
              <option value="paid">Fully Paid</option>
              <option value="partial">Partial Dues</option>
              <option value="overdue">Overdue</option>
            </select>

            {/* Enrollment Status Filter */}
            <select
              className="form-select"
              value={selectedStatusFilter}
              onChange={e => {
                setSelectedStatusFilter(e.target.value as any);
                setCurrentPage(1);
              }}
            >
              <option value="active">Active Students</option>
              <option value="archived">Archived Students</option>
              <option value="ALL">All Students (Active & Archived)</option>
            </select>
          </div>
        </CardBody>
      </Card>

      {/* Students Data Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Student Details</th>
              <th>Batch / Course</th>
              <th>Guardian Contact</th>
              <th>Admission Date</th>
              <th>Fee Status</th>
              <th style={{ textAlign: 'right' }}>Balance Due</th>
              <th style={{ textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedStudents.length === 0 ? (
              <tr>
                <td colSpan={7} className="table-empty-state">
                  No students matched your search or filter criteria.
                </td>
              </tr>
            ) : (
              paginatedStudents.map(student => (
                <tr key={student.id}>
                  {/* Student Details */}
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          backgroundColor: '#e0e7ff',
                          color: '#3730a3',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '12px',
                          flexShrink: 0,
                        }}
                      >
                        {student.fullName
                          .split(' ')
                          .map(n => n[0])
                          .slice(0, 2)
                          .join('')}
                      </div>
                      <div>
                        <strong
                          style={{
                            fontSize: '13.5px',
                            cursor: 'pointer',
                            color: 'var(--color-primary)',
                          }}
                          onClick={() => navigate(`/students/${student.id}`)}
                        >
                          {student.fullName}
                        </strong>
                        {student.status === 'archived' && (
                          <span
                            style={{
                              marginLeft: '6px',
                              fontSize: '10px',
                              fontWeight: 600,
                              textTransform: 'uppercase',
                              backgroundColor: '#f1f5f9',
                              color: '#64748b',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              border: '1px solid #cbd5e1',
                            }}
                          >
                            Archived
                          </span>
                        )}
                        <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                          ID: <span style={{ fontFamily: 'var(--font-family-mono)' }}>{student.studentId}</span> &bull; {student.phone}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Batch / Course */}
                  <td>
                    <div style={{ fontSize: '13px', fontWeight: 500 }}>
                      {student.batchName}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                      {student.course}
                    </div>
                  </td>

                  {/* Guardian Contact */}
                  <td>
                    <div style={{ fontSize: '13px' }}>
                      {student.guardianName}{' '}
                      <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                        ({student.guardianRelation})
                      </span>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                      {student.guardianPhone}
                    </div>
                  </td>

                  {/* Admission Date */}
                  <td style={{ fontSize: '12.5px', color: 'var(--color-text-secondary)' }}>
                    {student.admissionDate}
                  </td>

                  {/* Fee Status */}
                  <td>
                    <FeeStatusBadge status={student.feeStatus} />
                  </td>

                  {/* Balance Due */}
                  <td style={{ textAlign: 'right' }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-family-mono)',
                        fontWeight: 700,
                        fontSize: '13px',
                        color: student.balanceFee > 0 ? '#b91c1c' : '#047857',
                      }}
                    >
                      ₹{student.balanceFee.toLocaleString('en-IN')}
                    </span>
                    <div style={{ fontSize: '10.5px', color: 'var(--color-text-muted)' }}>
                      of ₹{student.totalFeeInvoiced.toLocaleString('en-IN')}
                    </div>
                  </td>

                  {/* Actions */}
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-icon-only"
                        title="View Full Profile"
                        onClick={() => navigate(`/students/${student.id}`)}
                      >
                        <Eye size={14} />
                      </button>

                      <button
                        type="button"
                        className="btn btn-secondary btn-icon-only"
                        title="Record Fee Payment"
                        onClick={() => {
                          setSelectedStudentForPayment(student);
                          setIsPaymentModalOpen(true);
                        }}
                      >
                        <IndianRupee size={14} />
                      </button>

                      {canManageStudents && (
                        <>
                          <button
                            type="button"
                            className="btn btn-secondary btn-icon-only"
                            title="Edit Student Info"
                            onClick={() => handleOpenEdit(student)}
                          >
                            <Edit2 size={14} />
                          </button>

                          {student.status === 'archived' ? (
                            <button
                              type="button"
                              className="btn btn-secondary btn-icon-only"
                              title="Restore Student to Active"
                              onClick={() => handleUnarchive(student.id, student.fullName)}
                            >
                              <ArchiveRestore size={14} style={{ color: '#0284c7' }} />
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-secondary btn-icon-only"
                              title="Archive Student"
                              onClick={() => handleArchive(student.id, student.fullName)}
                            >
                              <Archive size={14} style={{ color: '#64748b' }} />
                            </button>
                          )}

                          <button
                            type="button"
                            className="btn btn-danger-outline btn-icon-only"
                            title="Delete Student"
                            onClick={() => handleDelete(student.id, student.fullName)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div
            style={{
              padding: '12px 16px',
              borderTop: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '12.5px',
              color: 'var(--color-text-secondary)',
            }}
          >
            <span>
              Showing {(currentPage - 1) * pageSize + 1} to{' '}
              {Math.min(currentPage * pageSize, filteredStudents.length)} of {filteredStudents.length} entries
            </span>

            <div style={{ display: 'flex', gap: '6px' }}>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '0 8px',
                  fontWeight: 600,
                }}
              >
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Add Student Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Register New Student Admission"
        size="large"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', width: '100%' }}>
            <Button variant="secondary" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveAdd}>
              Save & Enroll Student
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSaveAdd}>
          {formError && (
            <div
              style={{
                padding: '10px 14px',
                backgroundColor: 'var(--color-danger-bg)',
                border: '1px solid var(--color-danger-border)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-danger-text)',
                fontSize: '13px',
                marginBottom: '16px',
              }}
            >
              {formError}
            </div>
          )}

          <div className="form-grid-2">
            <Input
              label="Student Full Name"
              required
              value={formName}
              onChange={e => setFormName(e.target.value)}
              placeholder="e.g. Priyanshu Sharma"
            />
            <Input
              label="Student Mobile Phone"
              required
              value={formPhone}
              onChange={e => setFormPhone(e.target.value)}
              placeholder="+91 94120 12345"
            />
          </div>

          <div className="form-grid-2">
            <Input
              type="email"
              label="Student Email (Optional)"
              value={formEmail}
              onChange={e => setFormEmail(e.target.value)}
              placeholder="e.g. priyanshu@example.com"
            />
            <Input
              label="Residential Address / City (Optional)"
              value={formAddress}
              onChange={e => setFormAddress(e.target.value)}
              placeholder="e.g. Dampier Nagar, Mathura"
            />
          </div>

          <div className="form-grid-3">
            <Input
              label="Guardian Name"
              required
              value={formGuardianName}
              onChange={e => setFormGuardianName(e.target.value)}
              placeholder="e.g. Rajesh Sharma"
            />
            <Input
              label="Guardian Phone"
              value={formGuardianPhone}
              onChange={e => setFormGuardianPhone(e.target.value)}
              placeholder="+91 98370 12345"
            />
            <Select
              label="Relation"
              options={[
                { value: 'Father', label: 'Father' },
                { value: 'Mother', label: 'Mother' },
                { value: 'Guardian', label: 'Guardian' },
              ]}
              value={formGuardianRelation}
              onChange={e => setFormGuardianRelation(e.target.value as any)}
            />
          </div>

          <div className="form-grid-3">
            <Select
              label="Assign Batch"
              required
              options={batches.map(b => ({ value: b.id, label: `${b.name} (${b.studentCount}/${b.capacity})` }))}
              value={formBatchId}
              onChange={e => setFormBatchId(e.target.value)}
            />
            <Input
              type="date"
              label="Admission Date"
              value={formAdmissionDate}
              onChange={e => setFormAdmissionDate(e.target.value)}
            />
            <Select
              label="Gender"
              options={[
                { value: 'Male', label: 'Male' },
                { value: 'Female', label: 'Female' },
                { value: 'Other', label: 'Other' },
              ]}
              value={formGender}
              onChange={e => setFormGender(e.target.value as any)}
            />
          </div>

          <div className="form-grid-2" style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
            <Input
              type="number"
              label="Total Course Fee (₹)"
              required
              value={formTotalFee}
              onChange={e => setFormTotalFee(Number(e.target.value))}
            />
            <Input
              type="number"
              label="Initial Payment Collected (₹)"
              value={formInitialPayment}
              onChange={e => setFormInitialPayment(Number(e.target.value))}
              helperText="Generates instant official fee receipt"
            />
          </div>

          <div className="form-group" style={{ marginTop: '12px' }}>
            <label className="form-label">Address / Residence / Notes</label>
            <input
              type="text"
              className="form-input"
              value={formNotes}
              onChange={e => setFormNotes(e.target.value)}
              placeholder="e.g. Near Dampier Park, Mathura. Target: CBSE Board 2027"
            />
          </div>
        </form>
      </Modal>

      {/* Edit Student Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit Student: ${editingStudent?.fullName}`}
        size="large"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', width: '100%' }}>
            <Button variant="secondary" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveEdit}>
              Update Student Records
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSaveEdit}>
          {formError && (
            <div
              style={{
                padding: '10px 14px',
                backgroundColor: 'var(--color-danger-bg)',
                border: '1px solid var(--color-danger-border)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-danger-text)',
                fontSize: '13px',
                marginBottom: '16px',
              }}
            >
              {formError}
            </div>
          )}

          <div className="form-grid-2">
            <Input
              label="Student Full Name"
              required
              value={formName}
              onChange={e => setFormName(e.target.value)}
            />
            <Input
              label="Student Mobile Phone"
              required
              value={formPhone}
              onChange={e => setFormPhone(e.target.value)}
            />
          </div>

          <div className="form-grid-2">
            <Input
              type="email"
              label="Student Email (Optional)"
              value={formEmail}
              onChange={e => setFormEmail(e.target.value)}
              placeholder="priyanshu@example.com"
            />
            <Input
              label="Residential Address / City (Optional)"
              value={formAddress}
              onChange={e => setFormAddress(e.target.value)}
              placeholder="Dampier Nagar, Mathura"
            />
          </div>

          <div className="form-grid-3">
            <Input
              label="Guardian Name"
              required
              value={formGuardianName}
              onChange={e => setFormGuardianName(e.target.value)}
            />
            <Input
              label="Guardian Phone"
              value={formGuardianPhone}
              onChange={e => setFormGuardianPhone(e.target.value)}
            />
            <Select
              label="Relation"
              options={[
                { value: 'Father', label: 'Father' },
                { value: 'Mother', label: 'Mother' },
                { value: 'Guardian', label: 'Guardian' },
              ]}
              value={formGuardianRelation}
              onChange={e => setFormGuardianRelation(e.target.value as any)}
            />
          </div>

          <div className="form-grid-3">
            <Select
              label="Assign Batch"
              required
              options={batches.map(b => ({ value: b.id, label: b.name }))}
              value={formBatchId}
              onChange={e => setFormBatchId(e.target.value)}
            />
            <Input
              type="date"
              label="Admission Date"
              value={formAdmissionDate}
              onChange={e => setFormAdmissionDate(e.target.value)}
            />
            <Input
              type="number"
              label="Total Invoiced Fee (₹)"
              value={formTotalFee}
              onChange={e => setFormTotalFee(Number(e.target.value))}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Notes</label>
            <input
              type="text"
              className="form-input"
              value={formNotes}
              onChange={e => setFormNotes(e.target.value)}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
