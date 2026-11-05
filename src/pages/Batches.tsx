import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  Plus,
  Users,
  Clock,
  Calendar,
  MapPin,
  Edit2,
  Trash2,
  ArrowRight,
  UserPlus,
  CheckCircle,
  Eye,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Card, CardHeader, CardBody } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { Batch, Student } from '../types';

export const Batches: React.FC = () => {
  const {
    batches,
    students,
    staff,
    addBatch,
    updateBatch,
    deleteBatch,
    assignStudentsToBatch,
    removeStudentFromBatch,
  } = useApp();
  const { userRole } = useAuth();
  const navigate = useNavigate();
  const canManageBatches = userRole === 'owner' || userRole === 'admin';

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isRosterModalOpen, setIsRosterModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formCourse, setFormCourse] = useState('');
  const [formInstructor, setFormInstructor] = useState('');
  const [formScheduleDays, setFormScheduleDays] = useState('Mon, Wed, Fri');
  const [formTiming, setFormTiming] = useState('04:30 PM - 06:00 PM');
  const [formRoom, setFormRoom] = useState('Hall A');
  const [formCapacity, setFormCapacity] = useState<number>(20);
  const [formMonthlyFee, setFormMonthlyFee] = useState<number>(2500);
  const [formError, setFormError] = useState('');

  // Assign students state
  const [selectedStudentIdsToAssign, setSelectedStudentIdsToAssign] = useState<string[]>([]);

  // Instructor options derived from staff directory
  const instructorOptions = useMemo(() => {
    const list = staff.map(s => ({
      value: s.name,
      label: `${s.name} (${s.roleTitle || s.role.toUpperCase()})`,
    }));
    if (formInstructor && !list.some(item => item.value === formInstructor)) {
      list.push({ value: formInstructor, label: `${formInstructor} (Assigned)` });
    }
    return list;
  }, [staff, formInstructor]);

  const handleOpenAdd = () => {
    const defaultInstructor =
      staff.find(s => s.role === 'faculty' && s.status === 'active')?.name ||
      staff[0]?.name ||
      'Er. Rakesh Sharma';
    setFormName('');
    setFormCode('');
    setFormCourse('');
    setFormInstructor(defaultInstructor);
    setFormScheduleDays('Mon, Wed, Fri');
    setFormTiming('04:30 PM - 06:00 PM');
    setFormRoom('Hall A');
    setFormCapacity(20);
    setFormMonthlyFee(2500);
    setFormError('');
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (batch: Batch) => {
    setSelectedBatch(batch);
    setFormName(batch.name);
    setFormCode(batch.code);
    setFormCourse(batch.course);
    setFormInstructor(batch.instructor);
    setFormScheduleDays(batch.scheduleDays);
    setFormTiming(batch.timing);
    setFormRoom(batch.room);
    setFormCapacity(batch.capacity);
    setFormMonthlyFee(batch.monthlyFee);
    setFormError('');
    setIsEditModalOpen(true);
  };

  const handleOpenRoster = (batch: Batch) => {
    setSelectedBatch(batch);
    setIsRosterModalOpen(true);
  };

  const handleOpenAssign = (batch: Batch) => {
    setSelectedBatch(batch);
    // Find students currently in other batches or unassigned
    setSelectedStudentIdsToAssign([]);
    setIsAssignModalOpen(true);
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('Batch name is required');
      return;
    }
    if (!formCourse.trim()) {
      setFormError('Target course or curriculum is required');
      return;
    }

    addBatch({
      name: formName.trim(),
      code: formCode.trim() || `BAT-${Date.now().toString().slice(-3)}`,
      course: formCourse.trim(),
      instructor: formInstructor.trim(),
      scheduleDays: formScheduleDays.trim(),
      timing: formTiming.trim(),
      room: formRoom.trim(),
      capacity: Number(formCapacity) || 20,
      monthlyFee: Number(formMonthlyFee) || 2500,
      status: 'active',
      startDate: '2026-04-01',
    });

    setIsAddModalOpen(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatch) return;
    if (!formName.trim()) {
      setFormError('Batch name is required');
      return;
    }

    updateBatch(selectedBatch.id, {
      name: formName.trim(),
      code: formCode.trim(),
      course: formCourse.trim(),
      instructor: formInstructor.trim(),
      scheduleDays: formScheduleDays.trim(),
      timing: formTiming.trim(),
      room: formRoom.trim(),
      capacity: Number(formCapacity),
      monthlyFee: Number(formMonthlyFee),
    });

    setIsEditModalOpen(false);
    setSelectedBatch(null);
  };

  const handleSaveAssign = () => {
    if (!selectedBatch) return;
    assignStudentsToBatch(selectedBatch.id, selectedStudentIdsToAssign);
    setIsAssignModalOpen(false);
    setSelectedBatch(null);
  };

  const toggleStudentAssignSelection = (studentId: string) => {
    setSelectedStudentIdsToAssign(prev =>
      prev.includes(studentId) ? prev.filter(id => id !== studentId) : [...prev, studentId]
    );
  };

  return (
    <div className="batches-page">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1>Batch Management</h1>
          <p>
            Configure schedules, faculty instructors, classroom limits, and student enrollments
          </p>
        </div>

        <div className="page-actions-group">
          {canManageBatches && (
            <Button variant="primary" icon={<Plus size={16} />} onClick={handleOpenAdd}>
              Create New Batch
            </Button>
          )}
        </div>
      </div>

      {/* Batches Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
          gap: '20px',
        }}
      >
        {batches.map(batch => {
          const enrolledStudents = students.filter(s => s.batchId === batch.id);
          const capacityPercent = Math.min(100, Math.round((enrolledStudents.length / batch.capacity) * 100));

          return (
            <Card key={batch.id} style={{ display: 'flex', flexDirection: 'column' }}>
              <CardHeader
                title={batch.name}
                subtitle={`Code: ${batch.code} • ${batch.course}`}
                action={
                  canManageBatches ? (
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-icon-only"
                        title="Edit Batch"
                        onClick={() => handleOpenEdit(batch)}
                      >
                        <Edit2 size={13} />
                      </button>
                      {batches.length > 1 && (
                        <button
                          type="button"
                          className="btn btn-danger-outline btn-icon-only"
                          title="Delete Batch"
                          onClick={() => {
                            if (window.confirm(`Delete batch "${batch.name}"?`)) {
                              deleteBatch(batch.id);
                            }
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  ) : undefined
                }
              />

              <CardBody style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Meta details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-secondary)' }}>
                    <Clock size={15} style={{ color: 'var(--color-primary)' }} />
                    <span><strong>{batch.timing}</strong> ({batch.scheduleDays})</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-secondary)' }}>
                    <MapPin size={15} style={{ color: 'var(--color-primary)' }} />
                    <span>{batch.room} &bull; Instructor: {batch.instructor}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-secondary)' }}>
                    <GraduationCap size={15} style={{ color: 'var(--color-primary)' }} />
                    <span>Tuition Fee: <strong>₹{batch.monthlyFee.toLocaleString('en-IN')} / month</strong></span>
                  </div>
                </div>

                {/* Capacity Utilization */}
                <div style={{ marginTop: 'auto', paddingTop: '10px' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '12px',
                      marginBottom: '6px',
                    }}
                  >
                    <span>Enrolled Capacity</span>
                    <span>
                      <strong>{enrolledStudents.length}</strong> / {batch.capacity} Students ({capacityPercent}%)
                    </span>
                  </div>

                  <div
                    style={{
                      height: '8px',
                      backgroundColor: '#f1f5f9',
                      borderRadius: '999px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${capacityPercent}%`,
                        backgroundColor: capacityPercent >= 90 ? '#ef4444' : capacityPercent >= 70 ? '#3b82f6' : '#10b981',
                        borderRadius: '999px',
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>
                </div>
              </CardBody>

              {/* Card Footer Actions */}
              <div
                style={{
                  padding: '12px 16px',
                  borderTop: '1px solid var(--color-border)',
                  backgroundColor: '#fafbfc',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Button
                  variant="outline"
                  size="sm"
                  icon={<Eye size={13} />}
                  onClick={() => handleOpenRoster(batch)}
                >
                  View Roster ({enrolledStudents.length})
                </Button>

                <div style={{ display: 'flex', gap: '6px' }}>
                  {canManageBatches && (
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={<UserPlus size={13} />}
                      onClick={() => handleOpenAssign(batch)}
                    >
                      Assign
                    </Button>
                  )}

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      navigate(`/attendance?batch=${batch.id}`);
                    }}
                  >
                    Attendance
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Create Batch Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Create New Academic Batch"
        size="large"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', width: '100%' }}>
            <Button variant="secondary" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveAdd}>
              Create Batch
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
              label="Batch Name"
              required
              value={formName}
              onChange={e => setFormName(e.target.value)}
              placeholder="e.g. Class 11th - Medical Foundation"
            />
            <Input
              label="Batch Code"
              value={formCode}
              onChange={e => setFormCode(e.target.value)}
              placeholder="e.g. MED-11-MORN"
            />
          </div>

          <div className="form-grid-2">
            <Input
              label="Course / Target Exam"
              required
              value={formCourse}
              onChange={e => setFormCourse(e.target.value)}
              placeholder="e.g. NEET 2027 Biology & Chemistry"
            />
            <Select
              label="Lead Faculty Instructor"
              required
              options={instructorOptions}
              value={formInstructor}
              onChange={e => setFormInstructor(e.target.value)}
            />
          </div>

          <div className="form-grid-3">
            <Input
              label="Schedule Days"
              value={formScheduleDays}
              onChange={e => setFormScheduleDays(e.target.value)}
              placeholder="e.g. Mon, Wed, Fri"
            />
            <Input
              label="Timing"
              value={formTiming}
              onChange={e => setFormTiming(e.target.value)}
              placeholder="e.g. 04:30 PM - 06:00 PM"
            />
            <Input
              label="Classroom / Hall"
              value={formRoom}
              onChange={e => setFormRoom(e.target.value)}
              placeholder="e.g. Hall B (Smart Class)"
            />
          </div>

          <div className="form-grid-2">
            <Input
              type="number"
              label="Student Capacity Limit"
              value={formCapacity}
              onChange={e => setFormCapacity(Number(e.target.value))}
            />
            <Input
              type="number"
              label="Standard Monthly Tuition Fee (₹)"
              value={formMonthlyFee}
              onChange={e => setFormMonthlyFee(Number(e.target.value))}
            />
          </div>
        </form>
      </Modal>

      {/* Edit Batch Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit Batch: ${selectedBatch?.name}`}
        size="large"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', width: '100%' }}>
            <Button variant="secondary" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveEdit}>
              Update Batch Details
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
              label="Batch Name"
              required
              value={formName}
              onChange={e => setFormName(e.target.value)}
            />
            <Input
              label="Batch Code"
              value={formCode}
              onChange={e => setFormCode(e.target.value)}
            />
          </div>

          <div className="form-grid-2">
            <Input
              label="Course / Target Exam"
              required
              value={formCourse}
              onChange={e => setFormCourse(e.target.value)}
            />
            <Select
              label="Lead Faculty"
              required
              options={instructorOptions}
              value={formInstructor}
              onChange={e => setFormInstructor(e.target.value)}
            />
          </div>

          <div className="form-grid-3">
            <Input
              label="Schedule Days"
              value={formScheduleDays}
              onChange={e => setFormScheduleDays(e.target.value)}
            />
            <Input
              label="Timing"
              value={formTiming}
              onChange={e => setFormTiming(e.target.value)}
            />
            <Input
              label="Classroom"
              value={formRoom}
              onChange={e => setFormRoom(e.target.value)}
            />
          </div>

          <div className="form-grid-2">
            <Input
              type="number"
              label="Capacity"
              value={formCapacity}
              onChange={e => setFormCapacity(Number(e.target.value))}
            />
            <Input
              type="number"
              label="Monthly Fee (₹)"
              value={formMonthlyFee}
              onChange={e => setFormMonthlyFee(Number(e.target.value))}
            />
          </div>
        </form>
      </Modal>

      {/* View Batch Roster Modal */}
      <Modal
        isOpen={isRosterModalOpen}
        onClose={() => setIsRosterModalOpen(false)}
        title={`Roster: ${selectedBatch?.name}`}
        size="large"
        footer={
          <Button variant="secondary" onClick={() => setIsRosterModalOpen(false)}>
            Close
          </Button>
        }
      >
        {selectedBatch && (
          <div>
            <div style={{ marginBottom: '16px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
              Enrolled: <strong>{students.filter(s => s.batchId === selectedBatch.id).length} students</strong> &bull; Schedule: {selectedBatch.timing} ({selectedBatch.scheduleDays})
            </div>

            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Roll / ID</th>
                    <th>Student Name</th>
                    <th>Phone</th>
                    <th>Guardian</th>
                    <th>Fee Status</th>
                    {canManageBatches && <th style={{ textAlign: 'center' }}>Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {students
                    .filter(s => s.batchId === selectedBatch.id)
                    .map(student => (
                      <tr key={student.id}>
                        <td style={{ fontFamily: 'var(--font-family-mono)', fontSize: '12px' }}>
                          {student.studentId}
                        </td>
                        <td>
                          <strong
                            style={{ cursor: 'pointer', color: 'var(--color-primary)' }}
                            onClick={() => {
                              setIsRosterModalOpen(false);
                              navigate(`/students/${student.id}`);
                            }}
                          >
                            {student.fullName}
                          </strong>
                        </td>
                        <td>{student.phone}</td>
                        <td>{student.guardianName}</td>
                        <td>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 600,
                              color: student.balanceFee > 0 ? '#b91c1c' : '#047857',
                            }}
                          >
                            {student.balanceFee > 0 ? `Due ₹${student.balanceFee}` : 'Clear'}
                          </span>
                        </td>
                        {canManageBatches && (
                          <td style={{ textAlign: 'center' }}>
                            <button
                              type="button"
                              className="btn btn-danger-outline btn-icon-only"
                              title="Remove student from this batch"
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `Remove "${student.fullName}" from batch "${selectedBatch.name}"? They will become unassigned.`
                                  )
                                ) {
                                  removeStudentFromBatch(selectedBatch.id, student.id);
                                }
                              }}
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>

      {/* Assign Students to Batch Modal */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title={`Assign Students to ${selectedBatch?.name}`}
        size="large"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', width: '100%' }}>
            <Button variant="secondary" onClick={() => setIsAssignModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={selectedStudentIdsToAssign.length === 0}
              onClick={handleSaveAssign}
            >
              Transfer & Assign {selectedStudentIdsToAssign.length} Students
            </Button>
          </div>
        }
      >
        <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
          Select students from other batches to transfer or add into <strong>{selectedBatch?.name}</strong>.
        </p>

        <div style={{ maxHeight: '350px', overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: '8px' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>Select</th>
                <th>Student Name</th>
                <th>Current Batch</th>
                <th>Phone</th>
              </tr>
            </thead>
            <tbody>
              {students
                .filter(s => s.batchId !== selectedBatch?.id)
                .slice(0, 30)
                .map(student => {
                  const isChecked = selectedStudentIdsToAssign.includes(student.id);
                  return (
                    <tr
                      key={student.id}
                      onClick={() => toggleStudentAssignSelection(student.id)}
                      style={{ cursor: 'pointer', backgroundColor: isChecked ? '#eff6ff' : 'transparent' }}
                    >
                      <td>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // handled by row click
                        />
                      </td>
                      <td>
                        <strong>{student.fullName}</strong>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                          {student.studentId}
                        </div>
                      </td>
                      <td style={{ fontSize: '12px' }}>{student.batchName}</td>
                      <td style={{ fontSize: '12px' }}>{student.phone}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </Modal>
    </div>
  );
};
