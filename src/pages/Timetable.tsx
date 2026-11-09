import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  Plus,
  Users,
  GraduationCap,
  AlertTriangle,
  Trash2,
  CheckCircle2,
  BookOpen,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Card, CardHeader, CardBody } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Select } from '../components/common/Select';
import { Input } from '../components/common/Input';
import { BatchSchedule } from '../types';

export const Timetable: React.FC = () => {
  const { batches, batchSchedules, addBatchSchedule, deleteBatchSchedule, students } = useApp();
  const { userRole } = useAuth();
  const canManageTimetable = userRole === 'owner' || userRole === 'admin';
  const navigate = useNavigate();

  // Active Day tab: 1 = Mon ... 6 = Sat, 'ALL' = Full week
  const [activeDayFilter, setActiveDayFilter] = useState<number | 'ALL'>('ALL');

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formBatchId, setFormBatchId] = useState<string>(batches[0]?.id || '');
  const [formDayOfWeek, setFormDayOfWeek] = useState<number>(1);
  const [formStartTime, setFormStartTime] = useState<string>('16:30');
  const [formEndTime, setFormEndTime] = useState<string>('18:00');
  const [formRoomNumber, setFormRoomNumber] = useState<string>('Room 101');
  const [formError, setFormError] = useState<string>('');
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);

  const DAYS = [
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' },
  ];

  // Map batches by ID for quick lookups
  const batchMap = useMemo(() => {
    const map = new Map<string, (typeof batches)[0]>();
    batches.forEach(b => map.set(b.id, b));
    return map;
  }, [batches]);

  // Filtered schedules
  const displayedSchedules = useMemo(() => {
    return batchSchedules
      .filter(s => s.isActive)
      .filter(s => (activeDayFilter === 'ALL' ? true : s.dayOfWeek === activeDayFilter))
      .sort((a, b) => {
        if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
        return a.startTime.localeCompare(b.startTime);
      });
  }, [batchSchedules, activeDayFilter]);

  // Conflict Detection Logic (Room double-booking & Teacher double-booking)
  const checkConflicts = (
    dayOfWeek: number,
    startTime: string,
    endTime: string,
    roomNumber: string,
    batchId: string
  ): { hasConflict: boolean; message?: string } => {
    const targetBatch = batchMap.get(batchId);
    const teacherName = targetBatch?.instructor?.toLowerCase().trim();
    const cleanRoom = roomNumber.toLowerCase().trim();

    for (const s of batchSchedules) {
      if (!s.isActive || s.dayOfWeek !== dayOfWeek) continue;

      // Time overlap condition
      const sStart = s.startTime.slice(0, 5);
      const sEnd = s.endTime.slice(0, 5);
      const isOverlap =
        (startTime >= sStart && startTime < sEnd) ||
        (endTime > sStart && endTime <= sEnd) ||
        (startTime <= sStart && endTime >= sEnd);

      if (isOverlap) {
        // 1. Check Room Collision
        if (s.roomNumber && s.roomNumber.toLowerCase().trim() === cleanRoom) {
          const bookedBatch = batchMap.get(s.batchId);
          return {
            hasConflict: true,
            message: `Room Collision: "${roomNumber}" is already booked on this day between ${sStart} and ${sEnd} for batch "${bookedBatch?.name || s.batchId}".`,
          };
        }

        // 2. Check Teacher Collision
        if (teacherName) {
          const bookedBatch = batchMap.get(s.batchId);
          if (bookedBatch && bookedBatch.instructor.toLowerCase().trim() === teacherName) {
            return {
              hasConflict: true,
              message: `Teacher Clash: Instructor "${targetBatch?.instructor}" is already teaching batch "${bookedBatch.name}" between ${sStart} and ${sEnd} on this day.`,
            };
          }
        }
      }
    }

    return { hasConflict: false };
  };

  const handleOpenAdd = () => {
    setFormBatchId(batches[0]?.id || '');
    setFormDayOfWeek(1);
    setFormStartTime('16:30');
    setFormEndTime('18:00');
    setFormRoomNumber('Room 101');
    setFormError('');
    setConflictWarning(null);
    setIsAddModalOpen(true);
  };

  const handleSaveSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formBatchId) {
      setFormError('Please select a batch.');
      return;
    }
    if (formEndTime <= formStartTime) {
      setFormError('Schedule end time must be after start time.');
      return;
    }

    // Run collision check
    const conflict = checkConflicts(
      formDayOfWeek,
      formStartTime,
      formEndTime,
      formRoomNumber,
      formBatchId
    );

    if (conflict.hasConflict) {
      setFormError(conflict.message || 'Schedule conflict detected.');
      return;
    }

    try {
      addBatchSchedule({
        batchId: formBatchId,
        dayOfWeek: formDayOfWeek,
        startTime: `${formStartTime}:00`,
        endTime: `${formEndTime}:00`,
        roomNumber: formRoomNumber.trim() || undefined,
      });
      setIsAddModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save timetable slot.');
    }
  };

  return (
    <div className="timetable-page">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1>Institute Timetable & Room Allocations</h1>
          <p>Comprehensive weekly schedule, teacher assignments, and collision detection.</p>
        </div>

        {canManageTimetable && (
          <div className="page-actions-group">
            <Button
              variant="primary"
              icon={<Plus size={16} />}
              onClick={handleOpenAdd}
            >
              Add Schedule Slot
            </Button>
          </div>
        )}
      </div>

      {/* Day Filter Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '8px',
          marginBottom: '20px',
        }}
      >
        <button
          onClick={() => setActiveDayFilter('ALL')}
          style={{
            height: 40,
            padding: '0 16px',
            borderRadius: '8px',
            border: activeDayFilter === 'ALL' ? '1.5px solid #2563eb' : '1px solid var(--color-border)',
            backgroundColor: activeDayFilter === 'ALL' ? '#eff6ff' : '#ffffff',
            color: activeDayFilter === 'ALL' ? '#2563eb' : 'var(--color-text-secondary)',
            fontWeight: activeDayFilter === 'ALL' ? 700 : 500,
            fontSize: '13.5px',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          All Days (Mon–Sat)
        </button>

        {DAYS.map(day => (
          <button
            key={day.value}
            onClick={() => setActiveDayFilter(day.value)}
            style={{
              height: 40,
              padding: '0 16px',
              borderRadius: '8px',
              border: activeDayFilter === day.value ? '1.5px solid #2563eb' : '1px solid var(--color-border)',
              backgroundColor: activeDayFilter === day.value ? '#eff6ff' : '#ffffff',
              color: activeDayFilter === day.value ? '#2563eb' : 'var(--color-text-secondary)',
              fontWeight: activeDayFilter === day.value ? 700 : 500,
              fontSize: '13.5px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {day.label}
          </button>
        ))}
      </div>

      {/* Timetable Cards Grid */}
      {displayedSchedules.length === 0 ? (
        <Card>
          <CardBody style={{ textAlign: 'center', padding: '48px 20px' }}>
            <Calendar size={40} style={{ color: '#94a3b8', margin: '0 auto 12px auto' }} />
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 6px 0' }}>
              No Schedule Slots Configured
            </h3>
            <p style={{ fontSize: '13.5px', color: 'var(--color-text-secondary)', margin: '0 0 16px 0' }}>
              No timetable classes found for the selected day. Click "Add Schedule Slot" to assign batches, teachers, and classrooms.
            </p>
            {canManageTimetable && (
              <Button variant="primary" icon={<Plus size={16} />} onClick={handleOpenAdd}>
                Add Timetable Slot
              </Button>
            )}
          </CardBody>
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {displayedSchedules.map(schedule => {
            const batch = batchMap.get(schedule.batchId);
            const dayName = DAYS.find(d => d.value === schedule.dayOfWeek)?.label || `Day ${schedule.dayOfWeek}`;
            const enrolledCount = students.filter(s => s.batchId === schedule.batchId && s.status === 'active').length;

            return (
              <div
                key={schedule.id}
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid var(--color-border)',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: 'var(--shadow-xs)',
                  gap: '12px',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: 700,
                        backgroundColor: '#eff6ff',
                        color: '#2563eb',
                        padding: '2px 8px',
                        borderRadius: '6px',
                      }}
                    >
                      {dayName}
                    </span>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        backgroundColor: '#f1f5f9',
                        color: '#475569',
                        padding: '2px 6px',
                        borderRadius: '4px',
                      }}
                    >
                      {batch?.code || 'BATCH'}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--color-text-main)' }}>
                    {batch?.name || 'Class Batch'}
                  </h3>

                  <p style={{ fontSize: '12.5px', color: '#64748b', margin: '0 0 10px 0' }}>
                    {batch?.course}
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={14} style={{ color: '#2563eb' }} />
                      <strong style={{ color: '#0f172a' }}>
                        {schedule.startTime.slice(0, 5)} - {schedule.endTime.slice(0, 5)}
                      </strong>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <MapPin size={14} style={{ color: '#2563eb' }} />
                      <span>{schedule.roomNumber || 'Room Allocated'}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Users size={14} style={{ color: '#2563eb' }} />
                      <span>Instructor: <strong>{batch?.instructor || 'Faculty'}</strong></span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>
                    {enrolledCount} Students Enrolled
                  </span>

                  {canManageTimetable && (
                    <button
                      onClick={() => deleteBatchSchedule(schedule.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#dc2626',
                        fontSize: '12px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        cursor: 'pointer',
                        padding: '4px',
                      }}
                      title="Remove schedule slot"
                    >
                      <Trash2 size={14} />
                      <span>Remove</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Schedule Slot Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Schedule Classroom Timetable Slot"
        size="large"
        footer={
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveSchedule}>
              Save Slot
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSaveSchedule} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {formError && (
            <div style={{ padding: '8px 12px', backgroundColor: '#fef2f2', color: '#b91c1c', borderRadius: '6px', fontSize: '13px' }}>
              {formError}
            </div>
          )}

          <Select
            label="Batch *"
            value={formBatchId}
            onChange={e => setFormBatchId(e.target.value)}
            options={batches.map(b => ({
              value: b.id,
              label: `${b.name} (${b.instructor})`,
            }))}
          />

          <Select
            label="Day of Week *"
            value={formDayOfWeek.toString()}
            onChange={e => setFormDayOfWeek(Number(e.target.value))}
            options={DAYS.map(d => ({
              value: d.value.toString(),
              label: d.label,
            }))}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Input
              label="Start Time *"
              type="time"
              value={formStartTime}
              onChange={e => setFormStartTime(e.target.value)}
              required
            />

            <Input
              label="End Time *"
              type="time"
              value={formEndTime}
              onChange={e => setFormEndTime(e.target.value)}
              required
            />
          </div>

          <Input
            label="Classroom Allocation *"
            placeholder="e.g. Room 101, Room 102, Science Lab"
            value={formRoomNumber}
            onChange={e => setFormRoomNumber(e.target.value)}
            required
          />

          <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: 0 }}>
            * Automated collision detection checks for room double-booking and teacher schedule clashes on submission.
          </p>
        </form>
      </Modal>
    </div>
  );
};
